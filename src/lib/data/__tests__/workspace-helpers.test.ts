import { describe, expect, it } from "vitest";

import { initialWorkspaceData } from "@/lib/data/seed";
import {
  addCalendarEvent,
  addEmail,
  getThread,
  markEmailRead,
  updateCalendarEvent,
} from "@/lib/data/workspace-helpers";
import type { CalendarEvent, Email } from "@/lib/types";

describe("workspace-helpers", () => {
  it("addCalendarEvent appends an event", () => {
    const newEvent: CalendarEvent = {
      id: "cal-new",
      title: "New meeting",
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(),
      attendees: [initialWorkspaceData.contacts[0]],
      description: "Test",
      type: "meeting",
    };
    const next = addCalendarEvent(initialWorkspaceData, newEvent);
    expect(next.calendarEvents).toHaveLength(
      initialWorkspaceData.calendarEvents.length + 1,
    );
    expect(next.calendarEvents.at(-1)).toEqual(newEvent);
    expect(next.contacts).toBe(initialWorkspaceData.contacts);
  });

  it("updateCalendarEvent patches fields by id", () => {
    const id = initialWorkspaceData.calendarEvents[0].id;
    const next = updateCalendarEvent(initialWorkspaceData, id, {
      title: "Renamed",
    });
    const updated = next.calendarEvents.find((e) => e.id === id);
    expect(updated?.title).toBe("Renamed");
    expect(updated?.type).toBe(initialWorkspaceData.calendarEvents[0].type);
  });

  it("addEmail appends an email", () => {
    const newEmail: Email = {
      id: "email-new",
      threadId: "thread-x",
      from: initialWorkspaceData.contacts[0],
      to: [initialWorkspaceData.contacts[1]],
      subject: "Hello",
      body: "Body",
      timestamp: new Date().toISOString(),
      read: false,
      status: "inbox",
    };
    const next = addEmail(initialWorkspaceData, newEmail);
    expect(next.emails).toHaveLength(initialWorkspaceData.emails.length + 1);
    expect(next.emails.at(-1)).toEqual(newEmail);
  });

  it("markEmailRead sets read to true", () => {
    const unread = initialWorkspaceData.emails.find((e) => !e.read);
    expect(unread).toBeDefined();
    const next = markEmailRead(initialWorkspaceData, unread!.id);
    const updated = next.emails.find((e) => e.id === unread!.id);
    expect(updated?.read).toBe(true);
  });

  it("getThread returns emails for a thread id", () => {
    const thread = getThread(initialWorkspaceData, "thread-budget");
    expect(thread.length).toBeGreaterThan(0);
    expect(thread.every((e) => e.threadId === "thread-budget")).toBe(true);
  });
});
