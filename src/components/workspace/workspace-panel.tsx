"use client";

import { useState } from "react";

import { CalendarList } from "@/components/workspace/calendar-list";
import { ContactList } from "@/components/workspace/contact-list";
import { EmailList } from "@/components/workspace/email-list";
import { EmailModal } from "@/components/workspace/email-modal";
import type { Email } from "@/lib/types";
import { useWorkspaceStore } from "@/lib/store/workspace-store";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex shrink-0 flex-col border-b border-zinc-200 dark:border-zinc-800">
      <h2 className="shrink-0 bg-zinc-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
        {title}
      </h2>
      <div className="px-2 py-2">{children}</div>
    </section>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="flex shrink-0 flex-col border-b border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full shrink-0 items-center justify-between bg-zinc-100 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600 hover:bg-zinc-200/60 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
      >
        {title}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-2 py-2">{children}</div>}
    </section>
  );
}

export function WorkspacePanel() {
  const contacts = useWorkspaceStore((s) => s.contacts);
  const emails = useWorkspaceStore((s) => s.emails);
  const calendarEvents = useWorkspaceStore((s) => s.calendarEvents);
  const highlightedIds = useWorkspaceStore((s) => s.highlightedIds);
  const highlightEpoch = useWorkspaceStore((s) => s.highlightEpoch);
  const [openEmail, setOpenEmail] = useState<Email | null>(null);

  return (
    <aside className="relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="shrink-0 border-b border-zinc-200 px-3 py-3 dark:border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Workspace
        </h1>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Mock emails, calendar, and contacts
        </p>
      </header>
      <div className="panel-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Section title="Calendar">
          <CalendarList
            events={calendarEvents}
            highlightedIds={highlightedIds}
            highlightEpoch={highlightEpoch}
          />
        </Section>
        <Section title="Emails">
          <EmailList
            emails={emails}
            highlightedIds={highlightedIds}
            highlightEpoch={highlightEpoch}
            onOpenEmail={setOpenEmail}
          />
        </Section>
        <CollapsibleSection title="Contacts">
          <ContactList contacts={contacts} />
        </CollapsibleSection>
      </div>
      <EmailModal email={openEmail} onClose={() => setOpenEmail(null)} />
    </aside>
  );
}
