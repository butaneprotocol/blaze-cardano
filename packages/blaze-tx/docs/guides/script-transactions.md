---
title: Script transactions
---

# Script transactions

Script transactions use datums, redeemers, scripts, and script addresses. Blaze exposes low-level methods for direct `PlutusData` values and typed wrappers when an application wants TypeScript to keep datum and redeemer types paired with a specific script.

## Define a Typed Script

```ts
import { defineTypedScript } from "@blaze-cardano/tx";
import { Core } from "@blaze-cardano/sdk";

type OrderDatum = Core.PlutusData;
type CancelRedeemer = Core.PlutusData;

const orderValidator = defineTypedScript<OrderDatum, CancelRedeemer>(
  validatorScript,
  { name: "order-validator" },
);
```

The wrapper keeps the original `Script` at `orderValidator.script`. The generic datum and redeemer types are only used by TypeScript.

## Lock Assets With a Typed Datum

```ts
const tx = await blaze
  .newTransaction()
  .lockTypedAssets(orderValidator, scriptAddress, makeValue(2_000_000n), datum)
  .complete();
```

`lockTypedAssets` calls `lockAssets` internally and uses the wrapped script as the reference script unless another script reference is passed.

## Spend With a Typed Redeemer

```ts
const tx = await blaze
  .newTransaction()
  .addTypedInput(orderUtxo, orderValidator, cancelRedeemer, datum)
  .payLovelace(receiverAddress, 1_500_000n)
  .complete();
```

If the UTxO has an inline datum, omit the final datum argument. If the UTxO stores only a datum hash, pass the unhashed datum as the final argument.

Use `provideScript(orderValidator.script)` when the transaction needs to include the script witness directly instead of using a reference script.
