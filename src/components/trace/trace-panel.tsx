"use client";

import { useEffect, useRef } from "react";

import { DISPLAY_TIME_ZONE } from "@/lib/display-timezone";
import { useChatStore } from "@/lib/store/chat-store";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return "";
    }
    return timeFmt.format(d);
  } catch {
    return "";
  }
}

function StatusIcon({ status }: { status: "running" | "done" | "error" }) {
  if (status === "running") {
    return (
      <span
        className="trace-step-pulse flex size-6 shrink-0 items-center justify-center rounded-full border border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
        aria-label="Running"
      >
        <span className="size-2 rounded-full bg-current" />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        aria-label="Done"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full border border-red-300 bg-red-100 text-xs font-bold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      aria-label="Error"
    >
      !
    </span>
  );
}

function kindBadge(kind: string | undefined): string {
  if (kind === "thinking") {
    return "Thought";
  }
  if (kind === "tool") {
    return "Tool";
  }
  if (kind === "result") {
    return "Result";
  }
  return "Step";
}

export function TracePanel() {
  const traceSteps = useChatStore((s) => s.traceSteps);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [traceSteps]);

  return (
    <aside data-tour-panel="right" className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex size-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Agent Trace
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Live steps per request
          </p>
        </div>
      </header>
      <div
        ref={scrollRef}
        className="panel-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3"
      >
        {traceSteps.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Send a message to see the agent trace.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {traceSteps.map((st, i) => (
              <li key={`${st.id}-${st.timestamp}-${i}`} className="flex gap-3">
                <StatusIcon status={st.status} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {kindBadge(st.kind)}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {formatTime(st.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {st.label}
                  </p>
                  {st.detail ? (
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                      {st.detail}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
