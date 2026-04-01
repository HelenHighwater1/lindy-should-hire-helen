import type { CalendarEvent, Contact, Email, WorkspaceData } from "@/lib/types";

/**
 * Demo workspace content uses fixed ISO timestamps so server and client render
 * identical HTML (avoids React hydration errors on Vercel and elsewhere).
 */

const contactSelf: Contact = {
  id: "contact-self",
  name: "Alex Morgan",
  email: "alex.morgan@example.com",
};

const contactJordan: Contact = {
  id: "contact-jordan",
  name: "Jordan Lee",
  email: "jordan.lee@example.com",
};

const contactSam: Contact = {
  id: "contact-sam",
  name: "Sam Rivera",
  email: "sam.rivera@example.com",
};

const contactPriya: Contact = {
  id: "contact-priya",
  name: "Priya Shah",
  email: "priya.shah@example.com",
};

/** Calendar instants: March 2026 is PDT (UTC−7). Earliest event: 9:00 AM Pacific. */
const calendarEvents: CalendarEvent[] = [
  {
    id: "cal-standup",
    title: "Team standup",
    start: "2026-03-30T16:00:00.000Z",
    end: "2026-03-30T16:30:00.000Z",
    attendees: [contactSelf, contactJordan, contactSam],
    description: "Daily sync on sprint progress.",
    type: "meeting",
  },
  {
    id: "cal-focus",
    title: "Focus block",
    start: "2026-03-30T17:00:00.000Z",
    end: "2026-03-30T19:00:00.000Z",
    attendees: [contactSelf],
    description: "Deep work - no meetings.",
    type: "focus",
  },
  {
    id: "cal-1on1",
    title: "1:1 with Jordan",
    start: "2026-03-30T19:00:00.000Z",
    end: "2026-03-30T20:00:00.000Z",
    attendees: [contactSelf, contactJordan],
    description: "Career check-in and roadmap.",
    type: "meeting",
  },
  {
    id: "cal-tomorrow-sync",
    title: "Product sync",
    start: "2026-03-31T19:45:00.000Z",
    end: "2026-03-31T20:30:00.000Z",
    attendees: [contactSelf, contactPriya, contactSam],
    description: "Roadmap review for Q2.",
    type: "meeting",
  },
];

const threadBudget = "thread-budget";
const threadStandup = "thread-standup";

const emails: Email[] = [
  {
    id: "email-budget-1",
    threadId: threadBudget,
    from: contactPriya,
    to: [contactSelf, contactJordan],
    subject: "Q2 budget draft",
    body: `Hi Alex and Jordan —

I'm circulating the Q2 budget draft (v3) for sign-off before finance closes the pack next week.

What I need from each of you:
- Marketing (line 12): $420K proposed for paid acquisition vs. $380K in Q1. I need one of you to confirm we're comfortable increasing spend before we commit in the sheet.
- Eng contractors: $215K total across three vendors (see tab "Contractors"). Two roll off on Apr 18; one extension through May 30 is penciled in.

Please reply with questions or edits by EOD Thursday so I can lock the workbook Friday morning.`,
    timestamp: "2026-03-28T14:00:00.000Z",
    read: true,
    status: "inbox",
  },
  {
    id: "email-budget-2",
    threadId: threadBudget,
    from: contactSelf,
    to: [contactPriya],
    subject: "Re: Q2 budget draft",
    body: `Thanks Priya — I've read through the Contractors tab.

Question: the $90K for Northwind Integration Partners — finance had that under "Professional Services" last quarter. Should we move that line into R&D headcount roll-up for Q2, or keep it as a separate contractor bucket so we can track vendor spend?

If we fold it into R&D it simplifies the board slide; if we keep it separate it's easier to cut if we need to trim later. I'll follow whatever you and Jordan prefer.

— Alex`,
    timestamp: "2026-03-29T14:00:00.000Z",
    read: true,
    status: "sent",
  },
  {
    id: "email-standup-1",
    threadId: threadStandup,
    from: contactSam,
    to: [contactSelf],
    subject: "Standup notes",
    body: `Hey Alex — notes from today's standup so you have them in writing.

What shipped / metrics
- /v2/events read path p95 dropped from 890ms to ~780ms week over week (about 12% — I said 14% in standup but the dashboard rounds; we're using 12% in the report).
- Error rate on the same route held flat at 0.3%.

Decisions
- We're pausing the GraphQL experiment for two weeks; REST + thin BFF stays the default for the mobile app slice.

Action items
- Me (Sam): spike Redis cache for GET /v2/events?orgId=&range= — target design doc by Wednesday EOD.
- Jordan: review cache key strategy with me Thursday (15 min).
- You: no action unless you want product sign-off on deprioritizing GraphQL; ping me if so.

Blockers: none on our side; waiting on infra for a read replica in staging (ticket INFRA-4411).

— Sam`,
    timestamp: "2026-03-30T09:00:00.000Z",
    read: false,
    status: "inbox",
  },
  {
    id: "email-draft-1",
    threadId: "thread-draft",
    from: contactSelf,
    to: [contactJordan],
    subject: "Follow-up on design review",
    body: `Jordan — looping back on Tuesday's design review for the Lindy-style assistant shell (three-panel layout).

Open items I'm still carrying:
1) Navigation pattern: persistent left rail vs. collapsible — you preferred collapsible for narrow widths; I need a final call so eng can lock breakpoints.
2) Trace panel: do we show raw tool JSON in v1 or only human-readable steps? Product wants readable-only for the demo.

Can we lock the nav pattern by this Friday so I can unblock the handoff doc?

Thanks,
Alex`,
    timestamp: "2026-03-30T11:30:00.000Z",
    read: true,
    status: "draft",
  },
  {
    id: "email-sent-1",
    threadId: "thread-intro",
    from: contactSelf,
    to: [contactSam],
    subject: "Intro to the new analytics dashboard",
    body: `Sam —

Sharing the internal preview of the new analytics dashboard (staging only):

- Workspace: org-level funnel, weekly active "sessions", and retention cohorts for the last 12 weeks.
- Saved views: you can pin up to five; I saved "API latency" and "Error budget" as examples.
- Data sources: warehouse refresh runs at 6am PT; intraday is ~15 minutes delayed.

Preview URL (VPN): https://analytics-staging.example.internal/preview/dash-v2

No need to file bugs in Jira yet — reply here if something looks wrong on the latency charts and I'll route it.

Best,
Alex`,
    timestamp: "2026-03-25T14:00:00.000Z",
    read: true,
    status: "sent",
  },
];

export const initialWorkspaceData: WorkspaceData = {
  contacts: [contactSelf, contactJordan, contactSam, contactPriya],
  emails,
  calendarEvents,
};
