---
title: "@blaze-cardano/blueprint"
---

`@blaze-cardano/blueprint` generates TypeScript modules from CIP-57 Plutus blueprints. It reads the `plutus.json` produced by Aiken and writes script classes, contract data schemas, parameter types, and datum and redeemer serializers for use with Blaze.

Each generated validator class extends `TypedScript`. The class keeps its compiled `Script`, applies validator parameters in its constructor, and binds the datum and redeemer types expected by the script. This lets the transaction builder catch a mismatched datum or redeemer during TypeScript typechecking.

## Start here

The [Blueprint guide](./guides/introduction.md) covers the complete workflow:

- building an Aiken project and generating `plutus.json`;
- running the Blueprint CLI or `generateBlueprint` API;
- constructing generated validators and serializing contract data;
- locking and spending assets with the generated `TypedScript` classes;
- handling script parameters, traced builds, imports, and regeneration.

The generated module is ordinary TypeScript. Applications can commit it to the repository or generate it during a build, as long as the file stays in sync with the Aiken blueprint and the Blueprint package version.

## API reference

- [`generateBlueprint`](./api/blueprint.generateblueprint.md) generates a TypeScript module programmatically.
- [`Generator`](./api/blueprint.generator_2.md) contains the lower-level code generator used by `generateBlueprint`.

Most applications should use the CLI or `generateBlueprint`. `Generator` is public for projects that need to control code generation directly.
