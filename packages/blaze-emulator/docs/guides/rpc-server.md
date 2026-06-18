---
title: Emulator RPC Server
---

# Emulator RPC Server
The emulator ships with an optional JSON RPC server that mirrors the in-process APIs. This guide explains how to start the server, seed wallets, and submit transactions without pulling the `Emulator` class into your own process.

## Start the Server
The server exports a helper that wraps Hono’s request handler. You can embed it directly into a test runner or a standalone script.

```ts
import { startRpcServer } from "@blaze-cardano/emulator/rpc";

const server = startRpcServer({
    port: 8787,
    hostname: "127.0.0.1",
});

// ... run your flow ...

server.stop();
```

The server defaults to `0.0.0.0:8787` and responds immediately once `startRpcServer` returns.

## Health and Clock Endpoints
Two read-only endpoints expose basic diagnostics. They require no payload.

```ts
await fetch("http://127.0.0.1:8787/health"); // { status: "ok", version: "Emulator" }
await fetch("http://127.0.0.1:8787/emulator/time"); // slot, epoch, block, currentUnix, slotLength
```

Use these in readiness checks or to snapshot the current ledger clock before scheduling transactions.

## Managing Wallets
Wallet endpoints let you bootstrap deterministic addresses and query their UTxOs without touching the in-memory API.

```ts
await fetch("http://127.0.0.1:8787/emulator/reset", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({}),
});

await fetch("http://127.0.0.1:8787/emulator/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ label: "carol", lovelace: "2000000" }),
});

const address = await fetch("http://127.0.0.1:8787/emulator/address/carol")
    .then((res) => res.json())
    .then((json) => json.address);

const utxos = await fetch("http://127.0.0.1:8787/emulator/wallets/carol/utxos")
    .then((res) => res.json()); // Array of CBOR-encoded UTxOs
```

The `/emulator/fund` endpoint accepts the same payload as `/emulator/register` and mints additional genesis-style outputs. Registry endpoints honour wallet labels; requesting an unknown label returns a `404`.

## Submitting Raw Transactions
Because the RPC server accepts raw CBOR, you can build transactions in any environment, extract the hex, and forward it to the emulator without the SDK.

```ts
const cbor = "84a300d9010281825820...f5f6"; // from tx.toCbor()

await fetch("http://127.0.0.1:8787/emulator/transactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cbor }),
});
```

The response includes the transaction ID. To confirm settlement, advance the clock by at least one block:

```ts
await fetch("http://127.0.0.1:8787/emulator/advance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ blocks: 1 }),
});
```

Finally, query `/emulator/state?include=utxos` and decode the CBOR outputs to verify balances.

## Generating API Documentation
If you want the RPC server to publish OpenAPI metadata, wrap the Hono application before starting the server. Combine `@hono/zod-openapi` with `@hono/swagger-ui` to expose both the JSON spec and an interactive explorer.

```ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import rpcApp from "@blaze-cardano/emulator/rpc/app";

const app = new OpenAPIHono();

app.route("/", rpcApp);

app.openapi(
    createRoute({
        method: "get",
        path: "/health",
        responses: {
            200: {
                description: "Health check status",
                content: {
                    "application/json": {
                        schema: z.object({ status: z.string() }),
                    },
                },
            },
        },
    }),
    (c) => rpcApp.fetch(c.req.raw),
);

app.get("/ui", swaggerUI({ url: "/doc" }));

app.doc("/doc", {
    openapi: "3.1.0",
    info: { title: "Emulator RPC", version: "1.0.0" },
});
```

The snippet above mounts the existing RPC routes, documents the health endpoint, serves the OpenAPI JSON at `/doc`, and hosts Swagger UI at `/ui`. Extend `createRoute` definitions to describe additional endpoints, and add hooks when you need to surface validation failures to clients.

## Publishing Scripts and Governance Utilities
Tests can inject reference scripts and adjust the governance committee over HTTP. The payloads mirror the in-memory API.

```ts
import { alwaysTrueScript } from "@blaze-cardano/emulator/testing";
import { HexBlob, Hash28ByteBase16 } from "@blaze-cardano/core";

await fetch("http://127.0.0.1:8787/emulator/scripts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ cbor: alwaysTrueScript.toCbor() }),
});

await fetch("http://127.0.0.1:8787/emulator/governance/committee", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
        quorumThreshold: { numerator: 1, denominator: 1 },
        members: [
            {
                coldCredentialHash: Hash28ByteBase16("11".repeat(28)).toString(),
                epoch: 5,
            },
        ],
    }),
});
```

Committee hot credentials can be set by posting to `/emulator/governance/committee/hot` and providing the cold credential hash plus the new key or script hash. Governance lookups (`/emulator/governance/dreps`, `/emulator/governance/proposal-status/:id`, `/emulator/governance/tallies/:id`) return the same structures as their in-memory counterparts and emit 400- or 404-level responses for malformed or unknown action IDs.

## Cleaning Up
Call `/emulator/reset` whenever you want to discard ledger state between scenarios, or invoke `server.stop()` to shut down the HTTP listener entirely. This keeps test runs isolated and ensures benchmarks stay deterministic.
