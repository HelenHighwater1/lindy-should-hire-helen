import type { CalendarEvent, Email } from "./workspace";
import type { TraceStep } from "./agent";

export interface ChatMessage {
  type: "chat";
  payload: { text: string };
}

export type ClientMessage = ChatMessage;

export interface ChatReplyMessage {
  type: "chat_reply";
  payload: { text: string };
}

export interface ErrorMessage {
  type: "error";
  payload: { message: string };
}

export interface TraceStepMessage {
  type: "trace_step";
  payload: TraceStep;
}

export type WorkspaceMutation =
  | { type: "add_calendar_event"; data: CalendarEvent }
  | {
      type: "update_calendar_event";
      data: {
        id: string;
        patch: Partial<Omit<CalendarEvent, "id">>;
      };
    }
  | { type: "remove_calendar_event"; data: { id: string } }
  | { type: "add_email"; data: Email };

export interface WorkspaceUpdateMessage {
  type: "workspace_update";
  payload: WorkspaceMutation;
}

export interface AgentDoneMessage {
  type: "agent_done";
}

export type ServerMessage =
  | ChatReplyMessage
  | ErrorMessage
  | TraceStepMessage
  | WorkspaceUpdateMessage
  | AgentDoneMessage;
