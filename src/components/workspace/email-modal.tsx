"use client";

import { useEffect } from "react";

import type { Email, EmailStatus } from "@/lib/types";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
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

export function EmailModal({
  email,
  onClose,
}: {
  email: Email | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!email) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [email, onClose]);

  if (!email) return null;

  const toLine = email.to.map((c) => `${c.name} <${c.email}>`).join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(85dvh,640px)] w-full max-w-lg flex-col rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <div className="min-w-0 flex-1">
            <h2
              id="email-modal-title"
              className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {email.subject}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${statusClasses(email.status)}`}
              >
                {email.status}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatTs(email.timestamp)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-sm">
          <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
            <p>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                From:
              </span>{" "}
              {email.from.name} &lt;{email.from.email}&gt;
            </p>
            <p>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                To:
              </span>{" "}
              {toLine}
            </p>
          </div>
          <div className="mt-4 whitespace-pre-wrap border-t border-zinc-100 pt-4 text-sm leading-relaxed text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
            {email.body}
          </div>
        </div>
      </div>
    </div>
  );
}
