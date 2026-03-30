# Lindy Demo App

## What this is
A portfolio demo app built to accompany a job application to Lindy.ai.
It simulates the Lindy AI assistant experience in a browser, showing
both what the assistant does and how it does it in real time.

## Who it's for
The Lindy engineering team. They should understand the value immediately,
within 10 seconds of looking at it.

## Core experience
A three-panel desktop UI:
- Left: a simulated workspace (fake emails, calendar events, contacts)
  that updates visually as the agent acts on it
- Center: a chat interface where the user types natural language requests
- Right: a real-time agent trace panel that streams steps live as the
  agent processes each request

The magic moment is that all three panels respond simultaneously to a
single user prompt. The user sees what Lindy says AND how it got there.

## Supported actions
The agent can handle these types of requests against the simulated workspace:
- Schedule or reschedule a meeting
- Draft and "send" an email
- Summarize an email thread and suggest next steps
- Block focus time on the calendar
- Generate a meeting prep brief for an upcoming event

## Tech
- Next.js + TypeScript + React (frontend)
- Node.js backend
- WebSockets for real-time trace streaming
- LLM API (Anthropic or OpenAI) for real intent parsing and responses
- All workspace data is mocked and local -- no real OAuth or external
  data dependencies beyond the LLM

## What matters most
1. It works reliably - no broken states, no crashes during a demo
2. It feels alive - real-time, responsive, visually satisfying
3. It is immediately understandable - no explanation required
4. The code is clean - this will be read by engineers

## What to avoid
- Over-engineering - this is a 2-day build
- Real OAuth or external API dependencies beyond the LLM
- Mobile layout - desktop only
- Any feature that isn't directly serving the core experience above
