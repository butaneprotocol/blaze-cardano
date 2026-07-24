# Contributing

Blaze is a TypeScript monorepo. When you change a package, run its tests and typecheck. Update the docs when you change a public API.

## Development

Install dependencies from the repository root:

```sh
bun install
```

Run focused package checks while developing:

```sh
bun --filter @blaze-cardano/query test
bun --filter @blaze-cardano/tx test
bun --filter @blaze-cardano/emulator test
```

Typecheck the packages you changed before opening a pull request:

```sh
bun --filter @blaze-cardano/query typecheck
bun --filter @blaze-cardano/tx typecheck
bun --filter @blaze-cardano/emulator typecheck
```

Run API docs preparation when a public package export, method, class, or type changes:

```sh
bun run docs:prepare
```

Build the Docusaurus site after changing package guides or generated API docs:

```sh
cd docs
bun run build
```

## Pull requests

A pull request should do one thing. Include tests for the changed behavior and update any docs or examples affected by it. Changesets generate the changelogs, so do not edit generated changelog files by hand.

## Cardano integration changes

Changes that add a Cardano feature or follow an upstream protocol update should identify the source being implemented. Link the relevant ledger specification, CIP, `cardano-node` behavior, Cardano SDK type, or provider API in the issue or pull request.

Keep the change in the package that owns the behavior. Ledger and serialization types belong in `core`; transaction construction belongs in `tx`; chain access belongs in `query`; signing belongs in `wallet`; deterministic ledger behavior belongs in `emulator`. Reuse upstream Cardano SDK types where they already describe the data instead of defining another local representation.

Cover the integration at the levels it affects:

- Add focused unit tests for conversion, serialization, validation, and failure cases.
- Add transaction or emulator tests when the change affects ledger behavior.
- Add provider behavior tests when a remote API mapping changes.
- Use the relevant network preset for network-specific behavior. Conway and experimental governance work should include the SanchoNet preset where appropriate.
- Update public API reports, guides, and executable examples when users need to change how they call Blaze.

Run the package tests, typecheck, lint, and build locally. Public API changes also require `bun run docs:prepare`, a docs build, and a Changeset. The repository CI repeats these checks, runs the non-secret and credential-backed e2e suites, and measures coverage for the transaction, emulator, and deployment packages. Dependency changes also require `bun audit --audit-level=high` before release.

## Community

Use the GitHub issue form for bugs, feature requests, missing docs, and provider compatibility reports. For support or design discussions, join the [Blaze channel in the TxPipe Discord](https://discord.gg/eVc6HJrYmP).
