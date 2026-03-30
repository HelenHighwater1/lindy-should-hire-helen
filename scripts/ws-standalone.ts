import { startWebSocketServer } from "../src/server/ws";

void startWebSocketServer()
  .then((handle) => {
    console.info(`[WebSocket] standalone server listening on ${handle.port}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
