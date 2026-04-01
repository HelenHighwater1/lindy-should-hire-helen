import { type Dispatch, type SetStateAction, useState } from "react";

import { DISPLAY_TIME_ZONE } from "@/lib/display-timezone";
import type { Email, EmailStatus } from "@/lib/types";

export function EmailTabs({
  emails,
  activeTab,
  setActiveTab,
}: {
  emails: Email[];
  activeTab: EmailStatus;
  setActiveTab: Dispatch<SetStateAction<EmailStatus>>;
}) {
  const tabs: { id: EmailStatus; label: string }[] = [
    { id: "inbox", label: "Inbox" },
    { id: "sent", label: "Sent" },
    { id: "draft", label: "Drafts" },
  ];
  const counts: Record<EmailStatus, number> = {
    inbox: emails.filter((e) => e.status === "inbox").length,
    sent: emails.filter((e) => e.status === "sent").length,
    draft: emails.filter((e) => e.status === "draft").length,
  };
  return (
    <div className="flex gap-0.5 text-[11px]">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`cursor-pointer rounded-full px-2 py-0.5 font-medium transition-colors ${
              isActive
                ? "bg-zinc-700 text-zinc-50 dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
            <span className="ml-0.5 text-[10px] tabular-nums">{counts[tab.id]}</span>
          </button>
        );
      })}
    </div>
  );
}

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatTs(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return timeFmt.format(d);
  } catch {
    return iso;
  }
}

function statusClasses(status: EmailStatus): string {
  switch (status) {
    case "draft":
      return "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200";
    case "sent":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    default:
      return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function EmailList({
  emails,
  highlightedIds,
  highlightEpoch,
  onOpenEmail,
  activeTab,
}: {
  emails: Email[];
  highlightedIds: Set<string>;
  highlightEpoch: Record<string, number>;
  onOpenEmail: (email: Email) => void;
  activeTab: EmailStatus;
}) {
  if (emails.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
        No emails.
      </p>
    );
  }

  const filtered = emails.filter((email) => email.status === activeTab);

  return (
    <div className="flex flex-col gap-1">
      {filtered.length === 0 ? (
        <p className="px-1 py-2 text-xs text-zinc-500 dark:text-zinc-400">
          No {activeTab === "draft" ? "drafts" : activeTab} messages.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {filtered.map((email) => {
        const glow = highlightedIds.has(email.id);
        const epoch = highlightEpoch[email.id] ?? 0;
            return (
              <li
                key={`${email.id}-${epoch}`}
                className={`rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 ${glow ? "workspace-glow" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={
                      email.read
                        ? "min-w-0 flex-1 font-normal text-zinc-800 dark:text-zinc-200"
                        : "min-w-0 flex-1 font-semibold text-zinc-900 dark:text-zinc-50"
                    }
                  >
                    {email.subject}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${statusClasses(email.status)}`}
                    >
                      {email.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenEmail(email)}
                      className="cursor-pointer rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      Open
                    </button>
                  </div>
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  From {email.from.name} · {formatTs(email.timestamp)}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
