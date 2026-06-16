---
title: Transaction safety
---

# Transaction safety

`TxBuilder` includes checks for common transaction-construction mistakes: duplicate inputs, duplicate reference inputs, missing datum data for datum-hash script outputs, invalid payment or script addresses, output minimum ada, value-size limits, and transaction reuse after completion.

## Complete a Builder Once

Call `complete()` once for each `TxBuilder`. After a builder has produced a transaction, calling `complete()` again throws `TxBuilderReuseError`.

```ts
const builder = blaze.newTransaction().payLovelace(receiver, 5_000_000n);

const tx = await builder.complete();

await builder.complete(); // throws TxBuilderReuseError
```

Create a new builder for the next transaction. This avoids accidentally reusing a balanced body after fees, change, collateral, and script budgets have been finalized.

## Explicit Asset Movement

Use `transferAssets` when the transaction intentionally sends a full `Value` to a payment address.

```ts
const tx = await blaze
  .newTransaction()
  .transferAssets(receiverAddress, makeValue(2_000_000n, [assetId, 1n]))
  .complete();
```

Use `mintAssets` for positive mint quantities and `burnAssets` for positive burn quantities. `burnAssets` converts the quantities into negative mint entries internally, so call sites do not need to pass negative numbers by hand.

```ts
const assets = new Map([[assetName, 1n]]);

const tx = await blaze
  .newTransaction()
  .burnAssets(policyId, assets, redeemer)
  .complete();
```

Both helpers reject zero and negative quantities.

## Error Surfaces

Safety-specific errors use named error classes:

```ts
import { TransactionSafetyError, TxBuilderReuseError } from "@blaze-cardano/tx";
```

Use these classes in tests when an application needs to distinguish safety failures from provider or wallet failures.
