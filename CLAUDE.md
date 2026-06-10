# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Blaze?

Blaze is a TypeScript library for building Cardano transactions and off-chain code for smart contracts in JavaScript. Published as `@blaze-cardano/sdk` on npm.

## Commands

```bash
bun install              # Install dependencies
bun run build            # Build all packages (turbo)
bun run dev              # Watch mode for all packages
bun run test             # Unit tests (excludes e2e)
bun run test:e2e         # E2E tests only (requires SEED_MNEMONIC, BLOCKFROST_KEY env vars)
bun run lint             # ESLint all packages
bun run typecheck        # TypeScript type checking
bun run fmt              # Prettier format
```

### Running a single package's tests

```bash
bunx turbo run test --filter=@blaze-cardano/tx
bunx turbo run test --filter=@blaze-cardano/emulator
```

### Blueprint tests (special)

Blueprint has code generation test suites that generate code before running jest:

```bash
cd packages/blaze-blueprint && bun run test:simple
cd packages/blaze-blueprint && bun run test:complex
cd packages/blaze-blueprint && bun run test:generic
```

## Architecture

### Monorepo structure

Bun workspaces + Turbo for orchestration. Build tool is `tsdown` (ESM + CJS + .d.ts). All packages publish under `@blaze-cardano/*`.

### Package dependency graph (bottom-up)

```
blaze-core          — Core types, crypto primitives, Cardano data structures
  ↑                   Uses @cardano-sdk/*, @noble/*, blakejs
blaze-data          — Plutus Data serialization using @sinclair/typebox schemas
blaze-ogmios        — Ogmios WebSocket client (standalone, only depends on ogmios schema)
  ↑
blaze-uplc          — UPLC encoding/decoding + WASM build (wasm-pack)
blaze-query         — Blockchain query providers (Blockfrost, Kupmios)
  ↑
blaze-vm            — Plutus virtual machine (core + uplc)
  ↑
blaze-tx            — Transaction builder + coin selection (core + vm)
  ↑
blaze-wallet        — Wallet types: Hot, HotSingle, Cold, Web (CIP-30)
blaze-emulator      — Local Cardano emulator for testing (core + query + tx + vm + wallet)
  ↑
blaze-sdk           — Aggregator re-exporting core, query, tx, uplc, wallet
blaze-blueprint     — CIP-57 Plutus blueprint code generator (has CLI)
```

Config packages: `blaze-tsconfig`, `blaze-eslint-config`, `blaze-jest-config`

### Key design patterns

- **Provider pattern**: `blaze-query` defines provider interfaces that abstract blockchain access. Implementations: Blockfrost, Kupmios. External: UTxORPC.
- **Wallet abstraction**: `blaze-wallet` provides multiple wallet types behind a common interface — HotWallet (full key), ColdWallet (read-only), WebWallet (CIP-30 browser).
- **Transaction builder**: `blaze-tx/TxBuilder` is the main API for constructing transactions. Chain methods like `.payLovelace()`, `.complete()`.
- **Blaze entry point**: `Blaze.from(provider, wallet)` creates a configured instance. `blaze.newTransaction()` returns a `TxBuilder`.
- **Data serialization**: `blaze-data` uses TypeBox schemas to define Plutus data types, enabling type-safe serialization/deserialization.
- **WASM**: `blaze-uplc` has a Rust WASM component built via `wasm-pack`. The `build:wasm` turbo task must run before `build` for uplc.

### Testing

- Jest with ts-jest preset
- Shared config via `@blaze-cardano/jest-config`
- Packages with tests: data, tx, uplc, emulator, wallet, query, blueprint, e2e
- E2E tests run sequentially (`--runInBand`) and need real blockchain credentials

### TypeScript config

Strict mode enabled with: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`. Target ES2020, module resolution "Bundler".

### ESLint rules

- Enforces consistent type imports/exports
- Unused variables must be prefixed with `_`
- Extends prettier for formatting

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages (e.g. `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`). Include a scope when relevant (e.g. `fix(vm):`, `chore(deps):`).

### Versioning

Uses [Changesets](https://github.com/changesets/changesets) for version management. Since the CLI is interactive, generate changeset files directly in `.changeset/` (filenames are arbitrary). Format:

```markdown
---
"@blaze-cardano/package-name": patch
---

Short description of the change
```

Use `patch` for fixes, `minor` for features, `major` for breaking changes. Multiple packages can be listed in the frontmatter.

### Dependency management

Uses [syncpack](https://syncpack.dev) to keep versions consistent. Check with `bun syncpack lint`, fix with `bun syncpack fix`.
