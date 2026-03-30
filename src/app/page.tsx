"use client";

import { useWorkspaceStore } from "@/lib/store/workspace-store";

export default function Home() {
  const contacts = useWorkspaceStore((s) => s.contacts.length);
  const emails = useWorkspaceStore((s) => s.emails.length);
  const events = useWorkspaceStore((s) => s.calendarEvents.length);

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Lindy Demo</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Workspace (smoke): {contacts} contacts, {emails} emails, {events}{" "}
        calendar events
      </p>
    </main>
  );
}
