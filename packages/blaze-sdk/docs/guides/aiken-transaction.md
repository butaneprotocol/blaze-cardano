---
title: Aiken transactions
---

# Aiken transactions

Aiken validators are used from Blaze as Plutus scripts. The workflow is: compile the Aiken project, load the validator from the generated blueprint, turn the validator CBOR into a Blaze `Script`, build a script address, and then use the transaction-builder methods for locking and spending.

The runnable example in `examples/script-deploy-aiken` follows the same shape with a minimal `always_true` validator.

## Compile the validator

Run Aiken from the contract project so it writes `plutus.json`.

```sh
aiken build
```

The generated blueprint contains the compiled validator CBOR. Load the validator by title, then construct a Blaze script.

```ts
import { Core, defineTypedScript, makeValue } from "@blaze-cardano/sdk";
import { addressFromValidator } from "@blaze-cardano/core";

type OrderDatum = Core.PlutusData;
type SpendRedeemer = Core.PlutusData;

const validatorScript = Core.Script.newPlutusV2Script(
  new Core.PlutusV2Script(Core.HexBlob(compiledValidatorCbor)),
);
```

## Create the script address

Use the target network when deriving the script address. Preview, preprod, and mainnet addresses are different even when the script hash is the same.

```ts
const scriptAddress = addressFromValidator(Core.NetworkId.Testnet, validatorScript);
```

## Pair datum and redeemer types

Wrap the script with the datum and redeemer types used by the off-chain code. The wrapper keeps the runtime script while giving TypeScript a stable place to enforce the pair.

```ts
const typedValidator = defineTypedScript<OrderDatum, SpendRedeemer>(validatorScript, { name: "order-validator" });
const datum = Core.PlutusData.newInteger(42n);
```

## Lock value at the script

Lock the value with the datum expected by the validator. Use metadata for transaction-level information; use the datum for state that the validator will read when the output is spent.

```ts
const lockTx = await blaze
  .newTransaction()
  .lockTypedAssets(typedValidator, scriptAddress, makeValue(2_000_000n), datum)
  .complete();
```

## Spend the script output

When spending an Aiken script output, provide the redeemer and either the script witness or a reference input that carries the script.

```ts
const spendTx = await blaze
  .newTransaction()
  .addTypedInput(scriptUtxo, typedValidator, redeemer, datum)
  .provideScript(validatorScript)
  .payLovelace(receiverAddress, 1_500_000n)
  .complete();
```

If the script was deployed as a reference script, resolve it through the provider and add it as a reference input instead of carrying the full script witness.

```ts
const scriptRef = await provider.resolveScriptRef(validatorScript, scriptAddress);

const spendWithRefTx = await blaze
  .newTransaction()
  .addTypedInput(scriptUtxo, typedValidator, redeemer, datum)
  .addReferenceInput(scriptRef)
  .payLovelace(receiverAddress, 1_500_000n)
  .complete();
```

For deployment workflows, use `@blaze-cardano/deploy` or the SDK re-export to define a manifest, deploy reference scripts, and keep a cache of verified script-reference UTxOs.
