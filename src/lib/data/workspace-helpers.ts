import type {
  CalendarEvent,
  CalendarEventId,
  Email,
  EmailId,
  WorkspaceData,
} from "@/lib/types";

export function addCalendarEvent(
  data: WorkspaceData,
  event: CalendarEvent,
): WorkspaceData {
  return {
    ...data,
    calendarEvents: [...data.calendarEvents, event],
  };
}

export function updateCalendarEvent(
  data: WorkspaceData,
  id: CalendarEventId,
  patch: Partial<Omit<CalendarEvent, "id">>,
): WorkspaceData {
  return {
    ...data,
    calendarEvents: data.calendarEvents.map((ev) =>
      ev.id === id ? { ...ev, ...patch, id: ev.id } : ev,
    ),
  };
}

export function addEmail(data: WorkspaceData, email: Email): WorkspaceData {
  return {
    ...data,
    emails: [...data.emails, email],
  };
}

export function markEmailRead(data: WorkspaceData, id: EmailId): WorkspaceData {
  return {
    ...data,
    emails: data.emails.map((email) =>
      email.id === id ? { ...email, read: true } : email,
    ),
  };
}

export function getThread(data: WorkspaceData, threadId: string): Email[] {
  return data.emails.filter((email) => email.threadId === threadId);
}
