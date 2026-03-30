import { startWebSocketServer } from "@/server/ws";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const handle = await startWebSocketServer();
  console.info(`[WebSocket] server listening on ${handle.port}`);
}
