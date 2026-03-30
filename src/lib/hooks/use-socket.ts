"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TraceStep } from "@/lib/types/agent";
import type {
  ClientMessage,
  ServerMessage,
  WorkspaceMutation,
} from "@/lib/types/protocol";

export type SocketStatus = "connecting" | "connected" | "disconnected";

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

function isTraceStep(value: unknown): value is TraceStep {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.label === "string" &&
    (o.status === "running" || o.status === "done" || o.status === "error") &&
    typeof o.timestamp === "string" &&
    (o.detail === undefined || typeof o.detail === "string") &&
    (o.kind === undefined ||
      o.kind === "thinking" ||
      o.kind === "tool" ||
      o.kind === "result")
  );
}

function isWorkspaceMutation(value: unknown): value is WorkspaceMutation {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (o.type === "add_calendar_event") {
    return typeof o.data === "object" && o.data !== null;
  }
  if (o.type === "update_calendar_event") {
    if (typeof o.data !== "object" || o.data === null) {
      return false;
    }
    const d = o.data as Record<string, unknown>;
    return typeof d.id === "string" && typeof d.patch === "object";
  }
  if (o.type === "remove_calendar_event") {
    if (typeof o.data !== "object" || o.data === null) {
      return false;
    }
    const d = o.data as Record<string, unknown>;
    return typeof d.id === "string";
  }
  if (o.type === "add_email") {
    return typeof o.data === "object" && o.data !== null;
  }
  return false;
}

function parseServerMessage(data: string): ServerMessage | null {
  try {
    const parsed: unknown = JSON.parse(data);
    if (typeof parsed !== "object" || parsed === null || !("type" in parsed)) {
      return null;
    }
    const t = (parsed as { type: string }).type;

    if (t === "chat_reply") {
      const p = parsed as { payload?: unknown };
      if (
        typeof p.payload === "object" &&
        p.payload !== null &&
        typeof (p.payload as { text?: unknown }).text === "string"
      ) {
        return parsed as ServerMessage;
      }
      return null;
    }

    if (t === "error") {
      const p = parsed as { payload?: unknown };
      if (
        typeof p.payload === "object" &&
        p.payload !== null &&
        typeof (p.payload as { message?: unknown }).message === "string"
      ) {
        return parsed as ServerMessage;
      }
      return null;
    }

    if (t === "trace_step") {
      const p = parsed as { payload?: unknown };
      if (isTraceStep(p.payload)) {
        return { type: "trace_step", payload: p.payload };
      }
      return null;
    }

    if (t === "workspace_update") {
      const p = parsed as { payload?: unknown };
      if (isWorkspaceMutation(p.payload)) {
        return { type: "workspace_update", payload: p.payload };
      }
      return null;
    }

    if (t === "agent_done") {
      return { type: "agent_done" };
    }

    return null;
  } catch {
    return null;
  }
}

function getReconnectDelayMs(attemptIndex: number): number {
  return Math.min(INITIAL_BACKOFF_MS * 2 ** attemptIndex, MAX_BACKOFF_MS);
}

export function useSocket(
  url: string | null,
  onMessage?: (msg: ServerMessage) => void,
) {
  const [status, setStatus] = useState<SocketStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);
  const [error, setError] = useState<Event | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const backoffTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const reconnectAttemptRef = useRef(0);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const send = useCallback((message: ClientMessage) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }
    ws.send(JSON.stringify(message));
  }, []);

  useEffect(() => {
    if (!url) {
      return;
    }

    shouldReconnectRef.current = true;

    const clearBackoff = () => {
      if (backoffTimeoutRef.current !== null) {
        clearTimeout(backoffTimeoutRef.current);
        backoffTimeoutRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      const delay = getReconnectDelayMs(reconnectAttemptRef.current);
      reconnectAttemptRef.current += 1;
      clearBackoff();
      backoffTimeoutRef.current = setTimeout(() => {
        backoffTimeoutRef.current = null;
        if (!shouldReconnectRef.current) {
          return;
        }
        openSocket();
      }, delay);
    };

    const openSocket = () => {
      if (!shouldReconnectRef.current) {
        return;
      }

      setStatus("connecting");
      setError(null);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        setStatus("connected");
      };

      ws.onerror = (ev) => {
        setError(ev);
      };

      ws.onmessage = (ev) => {
        const msg = parseServerMessage(String(ev.data));
        if (msg) {
          setLastMessage(msg);
          onMessageRef.current?.(msg);
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        setStatus("disconnected");
        if (shouldReconnectRef.current) {
          scheduleReconnect();
        }
      };
    };

    openSocket();

    return () => {
      shouldReconnectRef.current = false;
      clearBackoff();
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [url]);

  return { status, send, lastMessage, error };
}
