import type { CalendarEvent, Contact, Email, WorkspaceData } from "@/lib/types";

/**
 * Builds an ISO timestamp for today at the given local time.
 */
function todayAt(
  hours: number,
  minutes: number,
  durationMinutes: number,
): {
  start: string;
  end: string;
} {
  const start = new Date();
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Builds an ISO timestamp for tomorrow at the given local time.
 */
function tomorrowAt(
  hours: number,
  minutes: number,
  durationMinutes: number,
): { start: string; end: string } {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

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

const standup = todayAt(9, 30, 30);
const oneOnOne = todayAt(14, 0, 60);
const focusBlock = todayAt(10, 0, 120);
const tomorrowSync = tomorrowAt(11, 0, 45);

const calendarEvents: CalendarEvent[] = [
  {
    id: "cal-standup",
    title: "Team standup",
    start: standup.start,
    end: standup.end,
    attendees: [contactSelf, contactJordan, contactSam],
    description: "Daily sync on sprint progress.",
    type: "meeting",
  },
  {
    id: "cal-focus",
    title: "Focus block",
    start: focusBlock.start,
    end: focusBlock.end,
    attendees: [contactSelf],
    description: "Deep work - no meetings.",
    type: "focus",
  },
  {
    id: "cal-1on1",
    title: "1:1 with Jordan",
    start: oneOnOne.start,
    end: oneOnOne.end,
    attendees: [contactSelf, contactJordan],
    description: "Career check-in and roadmap.",
    type: "meeting",
  },
  {
    id: "cal-tomorrow-sync",
    title: "Product sync",
    start: tomorrowSync.start,
    end: tomorrowSync.end,
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
    body: "Hi team - attached is the Q2 budget draft. Please review line 12 for marketing spend and reply with questions by EOD Thursday.",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    status: "inbox",
  },
  {
    id: "email-budget-2",
    threadId: threadBudget,
    from: contactSelf,
    to: [contactPriya],
    subject: "Re: Q2 budget draft",
    body: "Thanks Priya. One question on the contractor line - should we fold that into R&D or keep it separate?",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    status: "sent",
  },
  {
    id: "email-standup-1",
    threadId: threadStandup,
    from: contactSam,
    to: [contactSelf],
    subject: "Standup notes",
    body: "Quick recap from today: API latency is down 12%. Next step is to add caching on the read path.",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: false,
    status: "inbox",
  },
  {
    id: "email-draft-1",
    threadId: "thread-draft",
    from: contactSelf,
    to: [contactJordan],
    subject: "Follow-up on design review",
    body: "Jordan - looping back on the design review. Can we lock the nav pattern by Friday?",
    timestamp: new Date().toISOString(),
    read: true,
    status: "draft",
  },
  {
    id: "email-sent-1",
    threadId: "thread-intro",
    from: contactSelf,
    to: [contactSam],
    subject: "Intro to the new analytics dashboard",
    body: "Sam - here is the link to the dashboard preview. Let me know if you want a walkthrough.",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    status: "sent",
  },
];

export const initialWorkspaceData: WorkspaceData = {
  contacts: [contactSelf, contactJordan, contactSam, contactPriya],
  emails,
  calendarEvents,
};
