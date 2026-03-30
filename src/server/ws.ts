import { WebSocketServer } from "ws";
import type { RawData, WebSocket } from "ws";
import { initialWorkspaceData } from "@/lib/data/seed";
import type { ClientMessage, ServerMessage } from "@/lib/types/protocol";
import {
  type AgentRunResult,
  cloneWorkspaceForConnection,
  runAgent,
} from "@/server/agent";
import type { ChatTurn } from "@/server/llm";

export interface WsHandle {
  readonly port: number;
  close: () => Promise<void>;
}

function parsePort(): number {
  const wsRaw = process.env.WS_PORT;
  if (wsRaw !== undefined && wsRaw !== "") {
    const n = Number.parseInt(wsRaw, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  const portRaw = process.env.PORT;
  if (portRaw !== undefined && portRaw !== "") {
    const n = Number.parseInt(portRaw, 10);
    if (Number.isFinite(n) && n > 0) {
      return n;
    }
  }
  return 3001;
}

function isChatMessage(value: unknown): value is ClientMessage {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (o.type !== "chat") {
    return false;
  }
  if (typeof o.payload !== "object" || o.payload === null) {
    return false;
  }
  const p = o.payload as Record<string, unknown>;
  return typeof p.text === "string";
}

interface ConnectionState {
  workspace: ReturnType<typeof cloneWorkspaceForConnection>;
  history: ChatTurn[];
}

const connectionStates = new Map<WebSocket, ConnectionState>();

export function startWebSocketServer(): Promise<WsHandle> {
  const port = parsePort();

  return new Promise((resolve, reject) => {
    const wss = new WebSocketServer({ port });

    const fail = (err: Error) => {
      wss.removeAllListeners();
      reject(err);
    };

    wss.once("error", fail);

    wss.once("listening", () => {
      wss.off("error", fail);
      wss.on("connection", (socket) => {
        connectionStates.set(socket, {
          workspace: cloneWorkspaceForConnection(initialWorkspaceData),
          history: [],
        });

        socket.on("close", () => {
          connectionStates.delete(socket);
        });

        socket.on("message", (data: RawData) => {
          void (async () => {
            try {
              const raw =
                typeof data === "string" ? data : data.toString("utf8");
              const parsed: unknown = JSON.parse(raw);
              if (!isChatMessage(parsed)) {
                const errMsg: ServerMessage = {
                  type: "error",
                  payload: { message: "Invalid message" },
                };
                socket.send(JSON.stringify(errMsg));
                return;
              }

              const state = connectionStates.get(socket);
              if (!state) {
                const errMsg: ServerMessage = {
                  type: "error",
                  payload: { message: "Connection state missing" },
                };
                socket.send(JSON.stringify(errMsg));
                return;
              }

              const emit = (msg: ServerMessage) => {
                socket.send(JSON.stringify(msg));
              };

              try {
                const result: AgentRunResult = await runAgent(
                  parsed.payload.text,
                  state.workspace,
                  emit,
                  state.history,
                );
                connectionStates.set(socket, {
                  workspace: result.workspace,
                  history: result.history,
                });
              } catch {
                emit({
                  type: "error",
                  payload: { message: "Agent run failed" },
                });
                emit({ type: "agent_done" });
              }
            } catch {
              const errMsg: ServerMessage = {
                type: "error",
                payload: { message: "Invalid JSON" },
              };
              socket.send(JSON.stringify(errMsg));
            }
          })();
        });
      });

      resolve({
        port,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            wss.close((err) => {
              if (err) {
                rejectClose(err);
              } else {
                resolveClose();
              }
            });
          }),
      });
    });
  });
}
