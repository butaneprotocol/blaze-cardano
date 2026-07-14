---
title: Aiken contract tutorial
---

# Aiken contract tutorial

This tutorial uses the runnable [`script-deploy-aiken`](https://github.com/butaneprotocol/blaze-cardano/tree/main/examples/script-deploy-aiken) workspace. It compiles an Aiken validator, generates a typed TypeScript class, deploys the script as a reference script, locks an inline datum, queries the resulting UTxO, and spends it in the emulator.

## Run the complete flow

Install the repository dependencies, then run the example from the repository root:

```sh
bun install
bun --filter script-deploy-aiken start
```

The `start` script runs three commands in order:

1. `aiken build` compiles `validators/always_true.ak` and writes `plutus.json`.
2. `@blaze-cardano/blueprint` regenerates `plutus.ts` from that blueprint.
3. `index.ts` executes the deployment, lock, query, and spend flow against the emulator.

The command prints the deployment, lock, and spend transaction IDs. It also reports how many UTxOs the provider returned at the script address. Any failed build, evaluation, query, or submission exits with an error.

## Generate the validator class

The example generates its TypeScript module with:

```sh
bunx @blaze-cardano/blueprint plutus.json --outfile plutus.ts --use-sdk
```

The validator title in this blueprint is `always_true.always_true.spend`, so the generated spending class is named `AlwaysTrueAlwaysTrueSpend`. It extends `TypedScript`, stores the compiled validator in `Script`, and exposes `datum()` and `redeemer()` serializers.

```ts
import { Core } from "@blaze-cardano/sdk";
import { AlwaysTrueAlwaysTrueSpend } from "./plutus";

const validator = new AlwaysTrueAlwaysTrueSpend();
const data = Core.PlutusData.fromCbor(Core.HexBlob("00"));
const datum = validator.datum(data);
const redeemer = validator.redeemer(data);
```

The example validator accepts general Aiken `Data`, so its datum and redeemer start as `PlutusData`. A contract with named Aiken data types generates serializer methods for the corresponding TypeScript object, tuple, integer, byte string, or union. The [Blueprint guide](/blueprint/guides/introduction) covers those shapes, validator parameters, and regeneration.

## Start the emulator

The example creates an empty emulator, registers a funded wallet, and runs the remaining steps as that wallet:

```ts
import {
  createEmulatorNetworkConfig,
  Emulator,
} from "@blaze-cardano/emulator";

const emulator = new Emulator([], createEmulatorNetworkConfig("preview"));
const deploymentAddress = await emulator.register(
  "deployer",
  makeValue(100_000_000n),
);

await emulator.as("deployer", async (blaze) => {
  const provider = blaze.provider;
  // deployment and transactions
});
```

`emulator.as` supplies a `Blaze` instance backed by `EmulatorProvider` and the registered hot wallet. The transaction code inside the callback uses the same provider, wallet, and builder interfaces as a network-backed application.

## Deploy the reference script

`deployScriptRefs` reconciles the manifest with the provider, submits any missing deployment transaction, waits for confirmation, and returns the resolved reference UTxO:

```ts
const result = await deployScriptRefs({
  manifest: manifest(deploymentAddress, validator.Script),
  provider,
  wallet: blaze.wallet,
  cache,
});

const referenceUtxo = result.records.find(
  (record) => record.status === "matched",
)?.utxo;

if (!referenceUtxo) {
  throw new Error("The deployed reference script could not be resolved.");
}
```

The reference UTxO is kept as a full `TransactionUnspentOutput`, so it can be passed straight to `addReferenceInput` later. There is no second lookup before building the spending transaction.

## Lock the datum

`lockScriptAssets` takes the generated validator, value, and matching generated datum. Since `Blaze.newTransaction()` already knows the provider network, the builder can derive the script payment address from `validator.Script`.

```ts
const lockTx = await blaze
  .newTransaction()
  .lockScriptAssets(validator, makeValue(3_000_000n), datum)
  .complete();

const lockTxId = await blaze.submitTransaction(
  await blaze.signTransaction(lockTx),
  true,
);
emulator.awaitTransactionConfirmation(lockTxId);
```

Pass `{ stakeCredential }` when the script address needs a staking credential, or `{ address }` when the application already controls the full script address. The explicit address form is useful when an application has its own address construction policy.

## Query the script UTxO

The example derives the same script address and queries it through the provider interface:

```ts
const scriptAddress = Core.addressFromCredential(
  provider.network,
  Core.Credential.fromCore({
    type: Core.CredentialType.ScriptHash,
    hash: validator.Script.hash(),
  }),
);

const scriptUtxos = await provider.getUnspentOutputs(scriptAddress);
const scriptUtxo = scriptUtxos.find(
  (utxo) => utxo.input().transactionId() === lockTxId,
);

if (!scriptUtxo) {
  throw new Error("The script output was not returned by the provider.");
}
```

Selecting by transaction ID avoids relying on output order or assuming the address contains only one UTxO. On a public network, the same query works through Blockfrost, Maestro, Kupmios, or a routed provider.

## Spend with the typed redeemer

The spending transaction uses the deployed reference input rather than attaching the validator again:

```ts
const spendTx = await blaze
  .newTransaction()
  .addReferenceInput(referenceUtxo)
  .addInput<typeof validator>(scriptUtxo, redeemer)
  .complete();

const spendTxId = await blaze.submitTransaction(
  await blaze.signTransaction(spendTx),
  true,
);
emulator.awaitTransactionConfirmation(spendTxId);
```

The `typeof validator` argument binds `addInput` to this validator's redeemer and datum types. If the output stores only a datum hash, pass the original serialized datum as the third argument. The example uses an inline datum, so no unhashed datum is needed.

Witness selection remains explicit. Use `addReferenceInput` when a deployed reference UTxO should provide the script, or `provideScript(validator.Script)` when the transaction should carry the script itself.

## Adapt the example

To use this layout for another contract:

1. Replace the Aiken validator and rebuild the blueprint.
2. Import the new generated spending class from `plutus.ts`.
3. Construct its parameters, datum, and redeemer with the generated methods.
4. Change the deployment manifest name and version when the script changes.
5. Keep the provider query and explicit witness path appropriate for the application.

Run the workspace typecheck after regenerating:

```sh
bun --filter script-deploy-aiken typecheck
```

The generated types catch mismatched datums and redeemers during TypeScript compilation. Run the emulator example as well. It checks transaction balancing, script evaluation, witnesses, and ledger behavior that static types cannot prove.
