import {
  addCalendarEvent,
  addEmail,
  getThread,
  removeCalendarEvent,
  updateCalendarEvent,
} from "@/lib/data/workspace-helpers";
import type {
  AgentAction,
  CalendarEvent,
  Contact,
  Email,
  TraceStep,
  WorkspaceData,
  WorkspaceMutation,
} from "@/lib/types";
import type { ServerMessage } from "@/lib/types/protocol";
import { type ChatTurn, ProcessChatError, processChat } from "@/server/llm";

const STEP_DELAY_MS = 300;

const conflictTimeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function fmtTime(iso: string): string {
  try {
    return conflictTimeFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

interface CalendarConflict {
  event: CalendarEvent;
  overlapMinutes: number;
}

/**
 * Find events in the workspace that overlap with a given time range,
 * excluding the event itself (by id).
 */
function findConflicts(
  workspace: WorkspaceData,
  start: string,
  end: string,
  excludeId: string,
): CalendarConflict[] {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e)) return [];

  const conflicts: CalendarConflict[] = [];
  for (const ev of workspace.calendarEvents) {
    if (ev.id === excludeId) continue;
    const evS = new Date(ev.start).getTime();
    const evE = new Date(ev.end).getTime();
    if (Number.isNaN(evS) || Number.isNaN(evE)) continue;
    const overlapStart = Math.max(s, evS);
    const overlapEnd = Math.min(e, evE);
    if (overlapStart < overlapEnd) {
      conflicts.push({
        event: ev,
        overlapMinutes: Math.round((overlapEnd - overlapStart) / 60_000),
      });
    }
  }
  return conflicts;
}

function buildConflictWarning(conflicts: CalendarConflict[]): string | null {
  if (conflicts.length === 0) return null;

  if (conflicts.length === 1) {
    const c = conflicts[0];
    return (
      `\n\n⚠️ **Heads up — this now overlaps with "${c.event.title}"** ` +
      `(${fmtTime(c.event.start)}–${fmtTime(c.event.end)}, ${c.overlapMinutes} min overlap). ` +
      `Would you like me to shorten this meeting to remove the conflict, ` +
      `or push "${c.event.title}" out to start after this one ends?`
    );
  }

  const names = conflicts.map(
    (c) => `"${c.event.title}" (${fmtTime(c.event.start)}–${fmtTime(c.event.end)})`,
  );
  return (
    `\n\n⚠️ **Heads up — this overlaps with ${conflicts.length} events:** ` +
    `${names.join(", ")}. ` +
    `Would you like me to shorten this meeting so it no longer conflicts?`
  );
}

function randomId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Deep-clone workspace for an isolated WebSocket connection. */
export function cloneWorkspaceForConnection(
  data: WorkspaceData,
): WorkspaceData {
  return {
    contacts: data.contacts.map((c) => ({ ...c })),
    emails: data.emails.map((e) => ({
      ...e,
      from: { ...e.from },
      to: e.to.map((t) => ({ ...t })),
    })),
    calendarEvents: data.calendarEvents.map((ev) => ({
      ...ev,
      attendees: ev.attendees.map((a) => ({ ...a })),
    })),
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function step(
  id: string,
  label: string,
  status: TraceStep["status"],
  kind: NonNullable<TraceStep["kind"]>,
  detail?: string,
): TraceStep {
  return {
    id,
    label,
    status,
    kind,
    detail,
    timestamp: nowIso(),
  };
}

function getSelfContact(workspace: WorkspaceData): Contact {
  const self = workspace.contacts.find((c) => c.id === "contact-self");
  if (!self) {
    throw new Error("contact-self missing from workspace");
  }
  return self;
}

function resolveContacts(
  workspace: WorkspaceData,
  ids: unknown,
  label: string,
): Contact[] {
  if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string")) {
    throw new Error(`${label}: invalid contact id list`);
  }
  const contacts: Contact[] = [];
  for (const id of ids) {
    const c = workspace.contacts.find((x) => x.id === id);
    if (!c) {
      throw new Error(`${label}: unknown contact id "${id}"`);
    }
    contacts.push(c);
  }
  return contacts;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Invalid or missing string field: ${field}`);
  }
  return value;
}

function getAffectedEventId(
  action: AgentAction,
  exec: ExecuteActionResult,
): string | null {
  if (action.type === "reschedule_meeting") {
    return typeof action.payload.event_id === "string"
      ? action.payload.event_id
      : null;
  }
  if (
    action.type === "schedule_meeting" ||
    action.type === "block_focus_time"
  ) {
    if (exec.mutation?.type === "add_calendar_event") {
      return exec.mutation.data.id;
    }
  }
  return null;
}

export interface ExecuteActionResult {
  mutation: WorkspaceMutation | null;
  workspace: WorkspaceData;
  outcomeDetail: string;
}

/**
 * Applies a structured LLM action to workspace data and returns a client mutation (if any).
 */
export function executeAction(
  action: AgentAction,
  workspace: WorkspaceData,
): ExecuteActionResult {
  const w = cloneWorkspaceForConnection(workspace);
  const p = action.payload;

  switch (action.type) {
    case "schedule_meeting": {
      const title = asString(p.title, "title");
      const start = asString(p.start, "start");
      const end = asString(p.end, "end");
      const attendees = resolveContacts(w, p.attendee_ids, "schedule_meeting");
      const description =
        typeof p.description === "string" ? p.description : "";
      const event: CalendarEvent = {
        id: randomId("cal"),
        title,
        start,
        end,
        attendees,
        description,
        type: "meeting",
      };
      const next = addCalendarEvent(w, event);
      return {
        mutation: { type: "add_calendar_event", data: event },
        workspace: next,
        outcomeDetail: `Scheduled "${title}" (${attendees.map((a) => a.name).join(", ")})`,
      };
    }
    case "reschedule_meeting": {
      const eventId = asString(p.event_id, "event_id");
      const newStart = asString(p.new_start, "new_start");
      const newEnd = asString(p.new_end, "new_end");
      const ev = w.calendarEvents.find((e) => e.id === eventId);
      if (!ev) {
        throw new Error(`Unknown calendar event id "${eventId}"`);
      }
      const patch = { start: newStart, end: newEnd };
      const next = updateCalendarEvent(w, eventId, patch);
      return {
        mutation: {
          type: "update_calendar_event",
          data: { id: eventId, patch },
        },
        workspace: next,
        outcomeDetail: `Rescheduled "${ev.title}"`,
      };
    }
    case "cancel_meeting": {
      const eventId = asString(p.event_id, "event_id");
      const ev = w.calendarEvents.find((e) => e.id === eventId);
      if (!ev) {
        throw new Error(`Unknown calendar event id "${eventId}"`);
      }
      const next = removeCalendarEvent(w, eventId);
      return {
        mutation: { type: "remove_calendar_event", data: { id: eventId } },
        workspace: next,
        outcomeDetail: `Cancelled "${ev.title}"`,
      };
    }
    case "send_email": {
      const to = resolveContacts(w, p.to_contact_ids, "send_email");
      const subject = asString(p.subject, "subject");
      const body = asString(p.body, "body");
      const from = getSelfContact(w);
      const email: Email = {
        id: randomId("email"),
        threadId: randomId("thread"),
        from,
        to,
        subject,
        body,
        timestamp: nowIso(),
        read: true,
        status: "sent",
      };
      const next = addEmail(w, email);
      return {
        mutation: { type: "add_email", data: email },
        workspace: next,
        outcomeDetail: `Sent email "${subject}" to ${to.map((x) => x.name).join(", ")}`,
      };
    }
    case "block_focus_time": {
      const start = asString(p.start, "start");
      const end = asString(p.end, "end");
      const title =
        typeof p.title === "string" && p.title.trim() !== ""
          ? p.title
          : "Focus time";
      const self = getSelfContact(w);
      const event: CalendarEvent = {
        id: randomId("cal"),
        title,
        start,
        end,
        attendees: [self],
        description: "Focus block",
        type: "focus",
      };
      const next = addCalendarEvent(w, event);
      return {
        mutation: { type: "add_calendar_event", data: event },
        workspace: next,
        outcomeDetail: `Blocked focus time: ${title}`,
      };
    }
    case "summarize_thread": {
      const threadId = asString(p.thread_id, "thread_id");
      const thread = getThread(w, threadId);
      if (thread.length === 0) {
        throw new Error(`No emails found for thread "${threadId}"`);
      }
      return {
        mutation: null,
        workspace: w,
        outcomeDetail: `Summarized thread (${thread.length} message(s)) — see chat for summary and next steps.`,
      };
    }
    case "meeting_prep": {
      const eventId = asString(p.event_id, "event_id");
      const ev = w.calendarEvents.find((e) => e.id === eventId);
      if (!ev) {
        throw new Error(`Unknown calendar event id "${eventId}"`);
      }
      return {
        mutation: null,
        workspace: w,
        outcomeDetail: `Meeting prep for "${ev.title}" — see chat for the brief.`,
      };
    }
    default: {
      const _exhaustive: never = action.type;
      throw new Error(`Unsupported action: ${_exhaustive}`);
    }
  }
}

export interface AgentRunResult {
  workspace: WorkspaceData;
  history: ChatTurn[];
}

/**
 * Runs the agent pipeline: trace steps, LLM, optional workspace mutation, chat reply.
 * Returns updated workspace + conversation history for multi-turn context.
 */
export async function runAgent(
  text: string,
  workspace: WorkspaceData,
  emit: (msg: ServerMessage) => void,
  history: ChatTurn[] = [],
): Promise<AgentRunResult> {
  let current = cloneWorkspaceForConnection(workspace);
  const nextHistory = [...history, { role: "user" as const, content: text }];

  const emitStep = (s: TraceStep) => {
    emit({ type: "trace_step", payload: s });
  };

  const finishError = (message: string, detail?: string) => {
    emitStep(
      step(
        "thinking",
        "Understanding your request",
        "error",
        "thinking",
        detail,
      ),
    );
    emit({ type: "error", payload: { message } });
    emit({ type: "agent_done" });
  };

  emitStep(
    step("thinking", "Understanding your request", "running", "thinking"),
  );
  await delay(STEP_DELAY_MS);

  let result;
  try {
    result = await processChat(text, current, history);
  } catch (err) {
    const msg =
      err instanceof ProcessChatError ? err.message : "Failed to run assistant";
    finishError(msg, err instanceof Error ? err.message : undefined);
    return { workspace: current, history: nextHistory };
  }

  emitStep(
    step(
      "thinking",
      "Understanding your request",
      "done",
      "thinking",
      result.reply.length > 160
        ? `${result.reply.slice(0, 157)}…`
        : result.reply,
    ),
  );
  await delay(STEP_DELAY_MS);

  if (!result.action) {
    emitStep(
      step(
        "result",
        "Result",
        "running",
        "result",
        "No workspace changes needed for this request.",
      ),
    );
    await delay(STEP_DELAY_MS);
    emitStep(
      step(
        "result",
        "Result",
        "done",
        "result",
        "Replied in chat — no calendar or email updates.",
      ),
    );
    emit({ type: "chat_reply", payload: { text: result.reply } });
    emit({ type: "agent_done" });
    const doneHistory = [
      ...nextHistory,
      { role: "assistant" as const, content: result.reply },
    ];
    return { workspace: current, history: doneHistory };
  }

  const actionLabel = `Tool: ${result.action.type.replace(/_/g, " ")}`;
  emitStep(step("tool", actionLabel, "running", "tool"));
  await delay(STEP_DELAY_MS);

  let exec: ExecuteActionResult;
  try {
    exec = executeAction(result.action, current);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Action failed";
    emitStep(step("tool", actionLabel, "error", "tool", msg));
    emit({ type: "error", payload: { message: msg } });
    emit({ type: "agent_done" });
    return { workspace: current, history: nextHistory };
  }

  current = exec.workspace;

  if (exec.mutation) {
    emit({ type: "workspace_update", payload: exec.mutation });
  }

  emitStep(step("tool", actionLabel, "done", "tool", exec.outcomeDetail));
  await delay(STEP_DELAY_MS);

  // Check for calendar conflicts after schedule/reschedule/focus actions
  let replyText = result.reply;
  const calendarActions = new Set([
    "schedule_meeting",
    "reschedule_meeting",
    "block_focus_time",
  ]);
  if (result.action && calendarActions.has(result.action.type)) {
    const affectedId = getAffectedEventId(result.action, exec);
    if (affectedId) {
      const ev = current.calendarEvents.find((e) => e.id === affectedId);
      if (ev) {
        const conflicts = findConflicts(current, ev.start, ev.end, ev.id);
        const warning = buildConflictWarning(conflicts);
        if (warning) {
          replyText += warning;
        }
      }
    }
  }

  emitStep(step("result", "Result", "running", "result", exec.outcomeDetail));
  await delay(STEP_DELAY_MS);
  emitStep(step("result", "Result", "done", "result", exec.outcomeDetail));

  emit({ type: "chat_reply", payload: { text: replyText } });
  emit({ type: "agent_done" });
  const finalHistory = [
    ...nextHistory,
    { role: "assistant" as const, content: replyText },
  ];
  return { workspace: current, history: finalHistory };
}
