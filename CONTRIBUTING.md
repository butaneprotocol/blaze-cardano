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

## Community

Use the GitHub issue form for bugs, feature requests, missing docs, and provider compatibility reports. For support or design discussions, join the [Blaze channel in the TxPipe Discord](https://discord.gg/eVc6HJrYmP).
