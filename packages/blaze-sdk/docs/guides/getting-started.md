---
title: Getting started
---

# Getting started

`@blaze-cardano/sdk` re-exports the main Blaze packages and provides the `Blaze` class for common wallet plus provider workflows.

```ts
import { Blaze, Blockfrost, WebWallet } from "@blaze-cardano/sdk";

const provider = new Blockfrost({
  network: "cardano-preview",
  projectId: process.env.BLOCKFROST_PROJECT_ID!,
});

const wallet = await WebWallet.enable("lace");
const blaze = await Blaze.from(provider, wallet);
```

Build a transaction through `newTransaction()`.

```ts
const tx = await blaze
  .newTransaction()
  .payLovelace(receiverAddress, 5_000_000n)
  .complete();

const signed = await blaze.signTransaction(tx);
const txId = await blaze.submitTransaction(signed, true);
```

Use package-specific guides for advanced transaction building, query caching, provider routing, emulator testing, and script deployment.
