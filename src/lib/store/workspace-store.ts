import { create } from "zustand";

import { initialWorkspaceData } from "@/lib/data/seed";
import {
  addCalendarEvent as addCalendarEventData,
  addEmail as addEmailData,
  markEmailRead as markEmailReadData,
  removeCalendarEvent as removeCalendarEventData,
  updateCalendarEvent as updateCalendarEventData,
} from "@/lib/data/workspace-helpers";
import type {
  CalendarEvent,
  Email,
  WorkspaceData,
  WorkspaceMutation,
} from "@/lib/types";

function sliceData(state: WorkspaceData): WorkspaceData {
  return {
    contacts: state.contacts,
    emails: state.emails,
    calendarEvents: state.calendarEvents,
  };
}

export type WorkspaceStore = WorkspaceData & {
  /** IDs that recently changed via agent mutations (for glow UI). */
  highlightedIds: Set<string>;
  /** Bumped per highlight so list keys remount and replay animation. */
  highlightEpoch: Record<string, number>;
  highlightItem: (id: string) => void;
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (
    id: string,
    patch: Partial<Omit<CalendarEvent, "id">>,
  ) => void;
  addEmail: (email: Email) => void;
  markEmailRead: (id: string) => void;
  applyMutation: (mutation: WorkspaceMutation) => void;
  reset: () => void;
};

const HIGHLIGHT_MS = 3000;

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  contacts: initialWorkspaceData.contacts,
  emails: initialWorkspaceData.emails,
  calendarEvents: initialWorkspaceData.calendarEvents,
  highlightedIds: new Set<string>(),
  highlightEpoch: {},

  highlightItem: (id: string) => {
    set((state) => {
      const nextSet = new Set(state.highlightedIds);
      nextSet.add(id);
      const nextEpoch = {
        ...state.highlightEpoch,
        [id]: (state.highlightEpoch[id] ?? 0) + 1,
      };
      setTimeout(() => {
        set((st) => {
          const ns = new Set(st.highlightedIds);
          ns.delete(id);
          return { highlightedIds: ns };
        });
      }, HIGHLIGHT_MS);
      return {
        highlightedIds: nextSet,
        highlightEpoch: nextEpoch,
      };
    });
  },

  addCalendarEvent: (event) =>
    set(() => addCalendarEventData(sliceData(get()), event)),

  updateCalendarEvent: (id, patch) =>
    set(() => updateCalendarEventData(sliceData(get()), id, patch)),

  addEmail: (email) => set(() => addEmailData(sliceData(get()), email)),

  markEmailRead: (id) => set(() => markEmailReadData(sliceData(get()), id)),

  applyMutation: (mutation) => {
    let highlightId: string | null = null;
    set((state) => {
      const data = sliceData(state);
      switch (mutation.type) {
        case "add_calendar_event":
          highlightId = mutation.data.id;
          return addCalendarEventData(data, mutation.data);
        case "update_calendar_event":
          highlightId = mutation.data.id;
          return updateCalendarEventData(
            data,
            mutation.data.id,
            mutation.data.patch,
          );
        case "remove_calendar_event":
          return removeCalendarEventData(data, mutation.data.id);
        case "add_email":
          highlightId = mutation.data.id;
          return addEmailData(data, mutation.data);
        default: {
          const _x: never = mutation;
          return _x;
        }
      }
    });
    if (highlightId) {
      get().highlightItem(highlightId);
    }
  },

  reset: () =>
    set({
      contacts: [...initialWorkspaceData.contacts],
      emails: [...initialWorkspaceData.emails],
      calendarEvents: [...initialWorkspaceData.calendarEvents],
      highlightedIds: new Set(),
      highlightEpoch: {},
    }),
}));
