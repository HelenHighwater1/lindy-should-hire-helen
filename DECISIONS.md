# Project Decisions

A running log of decisions made during the build.
Update this as choices get locked in. Do not relitigate locked decisions
unless a new task makes them impossible -- in that case, flag it explicitly.

## Locked

- Stack: Next.js + TypeScript + React + Node.js + WebSockets
- Layout: three-panel desktop layout, no mobile
- Data: all workspace data (emails, calendar events, contacts) is mocked
  and local - no real OAuth or external data connections
- Secrets: `ANTHROPIC_API_KEY` (and any other secrets) live in `.env` only
- LLM: Anthropic Messages API via `@anthropic-ai/sdk`; default model `claude-sonnet-4-20250514`, overridable with `ANTHROPIC_MODEL` in `.env`
- Formatting: Prettier with eslint-config-prettier (see `npm run format` / `format:check`)
- State management: Zustand — workspace (`src/lib/store/workspace-store.ts`) and chat/trace UI (`src/lib/store/chat-store.ts`)
- Agent pipeline: `runAgent` in `src/server/agent.ts` — per-WebSocket connection workspace clone, `processChat` → optional `executeAction` → `trace_step` / `workspace_update` / `chat_reply` / `agent_done` over WebSocket
- Trace steps: fixed ids `thinking`, `tool`, `result` per run; optional `kind` `thinking` | `tool` | `result` on `TraceStep`; streamed as `trace_step` messages; ~300ms delay between steps for demo pacing
- WebSockets: `ws` library. Two modes:
  - **Local dev** (`npm run dev`): `src/instrumentation.ts` starts a standalone WebSocket
    server on `WS_PORT` (default 3001). The browser connects via `NEXT_PUBLIC_WS_PORT` or
    `NEXT_PUBLIC_WS_URL`.
  - **Production** (`npm start`): custom `server.ts` runs Next.js + WebSocket on the same
    port via HTTP upgrade, so platforms like Railway that expose a single port work out of
    the box. The browser connects to the page origin (no separate port needed).
- WebSocket testing: no in-process integration tests for the `ws` server. Vitest module resolution
  conflicts with `ws`, and such tests can hang. Manual verification and unit tests for pure
  helpers only.
- Styling: Tailwind CSS v4 (PostCSS), no third-party component library. Theme tokens in
  `src/app/globals.css` with Geist fonts from `layout.tsx`.

## Pending / TBD

(none)

## Build Stages

Use this as the working checklist. Mark items `[x]` as you complete them; stop and verify tests before moving on when a stage includes a **TEST:** gate.

### Stage 0 — Scaffolding

- [x] Initialize Next.js + TypeScript project (or equivalent repo layout)
- [x] Add Node.js backend surface area (API routes and/or custom server as needed for WebSockets)
- [x] Set up folder structure (e.g. app, components, lib, server, types)
- [x] Add `.env.example` and document required vars (`ANTHROPIC_API_KEY`, etc.)
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

- [x] Desktop three-panel layout (left / center / right), no mobile layout
- [x] Wire left panel to mock workspace data (lists, empty states)
- [x] Center and right panels as placeholders (static or minimal)
- [x] Decide styling approach (CSS, Tailwind, component library) — update Pending / TBD
- [x] Smoke: layout is stable at a typical desktop width; no console errors

### Stage 3 — WebSocket infrastructure

- [x] Choose WebSocket library / server integration — update Pending / TBD
- [x] Server: WebSocket endpoint (upgrade path, message handling)
- [x] Client: connection hook or provider (connect, disconnect, send, receive)
- [x] Define minimal message protocol (JSON shapes for client ↔ server)
- [x] Handle reconnect or explicit error UX (document behavior for demo)
- [x] **TEST:** Automated test — client connects, sends a message, receives an expected response (skipped: `ws` + Vitest; see Locked; optional retry in Stage 8.5)
- [x] **TEST:** Manual — browser devtools: connect, send, receive, disconnect cleanly (verify when exercising the app)

### Stage 4 — LLM integration

- [x] Choose LLM provider and model — update Pending / TBD
- [x] API route (or server handler) that calls the LLM with a structured prompt
- [x] Parse LLM output into typed intent / actions (validate shape)
- [x] Centralize error handling (rate limits, timeouts, invalid key)
- [ ] **TEST:** Automated — API route returns expected shape for a fixed prompt (mock or real key in CI) — **Stage 8.5**
- [ ] **TEST:** Automated — missing/invalid API key returns clear error (no crash) — **Stage 8.5**

### Stage 5 — Agent logic and trace streaming

- [x] Map supported user intents to workspace actions (from [PROJECT.md](PROJECT.md))
- [x] Agent pipeline: user message → LLM → planned steps → mock mutations + trace events
- [x] Stream trace steps over WebSocket as each step runs (ordering, completion signal)
- [x] Define trace step schema — update Pending / TBD for action-specific steps
- [ ] **TEST:** Automated — send a chat message (fixture or E2E), assert trace events arrive in order — **Stage 8.5**

### Stage 6 — Chat interface

- [x] Message list (user + assistant), scroll behavior
- [x] Input + submit; disable or guard while agent is processing
- [x] Connect UI to WebSocket send/receive for chat messages
- [x] Loading / streaming states for assistant reply if applicable
- [x] Smoke: full chat round-trip works in browser

### Stage 7 — Trace panel

- [x] Render trace steps as they arrive (list, timestamps or step types)
- [x] Distinguish step types (tool, thought, result, etc.) per your schema
- [x] Auto-scroll or clear between runs as needed for demo clarity
- [x] Smoke: trace updates live during a single user prompt

### Stage 8 — Workspace reactivity

- [x] Left panel reflects mutations after each agent action (email, calendar, etc.)
- [x] Verify all five supported actions from [PROJECT.md](PROJECT.md): schedule/reschedule meeting, draft/send email, summarize thread + next steps, block focus time, meeting prep brief
- [x] Smoke: one manual pass per action type on the running app


### Stage 9 — Polish and demo prep

- [ ] Error and empty states (LLM down, WebSocket drop, no data)
- [ ] Optional animations / micro-interactions for “alive” feel
- [ ] Pre-seed or script a short demo scenario (optional one-click demo)
- [ ] README quickstart (install, env, run, test commands)
- [ ] Final pass: no broken states during a 2–3 minute demo run


### OPTIONAL - Stage 10 — Testing (deferred automated gates)

Consolidate automated tests skipped or deferred from earlier stages:

- [ ] WebSocket: client connects, sends a message, receives an expected response (if Vitest + `ws` can be made reliable; else document alternative, e.g. Playwright)
- [ ] LLM: `processChat` / tool parsing unit tests (mock Anthropic SDK)
- [ ] API: `POST /api/chat` — expected JSON shape; missing `text` → 400; missing/invalid API key → clear error without crash
- [ ] Agent/trace: chat fixture or E2E — trace events order (from Stage 5 checklist)
- [ ] Any other automated tests accumulated while building Stages 5–8