export type AgentActionType =
  | "schedule_meeting"
  | "reschedule_meeting"
  | "cancel_meeting"
  | "send_email"
  | "summarize_thread"
  | "block_focus_time"
  | "meeting_prep";

export interface AgentAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
}

/** Result of interpreting a user message (LLM reply + optional structured action). */
export interface LLMResult {
  reply: string;
  action: AgentAction | null;
}

export type TraceStepStatus = "running" | "done" | "error";

/** High-level grouping for trace UI (thinking vs tool vs result). */
export type TraceStepKind = "thinking" | "tool" | "result";

export interface TraceStep {
  id: string;
  label: string;
  status: TraceStepStatus;
  detail?: string;
  timestamp: string;
  kind?: TraceStepKind;
}
