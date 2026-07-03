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

## Safety checks and error scenarios

The builder rejects several common transaction-construction mistakes before they reach the chain. Each one throws a named error so callers can catch it and react.

### Mismatched datum or redeemer types

`addInput<T>`, `lockScriptAssets`, and the generated blueprint validators bind a datum type and a redeemer type to one script. Passing a value that belongs to a different script is a compile-time error, not a runtime one:

```ts
// @ts-expect-error redeemer belongs to a different validator
tx.addInput<typeof orderValidator>(orderUtxo, mintRedeemer);
```

TypeScript rejects the call during typecheck, so a mismatched datum or redeemer never reaches transaction building. This is why the typed `addInput<typeof validator>` form is preferred over the untyped call: the untyped call accepts any `PlutusData` and gives up this protection.

### Non-positive mint or burn quantities

`mintAssets` and `burnAssets` take positive quantities at the call site and throw `TransactionSafetyError` for anything at or below zero. `burnAssets` converts the positive amounts into the negative mint entries the ledger expects, so burning is always explicit and a sign mistake cannot silently flip a mint into a burn:

```ts
import { TransactionSafetyError } from "@blaze-cardano/tx";

try {
  tx.burnAssets(policyId, new Map([[assetName, 0n]]));
} catch (error) {
  if (error instanceof TransactionSafetyError) {
    // "burnAssets: asset "..." quantity must be positive."
  }
}
```

### Reusing a completed builder

A `TxBuilder` builds one transaction. Calling `complete()` a second time on the same builder throws `TxBuilderReuseError` rather than returning a stale or partially rebalanced transaction. Start a new `TxBuilder` for each transaction:

```ts
import { TxBuilderReuseError } from "@blaze-cardano/tx";

const tx = await builder.complete();
try {
  await builder.complete(); // throws
} catch (error) {
  if (error instanceof TxBuilderReuseError) {
    // create a fresh TxBuilder for the next transaction
  }
}
```

### Missing network id

`lockScriptAssets` derives the script address from the validator hash and the builder network. If no network id is set and no explicit address is supplied, it throws so the transaction cannot be built against the wrong network. Call `setNetworkId` first, or pass an explicit `address`. Changing the network id also clears any cached burn address so it is never reused across networks.
