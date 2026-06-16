# Blaze roadmap

This roadmap tracks the public engineering direction for the Blaze SDK. It is meant to be paired with GitHub issues and pull requests: roadmap items describe the direction, while issues track the concrete work.

## SDK core

- Keep provider behavior consistent across Blockfrost, Maestro, Kupmios, routed providers, and emulator-backed tests.
- Keep provider routing explicit so applications can choose different backends for querying, transaction evaluation, transaction submission, and specific query operations.
- Keep debug logging available for provider interactions without logging secrets, API keys, private wallet data, signed transactions, or personally identifying data.
- Keep API docs generated from package sources and reviewed as part of release work.

## Querying

- Maintain `QueryClient` as the ergonomic entry point for cached and chained reads.
- Keep websocket event support centered on Kupmios/Ogmios and polling support available for providers that do not expose websocket chain sync.
- Track provider-specific pagination, error messages, request shapes, script-reference behavior, and limitations in provider docs.
- Keep query benchmarks small, reproducible, and checked before public release claims about performance.

## Transaction construction

- Keep transaction-builder safety focused on explicit value movement, typed script datum/redeemer pairing, completed-builder reuse protection, and actionable error messages.
- Keep unit, property-based, and e2e-shaped coverage around transaction-construction failure modes.
- Prefer explicit APIs over silent correction when an operation can burn assets, move value, attach datums, select redeemers, or submit a transaction.

## Script deployment

- Maintain `@blaze-cardano/deploy` as the declarative package for script deployment manifests, deployment planning, cache reconciliation, deployment execution, and script management.
- Keep deployment flows testable in the emulator before live testnet use.
- Publish provider compatibility notes for Blockfrost, Maestro, Kupmios, and emulator workflows.
- Keep deployment cache snapshots auditable by including target names, semantic versions, script hashes, deployment addresses, transaction inputs, statuses, manifest hashes, and supersession history.

## Documentation and onboarding

- Keep guides for transaction building, script transactions, Aiken transaction flows, advanced querying, provider internals, and script deployment current with public APIs.
- Keep examples runnable with local emulator providers where possible so new users can learn without provider credentials.
- Keep contribution, security, issue template, and PR template docs aligned with the repository workflow.

## Releases

- Use changesets for package release notes and do not edit generated changelogs by hand.
- Keep generated API docs and package builds green before release.
- Treat `1.0.0` readiness as a repo-wide standard: stable public APIs, passing CI, current docs, clear migration notes for breaking changes, and public release evidence.
- Publish npm release links, CI run links, docs deployment links, and relevant deployment evidence with each major release.
