# Hey, Lindy team.

## Why I built this

I saw the Full Stack Software Engineer (Early Career) role and wanted to show you how I work rather than just tell you about it. So I built this over a couple of days. It is a functional demo of the Lindy assistant experience, running in the browser, powered by a real LLM. Not a mockup. Not a slide deck.

## What it does

The left panel is a simulated workspace: emails, calendar events, contacts. The center panel is a chat interface where you type natural language requests. The right panel is a live agent trace that streams each step as the AI processes your request.

You see what the assistant says, how it got there, and what changed in the workspace. Schedule a meeting, draft an email, block focus time, summarize a thread, generate a meeting prep brief. It all works against the mock data in real time.

## Why these technical choices

Every major decision maps to something in the job description or Lindy's actual stack.

**Next.js + TypeScript + React** is the foundation. The role lists all three. I used Next.js 16 with the App Router, server components where they make sense, and client components for the interactive panels.

**Node.js + WebSockets** power the real-time trace streaming. The agent pipeline runs server-side, streams structured trace steps over WebSocket as each one completes, and the UI renders them live. In production, the custom server handles both Next.js and WebSocket on a single port.

**Anthropic SDK** for the LLM integration. The agent parses user intent, plans actions, and generates responses using Claude. The job description lists LLM API integration as a bonus skill. I wanted that to be real, not faked.

**Zustand** not listed in your stack, but I used it for state management. Lightweight, minimal boilerplate, and it made workspace reactivity straightforward. Two stores: one for the workspace data, one for the chat and trace UI.

**Tailwind CSS** for styling. No component library. Every layout decision is visible in the code.

## Honest notes

I've never used WebSocket before -  but you mentioned it as a nice to have in the job description, so what better time to learn than now!  However, that did set me back pretty far - I got it running locally just fine, but that was definitely the biggest hurdle - getting `ws` to play nicely with Next.js in production was tough. I ended up with two modes: a standalone server for dev and an HTTP-upgrade approach for production. It works well now, but I definitely learned a lot in the last day.

If I had more time, I would add automated integration tests, better error states, and definitely improve the agent logic.  I know this is far from what I would want a user to see, but I hope it shows you that I can provide value. 


