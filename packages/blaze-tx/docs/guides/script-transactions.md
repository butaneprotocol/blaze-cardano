---
title: Script transactions
---

# Script transactions

Script transactions use datums, redeemers, scripts, and script addresses. Blaze exposes low-level methods for direct `PlutusData` values and typed wrappers when an application wants TypeScript to keep datum and redeemer types paired with a specific script.

## Define a Typed Script

```ts
import { TypedScript } from "@blaze-cardano/tx";
import { Core } from "@blaze-cardano/sdk";

type OrderDatum = Core.PlutusData;
type CancelRedeemer = Core.PlutusData;

const orderValidator = new TypedScript<OrderDatum, CancelRedeemer>(
  validatorScript,
  "order-validator",
);
```

The wrapper keeps the original `Script` at `orderValidator.Script`. The generic datum and redeemer types are only used by TypeScript.

## Lock Assets With a Typed Datum

```ts
const tx = await blaze
  .newTransaction()
  .lockScriptAssets(orderValidator, makeValue(2_000_000n), datum)
  .complete();
```

`lockScriptAssets` constructs the script address from the validator hash and the builder network. Pass a stake credential when the output should use one:

```ts
tx.lockScriptAssets(orderValidator, makeValue(2_000_000n), datum, {
  stakeCredential,
});
```

If the application already has a full script address, pass it explicitly:

```ts
tx.lockScriptAssets(orderValidator, makeValue(2_000_000n), datum, {
  address: scriptAddress,
});
```

## Spend With a Typed Redeemer

```ts
const tx = await blaze
  .newTransaction()
  .addInput<typeof orderValidator>(orderUtxo, cancelRedeemer, datum)
  .payLovelace(receiverAddress, 1_500_000n)
  .complete();
```

If the UTxO has an inline datum, omit the final datum argument. If the UTxO stores only a datum hash, pass the unhashed datum as the final argument.

The generic argument keeps the redeemer and unhashed datum types tied to the typed script. Provide the script witness explicitly with `provideScript(orderValidator.Script)`, a reference script input, or whichever witness path the transaction should use.
