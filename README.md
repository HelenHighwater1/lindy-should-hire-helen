# Hey, Lindy team.

## Why I built this

I saw the Full Stack Software Engineer (Early Career) role and wanted to show you how I work rather than just tell you about it. So I built this over a couple of days. It is a functional demo of the Lindy assistant experience, running in the browser, powered by a real LLM. Not a mockup. Not a slide deck.

## What it does

Three panels, one prompt.

The left panel is a simulated workspace: emails, calendar events, contacts. The center panel is a chat interface where you type natural language requests. The right panel is a live agent trace that streams each step as the AI processes your request.

The magic moment is that all three panels update simultaneously. You see what the assistant says, how it got there, and what changed in the workspace. Schedule a meeting, draft an email, block focus time, summarize a thread, generate a meeting prep brief. It all works against the mock data in real time.

## Why these technical choices

Every major decision maps to something in the job description or Lindy's actual stack.

**Next.js + TypeScript + React** is the foundation. The role lists all three. I used Next.js 16 with the App Router, server components where they make sense, and client components for the interactive panels.

**Node.js + WebSockets** power the real-time trace streaming. The agent pipeline runs server-side, streams structured trace steps over WebSocket as each one completes, and the UI renders them live. In production, the custom server handles both Next.js and WebSocket on a single port.

**Anthropic SDK** for the LLM integration. The agent parses user intent, plans actions, and generates responses using Claude. The job description lists LLM API integration as a bonus skill. I wanted that to be real, not faked.

**Zustand** for state management. Lightweight, minimal boilerplate, and it made workspace reactivity straightforward. Two stores: one for the workspace data, one for the chat and trace UI.

**Tailwind CSS v4** for styling. No component library. Every layout decision is visible in the code.

## Honest notes

WebSocket setup was the hardest part. Getting `ws` to play nicely with Next.js in both local dev and production took more time than I expected. I ended up with two modes: a standalone server for dev and an HTTP-upgrade approach for production. It works well now, but it was not obvious how to get there.

If I had more time, I would add automated integration tests (Vitest and `ws` fought each other), better error states, and a one-click demo scenario. The agent logic could also be more granular in how it streams trace steps.

I learned a lot about how real-time AI interfaces need to feel alive. Timing, ordering, and visual pacing matter as much as correctness.

## How to run it locally

### Prerequisites

- Node.js 20+
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com/))

### Setup

```bash
git clone <this-repo>
cd lindy
npm install
```

Copy the example env file and add your API key:

```bash
cp .env.example .env
```

Then edit `.env` and set `ANTHROPIC_API_KEY` to your key.

### Run (development)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The WebSocket server starts automatically on port 3001.

### Run (production mode)

```bash
npm run build
npm start
```

This runs the custom server that serves both Next.js and WebSocket on a single port.

### Other commands

| Command | What it does |
|---|---|
| `npm test` | Run tests (Vitest) |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |
