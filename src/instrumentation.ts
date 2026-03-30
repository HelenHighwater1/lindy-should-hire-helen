import { startWebSocketServer } from "@/server/ws";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  if (process.env.DISABLE_IN_PROCESS_WS === "1") {
    return;
  }

  const handle = await startWebSocketServer();
  console.info(`[WebSocket] server listening on ${handle.port}`);
}
