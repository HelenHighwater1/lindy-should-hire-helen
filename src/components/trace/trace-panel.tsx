"use client";

import { useEffect, useRef } from "react";

import { useChatStore } from "@/lib/store/chat-store";

const timeFmt = new Intl.DateTimeFormat(undefined, {
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
        className="trace-step-pulse flex size-5 shrink-0 items-center justify-center rounded-full border border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
        aria-label="Running"
      >
        <span className="size-1.5 rounded-full bg-current" />
      </span>
    );
  }
  if (status === "done") {
    return (
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-[10px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        aria-label="Done"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full border border-red-300 bg-red-100 text-[10px] font-bold text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
      aria-label="Error"
    >
      !
    </span>
  );
}

function kindBadge(kind: string | undefined): string {
  if (kind === "thinking") return "Thought";
  if (kind === "tool") return "Tool";
  if (kind === "result") return "Result";
  return "Step";
}

function Connector() {
  return (
    <div
      className="mx-1 flex shrink-0 items-center self-center text-zinc-300 dark:text-zinc-600"
      aria-hidden
    >
      <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
        <path d="M10.5 0L16 5l-5.5 5V6H0V4h10.5V0z" />
      </svg>
    </div>
  );
}

export function TracePanel() {
  const traceSteps = useChatStore((s) => s.traceSteps);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollLeft = el.scrollWidth - el.clientWidth;
  }, [traceSteps]);

  return (
    <div className="shrink-0 border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Agent trace
          </h2>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500">
            Steps left to right as the run progresses.
          </p>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="trace-strip-scroll flex min-h-[5.5rem] items-stretch gap-0 overflow-x-auto px-3 py-2.5"
      >
        {traceSteps.length === 0 ? (
          <p className="flex w-full items-center justify-center py-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Send a message to see agent steps here.
          </p>
        ) : (
          traceSteps.map((st, i) => (
            <div key={`${st.id}-${st.timestamp}-${i}`} className="contents">
              {i > 0 ? <Connector /> : null}
              <div className="flex min-w-[7.5rem] max-w-[11rem] shrink-0 flex-col rounded-lg border border-zinc-200 bg-white p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-start gap-1.5">
                  <StatusIcon status={st.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="rounded bg-zinc-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {kindBadge(st.kind)}
                      </span>
                    </div>
                    <p
                      className="mt-1 line-clamp-2 text-[11px] font-medium leading-snug text-zinc-900 dark:text-zinc-100"
                      title={st.label}
                    >
                      {st.label}
                    </p>
                    {st.detail ? (
                      <p
                        className="mt-0.5 line-clamp-2 text-[10px] text-zinc-500 dark:text-zinc-400"
                        title={st.detail}
                      >
                        {st.detail}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[9px] tabular-nums text-zinc-400 dark:text-zinc-500">
                      {formatTime(st.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
