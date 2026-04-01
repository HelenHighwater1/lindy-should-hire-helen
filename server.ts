// Custom production server: serves Next.js and WebSocket on the same port.
// This is required for platforms like Railway that only expose a single port.

// Prevent instrumentation.ts from starting a separate WS server — this
// server handles WebSocket via the shared HTTP upgrade path instead.
process.env.DISABLE_IN_PROCESS_WS = "1";

import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { attachWebSocketServer } from "./src/server/ws";

const port = Number.parseInt(process.env.PORT || "3000", 10);

const app = next({ dev: false });
const handle = app.getRequestHandler();

void app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url!, true));
  });

  attachWebSocketServer(server);
  console.info("[WebSocket] attached to HTTP server (shared port)");

  server.listen(port, () => {
    console.info(`> Ready on http://localhost:${port}`);
  });
});
