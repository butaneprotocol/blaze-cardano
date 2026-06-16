# Introduction

`@blaze-cardano/blueprint` is the bridge between Aiken-generated blueprints and Blaze transaction code.

An Aiken project writes validator metadata to `plutus.json`. The blueprint package lets Blaze code load that metadata, locate validators, and pass the compiled scripts into transaction-building flows without manually copying script CBOR around the codebase.

Typical usage:

1. Build the Aiken project so `plutus.json` is current.
2. Load the validator from the blueprint.
3. Use the validator script with `@blaze-cardano/tx` or `@blaze-cardano/sdk`.

For a complete transaction flow, see the SDK [Aiken transaction guide](/sdk/guides/aiken-transaction).
