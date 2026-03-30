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
 * Prefer NEXT_PUBLIC_WS_URL (full URL) if set, otherwise build from
 * NEXT_PUBLIC_WS_PORT (default 3001).
 */
const WS_URL_OVERRIDE = process.env.NEXT_PUBLIC_WS_URL ?? "";
const WS_PORT = process.env.NEXT_PUBLIC_WS_PORT ?? "3001";

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
    return `ws://${window.location.hostname}:${WS_PORT}`;
  }, []);

  const { status, send, error } = useSocket(wsUrl, handleMessage);

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 divide-y divide-zinc-200 bg-zinc-50 dark:divide-zinc-800 dark:bg-zinc-950 min-[480px]:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] min-[480px]:divide-x min-[480px]:divide-y-0">
      <WorkspacePanel />
      <div className="flex min-h-0 min-w-0 flex-col bg-white dark:bg-zinc-950">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ChatPanel send={send} socketStatus={status} socketError={error} />
        </div>
        <TracePanel />
      </div>
    </div>
  );
}
