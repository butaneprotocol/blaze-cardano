---
title: Developer onboarding
---

# Developer onboarding

A Blaze app starts with a provider and wallet. `Blaze.from` combines them. `newTransaction` creates a builder with the provider's network and parameters, then adds wallet inputs when the transaction is completed.

## Install the SDK

```sh
bun add @blaze-cardano/sdk
```

The SDK re-exports the query providers, transaction builder, wallet types, and core Cardano types used in most applications.

## Pick a provider

Use `Blockfrost`, `Maestro`, or `Kupmios` when talking to a real network. Use `RoutedProvider` when different backends should handle reads, evaluation, and submission.

```ts
import { Blockfrost, Maestro, RoutedProvider } from "@blaze-cardano/sdk";

const queryProvider = new Blockfrost({
  network: "cardano-preview",
  projectId: process.env.BLOCKFROST_PROJECT_ID!,
});

const submissionProvider = new Maestro({
  network: "preview",
  apiKey: process.env.MAESTRO_API_KEY!,
});

const provider = new RoutedProvider({
  defaultProvider: queryProvider,
  queryProvider,
  evaluationProvider: submissionProvider,
  submissionProvider,
});
```

The query package provider guides describe provider internals and network requests.

## Build and submit a payment

`Blaze.from` binds a provider and wallet. `newTransaction` returns a transaction builder with the provider parameters already available.

```ts
import { Blaze, Core, HotWallet } from "@blaze-cardano/sdk";

const masterKey = process.env.WALLET_MASTER_KEY;
if (!masterKey) throw new Error("WALLET_MASTER_KEY is required");

const wallet = await HotWallet.fromMasterkey(
  Core.Bip32PrivateKeyHex(masterKey),
  provider,
);
const blaze = await Blaze.from(provider, wallet);
const receiver = Core.Address.fromBech32("addr_test...");

const tx = await blaze
  .newTransaction()
  .payLovelace(receiver, 5_000_000n)
  .complete();

const signed = await blaze.signTransaction(tx);
await blaze.submitTransaction(signed, true);
```

## Query chain state

Provider methods return core Cardano objects rather than JSON transport payloads.

```ts
const utxos = await provider.getUnspentOutputs(wallet.address);
const params = await provider.getParameters();
const slotConfig = provider.getSlotConfig();

console.log(utxos.length, params.minFeeCoefficient, slotConfig.slotLength);
```

## Build with an Aiken validator

The Blueprint package turns Aiken's `plutus.json` into generated `TypedScript` classes. The [Blueprint guide](/blueprint/guides/introduction) covers generation, validator parameters, typed datums and redeemers, attached scripts, and reference inputs. The [Aiken contract tutorial](./aiken-contract-tutorial.md) follows a complete local transaction flow.

Run the example workspace to compile its validator, regenerate `plutus.ts`, deploy a reference script, lock an inline datum, query the script UTxO, and spend it through the emulator:

```sh
bun install
bun --filter script-deploy-aiken start
```

## Provider checklist

Check the provider setup before connecting it to a UI or service:

- One backend can handle every operation through Blockfrost, Maestro, or Kupmios directly.
- `RoutedProvider` can send reads, evaluation, and submission to different backends.
- Per-operation routing can send an individual query to a specific backend.
- Route debug logs may contain addresses, transaction bodies, or provider parameters. Enable them only while investigating a problem and redact them before storing the output.

The query package guides cover the provider network requests and the routing/debug event shape in more detail.
