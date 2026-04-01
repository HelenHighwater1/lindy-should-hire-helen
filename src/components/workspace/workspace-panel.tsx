"use client";

import { useState } from "react";

import { CalendarList } from "@/components/workspace/calendar-list";
import { ContactList } from "@/components/workspace/contact-list";
import { EmailList, EmailTabs } from "@/components/workspace/email-list";
import { EmailModal } from "@/components/workspace/email-modal";
import type { Email, EmailStatus } from "@/lib/types";
import { useWorkspaceStore } from "@/lib/store/workspace-store";

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex shrink-0 flex-col border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex shrink-0 items-center justify-between bg-zinc-100/80 px-3 py-1.5 dark:bg-zinc-900/80">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {title}
        </h2>
        {trailing}
      </div>
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
        className="flex w-full shrink-0 items-center justify-between bg-zinc-100/80 px-3 py-1.5 text-left text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:bg-zinc-200/60 dark:bg-zinc-900/80 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
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
  const [emailTab, setEmailTab] = useState<EmailStatus>("inbox");

  return (
    <aside data-tour-panel="left" className="relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex size-7 items-center justify-center rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Workspace
          </h1>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Emails, calendar &amp; contacts
          </p>
        </div>
      </header>
      <div className="panel-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <Section title="Calendar">
          <CalendarList
            events={calendarEvents}
            highlightedIds={highlightedIds}
            highlightEpoch={highlightEpoch}
          />
        </Section>
        <Section
          title="Emails"
          trailing={<EmailTabs emails={emails} activeTab={emailTab} setActiveTab={setEmailTab} />}
        >
          <EmailList
            emails={emails}
            highlightedIds={highlightedIds}
            highlightEpoch={highlightEpoch}
            onOpenEmail={setOpenEmail}
            activeTab={emailTab}
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
