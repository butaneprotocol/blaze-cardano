---
title: Emulator RPC server
---

# Emulator RPC server

The emulator includes an optional HTTP server. It is useful when a test process, demo, or external tool needs to control the emulator without importing the `Emulator` class.

## Start the server

Import the server from `@blaze-cardano/emulator/rpc` to run it inside a test runner or standalone script.

```ts
import { startRpcServer } from "@blaze-cardano/emulator/rpc";

const server = startRpcServer({
  port: 8787,
  hostname: "127.0.0.1",
});
await server.ready;

// ... run your flow ...

server.stop();
```

The server defaults to `127.0.0.1:8787`. Pass `--host 0.0.0.0` only when another machine or container needs to connect.

You can also start the packaged command:

```sh
blaze-emulator-rpc --host 127.0.0.1 --port 8787
```

During development, run the same entrypoint through the package script:

```sh
bun --filter @blaze-cardano/emulator serve:rpc -- --host 127.0.0.1 --port 8787
```

The server publishes OpenAPI JSON at `/doc` and Swagger UI at `/ui`.

## Health and clock endpoints

Use these read-only endpoints to check the server and inspect its clock. Neither takes a payload.

```ts
await fetch("http://127.0.0.1:8787/health"); // { status: "ok", version: "Emulator" }
await fetch("http://127.0.0.1:8787/emulator/time"); // slot, epoch, block, currentUnix, slotLength
```

They are also useful for readiness checks and transaction scheduling.

## Network and timing configuration

The reset endpoint accepts a network preset and optional timing overrides. Each preset supplies the chain ID, slot configuration, and default epoch and block lengths. Use custom values when a validity interval, epoch, or wallet test should not follow mainnet, preprod, preview, or SanchoNet.

```ts
await fetch("http://127.0.0.1:8787/emulator/reset", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    networkPreset: "preview",
    slotConfig: {
      zeroTime: 1666656000000,
      zeroSlot: 0,
      slotLength: 1000,
    },
    slotsPerEpoch: 432000,
    slotsPerBlock: 20,
  }),
});

const config = await fetch("http://127.0.0.1:8787/emulator/config").then((res) =>
  res.json(),
);
const parameters = await fetch(
  "http://127.0.0.1:8787/emulator/parameters",
).then((res) => res.json());
```

The available presets are `mainnet`, `preprod`, `preview`, `sanchonet`, and `custom`. A reset request may override `chainId`, individual `slotConfig` fields, `slotsPerEpoch`, `slotsPerBlock`, and `protocolParams`. Omitted fields keep the preset values.

Protocol cost models use a JSON object keyed by Plutus language version. This means a client can read `/emulator/parameters`, change selected fields, and send the result in another reset request. `slotLength` is measured in milliseconds. `slotsPerBlock` controls how many slots the emulator advances for each block.

The same presets are available to in-process tests:

```ts
import { Emulator, createEmulatorNetworkConfig } from "@blaze-cardano/emulator";

const emulator = new Emulator(
  [],
  createEmulatorNetworkConfig({
    preset: "preview",
    slotConfig: { slotLength: 2_000 },
    slotsPerBlock: 5,
  }),
);
```

## Manage wallets

Wallet endpoints create funded addresses and return their UTxOs without using the in-memory API.

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

The `/emulator/fund` endpoint accepts the same payload as `/emulator/register` and mints extra genesis-style outputs. Wallet endpoints use labels. Unknown labels return `404`.

## Submit raw transactions

The transaction endpoint accepts raw CBOR, so the transaction can come from Blaze, another TypeScript builder, Haskell code, or `cardano-cli`.

```ts
const cbor = "84a300d9010281825820...f5f6"; // from tx.toCbor()

await fetch("http://127.0.0.1:8787/emulator/transactions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ cbor }),
});
```

The response includes the transaction ID. To confirm settlement, advance the clock by at least one block.

```ts
await fetch("http://127.0.0.1:8787/emulator/advance", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ blocks: 1 }),
});
```

Query `/emulator/state?include=utxos` and decode the CBOR outputs to verify balances. `/emulator/parameters` returns the values an external builder needs for fee calculation, transaction limits, and script execution budgets.

Transaction submission does not depend on Blaze `TxBuilder`. The RPC test suite assembles and signs a transaction with the lower-level Cardano serialization primitives, then submits its CBOR through the same endpoint.

`cardano-cli transaction sign` writes a JSON text envelope. Read its `cborHex` field before sending it to the emulator:

```ts
import { readFile } from "node:fs/promises";

const envelope = JSON.parse(await readFile("tx.signed", "utf8")) as {
  cborHex: string;
};

await fetch("http://127.0.0.1:8787/emulator/transactions", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ cbor: envelope.cborHex }),
});
```

## Publish scripts and governance data

The HTTP API can publish reference scripts and change the governance committee. Its payloads match the in-memory API.

```ts
import {
  Hash28ByteBase16,
  HexBlob,
  PlutusV2Script,
  Script,
} from "@blaze-cardano/core";

const alwaysTrueScript = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

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

Set committee hot credentials by posting to `/emulator/governance/committee/hot` with the cold credential hash and the new key or script hash. Governance lookups (`/emulator/governance/dreps`, `/emulator/governance/proposal-status/:id`, `/emulator/governance/tallies/:id`) return the same structures as the in-memory API. Malformed or unknown action IDs return `400` or `404`.

## Clean up

Call `/emulator/reset` to discard ledger state between scenarios, or call `server.stop()` to shut down the HTTP listener.
