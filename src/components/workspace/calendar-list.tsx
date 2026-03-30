import type { CalendarEvent } from "@/lib/types";

const timeFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) {
      return start;
    }
    return `${timeFmt.format(s)} – ${timeFmt.format(e)}`;
  } catch {
    return start;
  }
}

export function CalendarList({
  events,
  highlightedIds,
  highlightEpoch,
}: {
  events: CalendarEvent[];
  highlightedIds: Set<string>;
  highlightEpoch: Record<string, number>;
}) {
  if (events.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
        No calendar events.
      </p>
    );
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  return (
    <ul className="flex flex-col gap-1">
      {sorted.map((ev) => {
        const glow = highlightedIds.has(ev.id);
        const epoch = highlightEpoch[ev.id] ?? 0;
        return (
          <li
            key={`${ev.id}-${epoch}`}
            className={`rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900 ${glow ? "workspace-glow" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {ev.title}
              </span>
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  ev.type === "focus"
                    ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                    : "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200"
                }`}
              >
                {ev.type}
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {formatRange(ev.start, ev.end)}
            </div>
            <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {ev.attendees.length} attendee{ev.attendees.length === 1 ? "" : "s"}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
