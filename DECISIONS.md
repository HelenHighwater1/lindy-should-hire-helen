# Project Decisions

A running log of decisions made during the build.
Update this as choices get locked in. Do not relitigate locked decisions
unless a new task makes them impossible -- in that case, flag it explicitly.

## Locked

- Stack: Next.js + TypeScript + React + Node.js + WebSockets
- Layout: three-panel desktop layout, no mobile
- Data: all workspace data (emails, calendar events, contacts) is mocked
  and local - no real OAuth or external data connections
- Secrets: LLM API key and any other secrets live in .env only
- Formatting: Prettier with eslint-config-prettier (see `npm run format` / `format:check`)
- State management: Zustand (`src/lib/store/workspace-store.ts`)

## Pending / TBD

- WebSocket library choice
- LLM provider and model
- Specific trace steps per action type
- Visual design and component library (if any)

## Build Stages

Use this as the working checklist. Mark items `[x]` as you complete them; stop and verify tests before moving on when a stage includes a **TEST:** gate.

### Stage 0 — Scaffolding

- [x] Initialize Next.js + TypeScript project (or equivalent repo layout)
- [x] Add Node.js backend surface area (API routes and/or custom server as needed for WebSockets)
- [x] Set up folder structure (e.g. app, components, lib, server, types)
- [x] Add `.env.example` and document required vars (LLM key, etc.)
- [x] Configure dev tooling (ESLint, Prettier if desired, `npm run dev` works)
- [x] Lock dependency versions in package.json / lockfile
- [x] Smoke: app runs with no errors in terminal and browser

### Stage 1 — Mock data and state

- [x] Define TypeScript types for emails, calendar events, contacts, and agent actions
- [x] Seed initial mock workspace data (realistic enough for demo)
- [x] Implement read/update helpers for workspace mutations (schedule, email, calendar blocks, etc.)
- [x] Choose and implement state management (context, Zustand, or similar) — resolve Pending / TBD
- [x] Smoke: workspace data loads in dev without runtime errors

### Stage 2 — UI shell

- [ ] Desktop three-panel layout (left / center / right), no mobile layout
- [ ] Wire left panel to mock workspace data (lists, empty states)
- [ ] Center and right panels as placeholders (static or minimal)
- [ ] Decide styling approach (CSS, Tailwind, component library) — update Pending / TBD
- [ ] Smoke: layout is stable at a typical desktop width; no console errors

### Stage 3 — WebSocket infrastructure

- [ ] Choose WebSocket library / server integration — update Pending / TBD
- [ ] Server: WebSocket endpoint (upgrade path, message handling)
- [ ] Client: connection hook or provider (connect, disconnect, send, receive)
- [ ] Define minimal message protocol (JSON shapes for client ↔ server)
- [ ] Handle reconnect or explicit error UX (document behavior for demo)
- [ ] **TEST:** Automated test — client connects, sends a message, receives an expected response
- [ ] **TEST:** Manual — browser devtools: connect, send, receive, disconnect cleanly

### Stage 4 — LLM integration

- [ ] Choose LLM provider and model — update Pending / TBD
- [ ] API route (or server handler) that calls the LLM with a structured prompt
- [ ] Parse LLM output into typed intent / actions (validate shape)
- [ ] Centralize error handling (rate limits, timeouts, invalid key)
- [ ] **TEST:** Automated — API route returns expected shape for a fixed prompt (mock or real key in CI)
- [ ] **TEST:** Automated — missing/invalid API key returns clear error (no crash)

### Stage 5 — Agent logic and trace streaming

- [ ] Map supported user intents to workspace actions (from [PROJECT.md](PROJECT.md))
- [ ] Agent pipeline: user message → LLM → planned steps → mock mutations + trace events
- [ ] Stream trace steps over WebSocket as each step runs (ordering, completion signal)
- [ ] Define trace step schema — update Pending / TBD for action-specific steps
- [ ] **TEST:** Automated — send a chat message (fixture or E2E), assert trace events arrive in order

### Stage 6 — Chat interface

- [ ] Message list (user + assistant), scroll behavior
- [ ] Input + submit; disable or guard while agent is processing
- [ ] Connect UI to WebSocket send/receive for chat messages
- [ ] Loading / streaming states for assistant reply if applicable
- [ ] Smoke: full chat round-trip works in browser

### Stage 7 — Trace panel

- [ ] Render trace steps as they arrive (list, timestamps or step types)
- [ ] Distinguish step types (tool, thought, result, etc.) per your schema
- [ ] Auto-scroll or clear between runs as needed for demo clarity
- [ ] Smoke: trace updates live during a single user prompt

### Stage 8 — Workspace reactivity

- [ ] Left panel reflects mutations after each agent action (email, calendar, etc.)
- [ ] Verify all five supported actions from [PROJECT.md](PROJECT.md): schedule/reschedule meeting, draft/send email, summarize thread + next steps, block focus time, meeting prep brief
- [ ] Smoke: one manual pass per action type on the running app

### Stage 9 — Polish and demo prep

- [ ] Error and empty states (LLM down, WebSocket drop, no data)
- [ ] Optional animations / micro-interactions for “alive” feel
- [ ] Pre-seed or script a short demo scenario (optional one-click demo)
- [ ] README quickstart (install, env, run, test commands)
- [ ] Final pass: no broken states during a 2–3 minute demo run
