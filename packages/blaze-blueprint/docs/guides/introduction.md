---
title: Generate typed validators
---

# Generate typed validators

Aiken writes a [CIP-57 Plutus blueprint](https://cips.cardano.org/cip/CIP-0057) to `plutus.json` when it [builds a contract](https://aiken-lang.org/fundamentals/getting-started). The blueprint contains the compiled scripts, their hashes, validator parameters, and schemas for contract data. `@blaze-cardano/blueprint` turns that file into a TypeScript module that can be used directly with Blaze.

The generated module stores the script CBOR and creates one class for each validator purpose. It applies script parameters in the class constructor and generates serializers for the datum and redeemer schemas in the blueprint. Those classes extend `TypedScript`, so their datum and redeemer types carry through to the transaction builder.

## Install the generator

Install the Blueprint package as a development dependency. Generated modules always depend on `@blaze-cardano/data` for schema-based serialization.

For an application that imports Blaze through `@blaze-cardano/sdk`, install:

```sh
bun add @blaze-cardano/sdk @blaze-cardano/data
bun add --dev @blaze-cardano/blueprint
```

Use `--use-sdk` when generating the module. The output will import its Blaze types and script helpers from `@blaze-cardano/sdk`.

Projects that import individual Blaze packages can use the generator's default output instead:

```sh
bun add @blaze-cardano/core @blaze-cardano/data @blaze-cardano/tx @blaze-cardano/uplc
bun add --dev @blaze-cardano/blueprint
```

Keep the runtime packages on compatible Blaze versions. The generated module imports them when the application runs.

## Build the Aiken blueprint

Run Aiken from the contract project root:

```sh
aiken build
```

Aiken writes `plutus.json` in that directory. The generator reads the validator titles, Plutus version, compiled code, parameters, and data definitions from this file. If the contract does not build successfully, fix the Aiken errors before running the generator.

## Generate the TypeScript module

For an SDK-based application:

```sh
bunx @blaze-cardano/blueprint plutus.json --outfile src/generated/plutus.ts --use-sdk
```

For an application that imports the lower-level Blaze packages directly, omit `--use-sdk`:

```sh
bunx @blaze-cardano/blueprint plutus.json --outfile src/generated/plutus.ts
```

The CLI accepts the following arguments:

| Argument | Meaning |
| --- | --- |
| `<blueprint>` | Path to the CIP-57 `plutus.json` file. |
| `-o, --outfile <file>` | TypeScript file to write. This option is required by the CLI. |
| `-t, --traced-blueprint <file>` | Optional blueprint containing traced versions of the same validators. |
| `-s, --use-sdk` | Import Blaze functionality from `@blaze-cardano/sdk` instead of the individual core, transaction, and UPLC packages. |

The output directory must already exist. The generator replaces the output file each time it runs, so do not make manual changes in the generated module.

For a repeatable project build, put both commands in `package.json`:

```json
{
  "scripts": {
    "contracts:build": "aiken build && bunx @blaze-cardano/blueprint plutus.json --outfile src/generated/plutus.ts --use-sdk"
  }
}
```

Run the command whenever the Aiken validators, their parameters, their data types, or the Blueprint package version changes.

## Generate from TypeScript

Build scripts can call `generateBlueprint` instead of starting the CLI:

```ts
import { generateBlueprint } from "@blaze-cardano/blueprint";

await generateBlueprint({
  infile: "contracts/plutus.json",
  outfile: "src/generated/plutus.ts",
  useSdk: true,
});
```

The programmatic API defaults to `plutus.json` and `plutus.ts` in the current working directory. Set explicit paths in monorepos and CI jobs so the result does not depend on where the command was started.

| Option | Default | Meaning |
| --- | --- | --- |
| `infile` | `plutus.json` | Path to the production CIP-57 blueprint. |
| `outfile` | `plutus.ts` | TypeScript module to replace or create. |
| `tracedBlueprint` | None | Optional path to a traced blueprint containing the same validator titles. |
| `useSdk` | `false` | Use `@blaze-cardano/sdk` imports in the generated module. |

## What the generator writes

The generated module contains:

- TypeBox schemas and TypeScript input types for named contract data definitions;
- a class for every validator purpose in the blueprint;
- a constructor that applies the validator's parameters in blueprint order;
- an inherited `Script` property containing the parameterized Plutus script;
- a `datum()` method when the validator purpose has a datum;
- a `redeemer()` method for serializing the purpose's redeemer.

For example, the Blueprint test contract contains an Aiken validator with two parameters, a `List<Int>` datum, and an `Int` redeemer. Its generated spending class is used like this:

```ts
import { AlwaysTrueScriptSpend } from "./generated/plutus";

const validator = new AlwaysTrueScriptSpend(1n, "74657374");
const datum = validator.datum([1n, 2n]);
const redeemer = validator.redeemer(1n);

console.log(validator.Script.hash());
```

The second constructor argument above represents an Aiken `ByteArray`, so it is passed as a hexadecimal string. `74657374` is the UTF-8 text `test` encoded as hex.

The class name comes from the validator title and purpose recorded in `plutus.json`. A validator with several purposes produces a separate class for each purpose. Spending purposes normally have both `datum()` and `redeemer()`. Purposes without a datum only expose `redeemer()`.

The script language comes from the blueprint preamble. The generator supports PlutusV1, PlutusV2, and PlutusV3 blueprints and constructs the corresponding Blaze `Script` type.

The serializer methods accept normal TypeScript values shaped by the Aiken schema and return branded `PlutusData` values. Call these methods instead of manually constructing CBOR. The brand keeps values produced for different validator types separate during typechecking, even when their underlying on-chain representation happens to be the same.

## Lock assets with a generated validator

Pass the generated class instance directly to `lockScriptAssets`:

```ts
import { makeValue } from "@blaze-cardano/sdk";
import { AlwaysTrueScriptSpend } from "./generated/plutus";

const validator = new AlwaysTrueScriptSpend(1n, "74657374");
const datum = validator.datum([1n, 2n]);

const transaction = await blaze
  .newTransaction()
  .lockScriptAssets(validator, makeValue(2_000_000n), datum)
  .complete();
```

`lockScriptAssets` derives the payment credential from `validator.Script`. By default it constructs the script address for the builder's network. Pass a stake credential when the script output should use one:

```ts
builder.lockScriptAssets(validator, value, datum, {
  stakeCredential,
});
```

An application that already has a full script address can pass it explicitly:

```ts
builder.lockScriptAssets(validator, value, datum, {
  address: scriptAddress,
});
```

The explicit address must have a script payment credential. The transaction builder does not require that credential to match `validator.Script`, because an application may intentionally pair the same datum and redeemer types with another script. When passing an address explicitly, the application is responsible for choosing the script address it intends to lock at.

## Spend from the script

Use the generated class as the type argument to `addInput`. This binds the input's redeemer and optional unhashed datum to that validator:

```ts
const redeemer = validator.redeemer(1n);

const transaction = await blaze
  .newTransaction()
  .provideScript(validator.Script)
  .addInput<typeof validator>(scriptUtxo, redeemer)
  .complete();
```

If the script output stores only a datum hash, pass the original serialized datum as the final argument:

```ts
const transaction = await blaze
  .newTransaction()
  .provideScript(validator.Script)
  .addInput<typeof validator>(scriptUtxo, redeemer, datum)
  .complete();
```

Do not pass the datum again when the output already contains it inline.

The generated validator does not decide how the script witness is supplied. Use `provideScript(validator.Script)` for an attached script, or add the appropriate reference input when the transaction should use a reference script. Keeping witness selection explicit avoids attaching a script when the application intended to use an existing reference UTxO.

## How the type checks work

Each generated class extends `TypedScript<Datum, Redeemer>`. `lockScriptAssets` reads the datum type from the class, while `addInput<typeof validator>` reads both the redeemer type and the unhashed datum type.

This makes a value serialized for another validator a TypeScript error:

```ts
const orderDatum = orderValidator.datum(order);
const mintRedeemer = mintPolicy.redeemer(mintAction);

builder.lockScriptAssets(orderValidator, value, orderDatum);

// TypeScript rejects a minting-policy redeemer for the order validator.
builder.addInput<typeof orderValidator>(orderUtxo, mintRedeemer);
```

The check happens during TypeScript compilation. It does not prove that a UTxO is locked by `validator.Script`, or that the validator will accept the transaction. Cardano still validates the serialized datum, redeemer, script witness, and transaction context on chain. The generated types prevent one common class of application error; they do not replace script evaluation or transaction submission checks.

The generic argument on `addInput` is important. Calling the untyped form accepts general `PlutusData`, which is useful for low-level transaction construction but gives up the validator-specific datum and redeemer checks.

## Validator parameters

Blueprint parameters become constructor arguments in the same order as the parameter list in `plutus.json`. The constructor serializes the arguments and applies them to the compiled script before creating `validator.Script`.

```ts
const validator = new AlwaysTrueScriptSpend(1n, "74657374");
```

The resulting script hash belongs to that parameterized script. Changing a parameter creates a different script and a different address. Construct the validator once for a particular parameter set and reuse that instance when deriving addresses, locking outputs, finding reference scripts, and building spends.

## Traced validators

Aiken removes traces from a normal production build. Create a separate traced blueprint with `aiken build --trace-level verbose`, while keeping the untraced `plutus.json` produced by the normal `aiken build`. If a project keeps both files, pass them to the generator:

```sh
bunx @blaze-cardano/blueprint plutus.json \
  --traced-blueprint plutus.trace.json \
  --outfile src/generated/plutus.ts \
  --use-sdk
```

The traced blueprint must contain validators with the same titles as the production blueprint. Generated constructors then receive a final optional `trace` argument:

```ts
const productionValidator = new AlwaysTrueScriptSpend(1n, "74657374");
const tracedValidator = new AlwaysTrueScriptSpend(1n, "74657374", true);
```

Traced and untraced scripts have different hashes. Use the production script for deployed addresses and reference scripts unless the application deliberately targets the traced version. A transaction cannot spend an output locked by one hash using the other script.

## Keep generated code current

Treat the generated TypeScript module as a build artifact. Either commit it and verify regeneration in CI, or generate it before typechecking and packaging the application. In both cases, use a fixed Blueprint package version and fail CI when regeneration changes a committed file.

A useful contract build checks three things:

1. `aiken build` succeeds.
2. Blueprint generation succeeds.
3. The application typechecks against the regenerated module.

This catches changes to validator parameters and data schemas before transaction code reaches a network.

## Common problems

### A generated class is missing

Open `plutus.json` and inspect `validators[].title`. The generator creates classes from those entries, not directly from Aiken source filenames. Make sure `aiken build` ran after the validator or purpose was added.

### Generated imports cannot be resolved

Regenerate with `--use-sdk` if the application depends on `@blaze-cardano/sdk`. Otherwise install the individual runtime packages listed at the start of this guide. Both output modes also require `@blaze-cardano/data`.

### A datum or redeemer has the wrong shape

Pass the ordinary TypeScript value expected by the generated `datum()` or `redeemer()` method. Let the method perform schema serialization. TypeScript reports the expected input shape at the call site.

### Script validation reports a missing witness

The generated class does not attach itself to a transaction. Provide `validator.Script` or add the reference input that contains the script.

### The script hash changed unexpectedly

Check the Aiken source, parameter values, Plutus version, trace setting, and Blueprint package version. Each of these can change the generated script or its serialization. Never substitute a traced script for a production script based only on the validator class name.

### The generated types look stale

Rebuild the Aiken project and regenerate the TypeScript module. Do not patch the generated file by hand because the next generator run will overwrite it.
