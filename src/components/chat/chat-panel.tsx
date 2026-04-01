"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import ReactMarkdown from "react-markdown";

import { DISPLAY_TIME_ZONE } from "@/lib/display-timezone";
import type { ClientMessage } from "@/lib/types/protocol";
import type { SocketStatus } from "@/lib/hooks/use-socket";
import { useChatStore } from "@/lib/store/chat-store";

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: DISPLAY_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
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

export function ChatPanel({
  send,
  socketStatus,
  socketError,
}: {
  send: (message: ClientMessage) => void;
  socketStatus: SocketStatus;
  socketError: Event | null;
}) {
  const messages = useChatStore((s) => s.messages);
  const isProcessing = useChatStore((s) => s.isProcessing);
  const addMessage = useChatStore((s) => s.addMessage);
  const clearTrace = useChatStore((s) => s.clearTrace);
  const setProcessing = useChatStore((s) => s.setProcessing);

  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) {
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, isProcessing]);

  const submit = useCallback(() => {
    const text = draft.trim();
    if (!text || isProcessing) {
      return;
    }
    if (socketStatus !== "connected") {
      addMessage({
        role: "error",
        text: "Not connected to agent",
      });
      return;
    }
    clearTrace();
    addMessage({ role: "user", text });
    setProcessing(true);
    setDraft("");
    send({ type: "chat", payload: { text } });
  }, [
    draft,
    isProcessing,
    socketStatus,
    clearTrace,
    addMessage,
    setProcessing,
    send,
  ]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const statusLabel =
    socketStatus === "connected"
      ? "Connected"
      : socketStatus === "connecting"
        ? "Connecting…"
        : "Disconnected";

  return (
    <div data-tour-panel="center" className="flex min-h-0 min-w-0 flex-col bg-white dark:bg-zinc-950">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Chat
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Ask the assistant anything.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
              socketStatus === "connected"
                ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                : socketStatus === "connecting"
                  ? "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                  : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {statusLabel}
          </span>
          {socketError ? (
            <p className="text-[10px] text-amber-700 dark:text-amber-300">
              Unable to connect
            </p>
          ) : null}
        </div>
      </header>

      <div
        ref={listRef}
        className="panel-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Try: "Schedule a 30m sync with Jordan tomorrow at 3pm"
          </p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col gap-0.5 ${
              m.role === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[min(100%,36rem)] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-sky-600 text-white dark:bg-sky-700"
                  : m.role === "error"
                    ? "border border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{m.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.text}</p>
              )}
            </div>
            <span className="px-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              {formatTime(m.timestamp)}
            </span>
          </div>
        ))}
        {isProcessing ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span
              className="inline-block size-2 animate-pulse rounded-full bg-sky-500"
              aria-hidden
            />
            Assistant is thinking…
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={isProcessing}
            placeholder={
              isProcessing ? "Waiting for response…" : "Type a message…"
            }
            rows={2}
            className="min-h-[2.5rem] w-full resize-none bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 disabled:opacity-60 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={isProcessing || draft.trim() === ""}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sky-700 dark:hover:bg-sky-600"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
