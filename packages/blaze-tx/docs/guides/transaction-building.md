---
title: Transaction building
---

# Transaction building

`TxBuilder` builds Cardano transactions by collecting inputs, outputs, script data, metadata, and protocol parameters before producing a complete transaction.

Most applications use it through `Blaze`:

```ts
const tx = await blaze
  .newTransaction()
  .payLovelace(receiverAddress, 5_000_000n)
  .complete();
```

You can also construct `TxBuilder` directly if you already have protocol parameters and want to manage wallet, provider, and signing code yourself.

## Paying ada and assets

Use `payLovelace` for ada payments and `payAssets` when the output contains a full `Value`.

```ts
import { makeValue } from "@blaze-cardano/tx";

const assetId = policyId + assetName;

const tx = await blaze
  .newTransaction()
  .payLovelace(receiverAddress, 5_000_000n)
  .payAssets(receiverAddress, makeValue(2_000_000n, [assetId, 1n]))
  .complete();
```

The builder checks that payment outputs use a payment address. If the transaction needs change, `Blaze.newTransaction()` sets the change address from the wallet before completion.

## Attaching metadata

Use `setMetadata` to attach transaction metadata. The builder stores it in auxiliary data and updates the auxiliary data hash on the transaction body.

```ts
import { Core } from "@blaze-cardano/sdk";

const labels = new Map([[674n, Core.Metadatum.newText("order:1234")]]);

const tx = await blaze
  .newTransaction()
  .payLovelace(receiverAddress, 5_000_000n)
  .setMetadata(new Core.Metadata(labels))
  .complete();
```

Use metadata for data that belongs to the transaction as a whole. Use datums for data that belongs to a script output.

## Locking assets at scripts

Use `lockLovelace` or `lockAssets` when an output belongs to a script address. A script lock needs a datum. The datum can be inline `PlutusData` or a datum hash, depending on how the script expects to read it.

```ts
import { Core, makeValue } from "@blaze-cardano/sdk";

const datum = Core.PlutusData.newInteger(42n);

const tx = await blaze
  .newTransaction()
  .lockAssets(scriptAddress, makeValue(2_000_000n), datum)
  .complete();
```

`lockLovelace` is a convenience method for ada-only script outputs:

```ts
const tx = await blaze
  .newTransaction()
  .lockLovelace(scriptAddress, 2_000_000n, datum)
  .complete();
```

If the output should carry a reference script, pass the script as the final argument.

```ts
const tx = await blaze
  .newTransaction()
  .lockAssets(scriptAddress, makeValue(2_000_000n), datum, validatorScript)
  .complete();
```

## Spending script UTxOs

Use `addInput` to spend a UTxO. For a script UTxO, pass the redeemer as the second argument.

```ts
const tx = await blaze
  .newTransaction()
  .addInput(scriptUtxo, redeemer)
  .provideScript(validatorScript)
  .payLovelace(receiverAddress, 1_500_000n)
  .complete();
```

If the UTxO has an inline datum, the builder reads it from the output. If the UTxO only has a datum hash, pass the unhashed datum as the third argument.

```ts
const tx = await blaze
  .newTransaction()
  .addInput(scriptUtxo, redeemer, datum)
  .provideScript(validatorScript)
  .payLovelace(receiverAddress, 1_500_000n)
  .complete();
```

The datum is attached to the locked output. The redeemer is used later when spending that output.

## Providing scripts and datums

Use `provideScript` when the transaction must carry the script witness itself. You usually need this when the script is not available through a reference script.

```ts
const tx = await blaze
  .newTransaction()
  .addInput(scriptUtxo, redeemer)
  .provideScript(validatorScript)
  .complete();
```

Use `provideDatum` for extra Plutus data that the transaction needs as witness data but does not attach directly to an output.

```ts
const tx = await blaze
  .newTransaction()
  .provideDatum(extraDatum)
  .addInput(scriptUtxo, redeemer)
  .provideScript(validatorScript)
  .complete();
```

## Deploying reference scripts

Use `deployScript` to create an output that carries a script reference. Pass an address when your application needs to keep control of that output.

```ts
const tx = await blaze
  .newTransaction()
  .deployScript(validatorScript, ownerAddress)
  .complete();
```

If you do not pass an address, the builder locks the reference script at a burn address. This is useful in testing when your application wants to guarantee the ref-script utxo won't be spent by accident.

```ts
const tx = await blaze
  .newTransaction()
  .deployScript(validatorScript)
  .complete();
```

Later transactions can spend script UTxOs by referencing these UTxOs instead of attaching the full script again.

## Completing and submitting

`complete()` selects inputs, calculates fees, evaluates scripts when an evaluator is configured, adds collateral when needed, and returns a transaction.

```ts
const tx = await blaze
  .newTransaction()
  .payLovelace(receiverAddress, 5_000_000n)
  .complete();
```

Sign the completed transaction, then submit it through `Blaze`.

```ts
const signed = await blaze.signTransaction(tx);
const txId = await blaze.submitTransaction(signed);
```

`submitTransaction(tx)` uses the wallet submission path. Pass `true` as the second argument to submit through the configured provider instead.

```ts
const txId = await blaze.submitTransaction(signed, true);
```

For tests, the emulator provider accepts the same completed and signed transaction through `postTransactionToChain`.
