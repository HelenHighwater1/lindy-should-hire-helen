import { DISPLAY_TIME_ZONE } from "@/lib/display-timezone";
import type { CalendarEvent } from "@/lib/types";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
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
    const sameDay =
      s.getFullYear() === e.getFullYear() &&
      s.getMonth() === e.getMonth() &&
      s.getDate() === e.getDate();

    if (sameDay) {
      return `${timeFmt.format(s)} – ${timeFmt.format(e)}`;
    }

    // Fallback for rare cross-day events.
    return `${dateFmt.format(s)} ${timeFmt.format(s)} – ${dateFmt.format(e)} ${timeFmt.format(e)}`;
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

  const groups = sorted.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    const d = new Date(ev.start);
    const key = Number.isNaN(d.getTime()) ? "Unknown" : dateFmt.format(d);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(groups).map(([label, dayEvents]) => (
        <div key={label} className="flex flex-col gap-1">
          <div className="sticky top-0 z-10 -mx-2 bg-zinc-50/95 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500 backdrop-blur dark:bg-zinc-950/95 dark:text-zinc-400">
            {label}
          </div>
          <ul className="flex flex-col gap-1">
            {dayEvents.map((ev) => {
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
                    {ev.attendees.length} attendee
                    {ev.attendees.length === 1 ? "" : "s"}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
