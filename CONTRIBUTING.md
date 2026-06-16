# Contributing

This project is maintained as a Bun workspace monorepo.

## Local Checks

Run focused package checks while developing:

```sh
bun --filter @blaze-cardano/query test
bun --filter @blaze-cardano/tx test
bun --filter @blaze-cardano/deploy test
```

Before opening a pull request, run the relevant typecheck and lint commands for the touched packages. CI runs the broader workspace checks.

## Changesets

User-facing package changes need a changeset. Do not edit generated changelog files by hand.

```sh
bun changeset
```

## Provider Work

Provider changes should document which backend calls are made, how pagination works, and how errors are surfaced. If a provider has a stronger implementation for a method such as `resolveScriptRef`, add provider-specific tests and keep the abstract `Provider` fallback working.

## Transaction Builder Work

Transaction-builder changes need tests for the exact safety behavior being changed. Prefer explicit errors over silent correction when value movement, datum handling, redeemer indexing, or completed transaction bodies are involved.
