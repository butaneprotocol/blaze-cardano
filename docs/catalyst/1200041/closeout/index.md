# Catalyst 1200041 closeout report

Proposal 1200041 funded maintenance, security improvements, testing, assurances, documentation, and release-readiness work for the Blaze SDK.

## Delivered repository work

- Provider functionality was strengthened across Blockfrost, Maestro, Kupmios, routed providers, and emulator-backed tests.
- Provider routing now allows applications to choose separate backends for chain queries, transaction evaluation, transaction submission, and individual query operations.
- Provider debug logging records the invoked operation, target provider, parameters, status, duration, and error state so developers can inspect chain-provider behavior during integration.
- Advanced query support now includes cached and chained query reads, chain-event abstractions, Ogmios websocket chain sync, provider polling fallback, and benchmarks for cache behavior.
- Transaction-builder safety work now covers typed datum/redeemer pairing, explicit burns, explicit value movement, completed-builder reuse protection, improved errors, unit tests, property tests, and e2e-shaped transaction paths.
- Documentation was expanded for SDK onboarding, transaction building, script transactions, Aiken transaction flows, advanced querying, provider internals, script deployment, contribution workflow, security reporting, roadmap, and Cardano integration process.
- Examples were added for advanced querying, basic script deployment, Aiken script deployment, and CI script deployment.
- Live e2e coverage was added for Blockfrost-backed transactions, script deployment, Kupmios provider reads, and Maestro provider parity. Local runs can skip credentialed provider tests, while the manual full-provider evidence workflow fails if Kupmios or Maestro inputs are missing.

## Verification

The repository work is verified with these commands.

```sh
bun install --frozen-lockfile
bun syncpack lint
bun syncpack format --check
bun run prettier --check .
bun run docs:format:check
bun run lint
bun run build
bun run typecheck
bun run test
bun run test:e2e
bun --filter @blaze-cardano/query bench
bun --filter @blaze-cardano/tx test:coverage
cd docs && bun run build
```

Public package API docs are regenerated and checked for the release with this command.

```sh
bun run docs:prepare
```

## Release and operating process

The release process uses changesets for package release notes. The single Catalyst changeset prepares the public Blaze runtime packages for a `1.0.0` release. Generated changelogs are produced by the release workflow and are not edited manually. The PoA link set includes the green `Check` workflow run, generated API docs, deployed Docusaurus documentation, npm release links, and public review links for the submitted branch.

The ongoing Cardano integration process is documented at [`/cardano-integration-process`](/cardano-integration-process). It defines package boundaries, provider and emulator coverage expectations, transaction-safety checks, docs requirements, changeset usage, and public evidence expectations for future ledger and provider changes.

GitHub contribution and engagement metrics are supplied through public source links for stars, forks, watchers, issues, merged pull requests, and contributors. The broader external PoA link set includes direct published links for M1, M2, M3, M4, M5, this closeout page, npm links for `@blaze-cardano/sdk`, `@blaze-cardano/query`, and `@blaze-cardano/tx`, and the full-provider evidence run separate from the general CI link, because the provider milestone depends on live Blockfrost, Kupmios, and Maestro evidence. The supplied provider evidence URL should be a successful `e2e` workflow run titled `e2e full-provider-evidence`.

## PoA link validation

The evidence set requires a public PR opened from `feat/catalyst-41-42-complete` or that branch URL, a green `Check` workflow run, deployed documentation links, npm package release links, community engagement links, and closeout video link.
