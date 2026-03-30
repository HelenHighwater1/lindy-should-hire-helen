import { create } from "zustand";

import { initialWorkspaceData } from "@/lib/data/seed";
import {
  addCalendarEvent as addCalendarEventData,
  addEmail as addEmailData,
  markEmailRead as markEmailReadData,
  updateCalendarEvent as updateCalendarEventData,
} from "@/lib/data/workspace-helpers";
import type { CalendarEvent, Email, WorkspaceData } from "@/lib/types";

function sliceData(state: WorkspaceData): WorkspaceData {
  return {
    contacts: state.contacts,
    emails: state.emails,
    calendarEvents: state.calendarEvents,
  };
}

export type WorkspaceStore = WorkspaceData & {
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (
    id: string,
    patch: Partial<Omit<CalendarEvent, "id">>,
  ) => void;
  addEmail: (email: Email) => void;
  markEmailRead: (id: string) => void;
  reset: () => void;
};

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  contacts: initialWorkspaceData.contacts,
  emails: initialWorkspaceData.emails,
  calendarEvents: initialWorkspaceData.calendarEvents,

  addCalendarEvent: (event) =>
    set(() => addCalendarEventData(sliceData(get()), event)),

  updateCalendarEvent: (id, patch) =>
    set(() => updateCalendarEventData(sliceData(get()), id, patch)),

  addEmail: (email) => set(() => addEmailData(sliceData(get()), email)),

  markEmailRead: (id) => set(() => markEmailReadData(sliceData(get()), id)),

  reset: () =>
    set({
      contacts: [...initialWorkspaceData.contacts],
      emails: [...initialWorkspaceData.emails],
      calendarEvents: [...initialWorkspaceData.calendarEvents],
    }),
}));
