export type AgentActionType =
  | "schedule_meeting"
  | "reschedule_meeting"
  | "send_email"
  | "summarize_thread"
  | "block_focus_time"
  | "meeting_prep";

export interface AgentAction {
  type: AgentActionType;
  payload: Record<string, unknown>;
}

export type TraceStepStatus = "running" | "done" | "error";

export interface TraceStep {
  id: string;
  label: string;
  status: TraceStepStatus;
  detail?: string;
  timestamp: string;
}
