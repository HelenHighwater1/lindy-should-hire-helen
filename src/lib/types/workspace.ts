export type ContactId = string;
export type EmailId = string;
export type CalendarEventId = string;

export interface Contact {
  id: ContactId;
  name: string;
  email: string;
}

export type EmailStatus = "inbox" | "draft" | "sent";

export interface Email {
  id: EmailId;
  threadId: string;
  from: Contact;
  to: Contact[];
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  status: EmailStatus;
}

export type CalendarEventKind = "meeting" | "focus";

export interface CalendarEvent {
  id: CalendarEventId;
  title: string;
  start: string;
  end: string;
  attendees: Contact[];
  description: string;
  type: CalendarEventKind;
}

export interface WorkspaceData {
  contacts: Contact[];
  emails: Email[];
  calendarEvents: CalendarEvent[];
}
