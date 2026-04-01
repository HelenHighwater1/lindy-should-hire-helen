"use client";

import { useCallback, useMemo } from "react";

import { ChatPanel } from "@/components/chat/chat-panel";
import { TracePanel } from "@/components/trace/trace-panel";
import { WorkspacePanel } from "@/components/workspace/workspace-panel";
import { useSocket } from "@/lib/hooks/use-socket";
import { useChatStore } from "@/lib/store/chat-store";
import { useWorkspaceStore } from "@/lib/store/workspace-store";
import type { ServerMessage } from "@/lib/types";

/**
 * Prefer NEXT_PUBLIC_WS_URL (full URL) if set, then NEXT_PUBLIC_WS_PORT
 * for a separate-port setup (local dev). When neither is set the client
 * connects to the page origin (same host+port) which works with the
 * custom production server that shares HTTP and WS on one port.
 */
const WS_URL_OVERRIDE = process.env.NEXT_PUBLIC_WS_URL ?? "";
const WS_PORT = process.env.NEXT_PUBLIC_WS_PORT ?? "";

export function AppShell() {
  const addMessage = useChatStore((s) => s.addMessage);
  const upsertTraceStep = useChatStore((s) => s.upsertTraceStep);
  const setProcessing = useChatStore((s) => s.setProcessing);
  const applyMutation = useWorkspaceStore((s) => s.applyMutation);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case "chat_reply":
          addMessage({ role: "assistant", text: msg.payload.text });
          break;
        case "trace_step":
          upsertTraceStep(msg.payload);
          break;
        case "workspace_update":
          applyMutation(msg.payload);
          break;
        case "agent_done":
          setProcessing(false);
          break;
        case "error":
          addMessage({ role: "error", text: msg.payload.message });
          setProcessing(false);
          break;
        default: {
          const _exhaustive: never = msg;
          return _exhaustive;
        }
      }
    },
    [addMessage, upsertTraceStep, applyMutation, setProcessing],
  );

  const wsUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return null;
    }
    if (WS_URL_OVERRIDE) {
      return WS_URL_OVERRIDE;
    }
    const wsScheme = window.location.protocol === "https:" ? "wss:" : "ws:";
    if (WS_PORT) {
      return `${wsScheme}//${window.location.hostname}:${WS_PORT}`;
    }
    // Same origin + /ws path — works with the custom server (server.ts)
    return `${wsScheme}//${window.location.host}/ws`;
  }, []);

  const { status, send, error } = useSocket(wsUrl, handleMessage);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-zinc-200 bg-zinc-50 dark:divide-zinc-800 dark:bg-zinc-950 md:grid-cols-[minmax(0,30%)_minmax(0,1fr)_minmax(0,18%)] md:divide-x md:divide-y-0">
      <WorkspacePanel />
      <ChatPanel send={send} socketStatus={status} socketError={error} />
      <TracePanel />
    </div>
  );
}
