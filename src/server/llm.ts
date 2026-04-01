import Anthropic from "@anthropic-ai/sdk";
import {
  APIConnectionTimeoutError,
  AnthropicError,
  AuthenticationError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";
import { DISPLAY_TIME_ZONE } from "@/lib/display-timezone";
import type {
  AgentAction,
  AgentActionType,
  LLMResult,
  WorkspaceData,
} from "@/lib/types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const AGENT_ACTION_TYPES: readonly AgentActionType[] = [
  "schedule_meeting",
  "reschedule_meeting",
  "cancel_meeting",
  "send_email",
  "summarize_thread",
  "block_focus_time",
  "meeting_prep",
] as const;

function isAgentActionType(name: string): name is AgentActionType {
  return (AGENT_ACTION_TYPES as readonly string[]).includes(name);
}

export type ProcessChatErrorCode =
  | "missing_api_key"
  | "invalid_api_key"
  | "rate_limit"
  | "timeout"
  | "unknown";

export class ProcessChatError extends Error {
  readonly code: ProcessChatErrorCode;

  constructor(message: string, code: ProcessChatErrorCode) {
    super(message);
    this.name = "ProcessChatError";
    this.code = code;
  }
}

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      timeout: 30_000,
      maxRetries: 0,
    });
  }
  return anthropicClient;
}

function getModel(): string {
  const raw = process.env.ANTHROPIC_MODEL;
  if (raw !== undefined && raw.trim() !== "") {
    return raw.trim();
  }
  return DEFAULT_MODEL;
}

function assertApiKey(): void {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key === undefined || key.trim() === "") {
    throw new ProcessChatError(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file.",
      "missing_api_key",
    );
  }
}

const localTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});

function localTime(iso: string): string {
  try {
    return localTimeFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatCalendarForPrompt(
  events: WorkspaceData["calendarEvents"],
): string {
  return JSON.stringify(
    events.map((ev) => ({
      id: ev.id,
      title: ev.title,
      start: ev.start,
      end: ev.end,
      localStart: localTime(ev.start),
      localEnd: localTime(ev.end),
      attendees: ev.attendees.map((a) => ({ id: a.id, name: a.name })),
      description: ev.description,
      type: ev.type,
    })),
    null,
    2,
  );
}

export function buildSystemPrompt(workspace: WorkspaceData): string {
  const contactsJson = JSON.stringify(workspace.contacts, null, 2);
  const emailsJson = JSON.stringify(
    workspace.emails.map((e) => ({
      id: e.id,
      threadId: e.threadId,
      from: e.from,
      to: e.to,
      subject: e.subject,
      body: e.body,
      timestamp: e.timestamp,
      read: e.read,
      status: e.status,
    })),
    null,
    2,
  );
  const calendarJson = formatCalendarForPrompt(workspace.calendarEvents);
  const now = new Date();
  const nowLocal = localTimeFmt.format(now);

  return `You are Lindy, an AI assistant for Alex Morgan in a simulated desktop workspace (demo app).

Current date/time: ${nowLocal} (${DISPLAY_TIME_ZONE})

IMPORTANT: All ISO 8601 timestamps in the data below are in UTC. The "localStart" / "localEnd" fields show the **user's local time** - always use these when referring to times in your natural-language replies to the user. When calling tools, continue to use ISO 8601 UTC strings.

## Day-of-week scheduling

When the user mentions a day of the week (e.g. "next Wednesday"), you MUST:
1. Calculate the calendar date that corresponds to that day of the week, counting forward from today.
2. Verify the ISO date you produce actually falls on the correct weekday before calling any tool.
3. If "next <day>" is mentioned, it always means the first occurrence of that day strictly after today.
Double-check: does the date you chose land on the weekday the user said? If not, adjust.

## Response format

Reply in plain text. Do NOT use Markdown formatting (no **, no ##, no bullet-point lists with * or -). Use short paragraphs and natural punctuation instead.

When the user asks you to do something that matches a workspace action, call exactly one tool with the correct parameters. Use contact ids and calendar event ids from the data.

If the request is ambiguous or you need more information, reply with a short clarifying message and do not call a tool.

When you call a tool, also include a natural-language reply in the same turn (text before or after the tool is fine).

For read-only / analytical tools (summarize_thread, meeting_prep): your text reply IS the deliverable - write out the full summary, brief, or analysis the user asked for. Do not just say "I'll summarize it"; actually provide the content inline.

GROUNDING RULE: Only cite facts, numbers, names, dates, and action items that appear verbatim in the workspace data above. Do NOT invent attendees, metrics, decisions, or details that are not in the emails or calendar events. If the data is thin, say so - a short accurate summary is better than a long fabricated one.

## Calendar conflict awareness

Before scheduling or rescheduling, mentally check whether the new time range overlaps with any existing events. If it does, still proceed with the tool call but mention the conflict in your reply and suggest a resolution:
- If it conflicts with **one** other event, suggest either shortening the meeting you're moving or pushing the conflicting event out.
- If it conflicts with **multiple** events, suggest shortening the meeting to avoid the overlap - keep the suggestion simple for the user.
Always frame the conflict as a heads-up, not a blocker - the user already asked you to do it, so do it, then warn.

## Contacts, emails, and calendar (JSON)

### contacts
${contactsJson}

### emails
${emailsJson}

### calendarEvents
${calendarJson}`;
}

function workspaceTools(): Tool[] {
  return [
    {
      name: "schedule_meeting",
      description:
        "Schedule a new meeting on the calendar with title, time range, attendees, and optional description.",
      input_schema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting title" },
          attendee_ids: {
            type: "array",
            items: { type: "string" },
            description: "Contact ids of attendees",
          },
          start: { type: "string", description: "ISO 8601 start time" },
          end: { type: "string", description: "ISO 8601 end time" },
          description: {
            type: "string",
            description: "Optional agenda or notes",
          },
        },
        required: ["title", "attendee_ids", "start", "end"],
      },
    },
    {
      name: "reschedule_meeting",
      description:
        "Move an existing calendar event to a new start and end time.",
      input_schema: {
        type: "object",
        properties: {
          event_id: { type: "string", description: "Calendar event id" },
          new_start: { type: "string", description: "ISO 8601 new start" },
          new_end: { type: "string", description: "ISO 8601 new end" },
        },
        required: ["event_id", "new_start", "new_end"],
      },
    },
    {
      name: "cancel_meeting",
      description:
        "Cancel / remove an existing calendar event.",
      input_schema: {
        type: "object",
        properties: {
          event_id: {
            type: "string",
            description: "Calendar event id to cancel",
          },
        },
        required: ["event_id"],
      },
    },
    {
      name: "send_email",
      description: "Draft and send an email to one or more contacts.",
      input_schema: {
        type: "object",
        properties: {
          to_contact_ids: {
            type: "array",
            items: { type: "string" },
            description: "Recipient contact ids",
          },
          subject: { type: "string" },
          body: { type: "string" },
        },
        required: ["to_contact_ids", "subject", "body"],
      },
    },
    {
      name: "summarize_thread",
      description:
        "Summarize an email thread by thread id. You MUST include the full summary and suggested next steps in your text reply - the tool itself only signals which thread you analyzed.",
      input_schema: {
        type: "object",
        properties: {
          thread_id: { type: "string", description: "Email thread id" },
        },
        required: ["thread_id"],
      },
    },
    {
      name: "block_focus_time",
      description: "Block focus time on the calendar.",
      input_schema: {
        type: "object",
        properties: {
          start: { type: "string", description: "ISO 8601 start" },
          end: { type: "string", description: "ISO 8601 end" },
          title: {
            type: "string",
            description: "Optional title (default: focus block)",
          },
        },
        required: ["start", "end"],
      },
    },
    {
      name: "meeting_prep",
      description:
        "Generate a meeting prep brief for an upcoming calendar event. You MUST include the full prep brief (attendees, agenda, talking points) in your text reply - the tool itself only signals which event you prepared for.",
      input_schema: {
        type: "object",
        properties: {
          event_id: { type: "string", description: "Calendar event id" },
        },
        required: ["event_id"],
      },
    },
  ];
}

function toolInputToPayload(input: unknown): Record<string, unknown> {
  if (typeof input === "object" && input !== null && !Array.isArray(input)) {
    return { ...(input as Record<string, unknown>) };
  }
  return {};
}

function extractFromMessage(message: Anthropic.Message): LLMResult {
  const textParts: string[] = [];
  const actions: AgentAction[] = [];

  for (const block of message.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    } else if (block.type === "tool_use") {
      if (isAgentActionType(block.name)) {
        actions.push({
          type: block.name,
          payload: toolInputToPayload(block.input),
        });
      }
    }
  }

  const reply =
    textParts.join("\n").trim() ||
    (actions.length > 0
      ? "I've queued those workspace actions based on your request."
      : "I couldn't produce a reply. Please try rephrasing your request.");

  return { reply, actions };
}

function mapAnthropicError(err: unknown): ProcessChatError {
  if (err instanceof AuthenticationError) {
    return new ProcessChatError(
      "Invalid or expired Anthropic API key.",
      "invalid_api_key",
    );
  }
  if (err instanceof RateLimitError) {
    return new ProcessChatError(
      "Anthropic rate limit reached. Try again in a moment.",
      "rate_limit",
    );
  }
  if (err instanceof APIConnectionTimeoutError) {
    return new ProcessChatError(
      "The request to the language model timed out.",
      "timeout",
    );
  }
  if (err instanceof AnthropicError) {
    return new ProcessChatError(
      err.message || "Anthropic API error",
      "unknown",
    );
  }
  if (err instanceof Error) {
    return new ProcessChatError(err.message, "unknown");
  }
  return new ProcessChatError(
    "Unknown error while calling the model.",
    "unknown",
  );
}

export type ChatTurn = { role: "user" | "assistant"; content: string };

type ApiMessage = {
  role: "user" | "assistant";
  content: string | Anthropic.Messages.ContentBlockParam[];
};

/**
 * Interpret a user chat line against workspace context via Anthropic Messages API + tools.
 * Implements the full tool-use round-trip: when Claude returns a tool_use block we
 * send back a tool_result so it can generate a proper text reply.
 */
export async function processChat(
  text: string,
  workspace: WorkspaceData,
  history: ChatTurn[] = [],
): Promise<LLMResult> {
  assertApiKey();
  const client = getAnthropic();
  const model = getModel();
  const system = buildSystemPrompt(workspace);
  const tools = workspaceTools();

  const messages: ApiMessage[] = [
    ...history.map((t): ApiMessage => ({ role: t.role, content: t.content })),
    { role: "user", content: text.trim() },
  ];

  try {
    let message = await client.messages.create(
      {
        model,
        max_tokens: 2048,
        system,
        tools,
        tool_choice: { type: "auto" },
        messages,
      },
      { timeout: 30_000 },
    );

    let accumulated = extractFromMessage(message);

    while (message.stop_reason === "tool_use") {
      const toolUseBlocks = message.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
      );
      if (toolUseBlocks.length === 0) break;

      messages.push({ role: "assistant", content: message.content as Anthropic.Messages.ContentBlockParam[] });
      messages.push({
        role: "user",
        content: toolUseBlocks.map((block) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: `Action "${block.name}" executed successfully.`,
        })),
      });

      message = await client.messages.create(
        {
          model,
          max_tokens: 2048,
          system,
          tools,
          tool_choice: { type: "auto" },
          messages,
        },
        { timeout: 30_000 },
      );

      const followUp = extractFromMessage(message);
      accumulated = {
        reply: followUp.reply || accumulated.reply,
        actions: [...accumulated.actions, ...followUp.actions],
      };
    }

    return accumulated;
  } catch (err) {
    throw mapAnthropicError(err);
  }
}
