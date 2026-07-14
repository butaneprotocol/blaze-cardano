#!/usr/bin/env node
import { parseArgs } from "node:util";
import { startRpcServer } from "./server";

const { values } = parseArgs({
  options: {
    host: { type: "string" },
    port: { type: "string" },
  },
});

const port = Number(values.port ?? 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("port must be an integer between 1 and 65535");
}

const hostname = values.host ?? "127.0.0.1";

const server = startRpcServer({ port, hostname });
server.ready
  .then(() => {
    console.log(`Blaze emulator RPC listening on http://${hostname}:${port}`);
    console.log(`OpenAPI document: http://${hostname}:${port}/doc`);
    console.log(`Swagger UI: http://${hostname}:${port}/ui`);
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });

const stop = () => {
  server.stop();
  process.exit(0);
};

process.once("SIGINT", stop);
process.once("SIGTERM", stop);
