# Catalyst 1200041 milestone 1 evidence

Proposal: [Blaze: Maintenance, Security Improvements, Testing & Assurances for the Blaze SDK](https://milestones.projectcatalyst.io/projects/1200041)

Current Statement of Milestones: `soms.id=10009`, Milestone 1, "Enhance Core SDK Functionality".

## What M1 claims

The current SoM requires:

- Fully implemented and validated chain providers, at minimum Blockfrost, Maestro, and Kupmios.
- Utilities for safe and ergonomic chain interactions.
- Fine-grained provider control for query, transaction evaluation, transaction submission, and specific query functions.
- Debug logging of provider interactions, including invoked API calls and relevant params.
- Improved transaction building/submission API covering the primary Lucid and Mesh transaction-building features used by Blaze developers, including metadata handling, typed datum script flows, and typed redeemer script flows.
- Passing tests with at least 80% coverage of new features.
- Documentation, peer review from at least two senior Cardano developers, and generated changelog evidence.

## Success criteria coverage

| Success criterion                                          | Evidence                                                                                                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Blockfrost, Maestro, and Kupmios are functional and tested | Provider implementation and focused test evidence below                                                                                                                                    |
| Transaction-building API is intuitive and documented       | Lucid/Mesh-style primary transaction-building flows in `packages/blaze-tx/docs/guides/transaction-building.md`, `packages/blaze-tx/docs/guides/script-transactions.md`, generated API docs |
| New features meet the 80% coverage target                  | Focused provider-router coverage command below                                                                                                                                             |
| Documentation and changelog evidence are available         | Package docs, generated API reports, and changesets below                                                                                                                                  |
| Senior Cardano developer review evidence is public         | Merged review links are listed below                                                                                                                                                       |

## Provider evidence

Implemented providers:

- Blockfrost provider class and configuration: [`packages/blaze-query/src/blockfrost.ts`](../../../../packages/blaze-query/src/blockfrost.ts#L39-L59).
- Blockfrost transaction submission and evaluation: [`packages/blaze-query/src/blockfrost.ts`](../../../../packages/blaze-query/src/blockfrost.ts#L469-L610).
- Blockfrost PlutusV3 language support: [`packages/blaze-query/src/blockfrost.ts`](../../../../packages/blaze-query/src/blockfrost.ts#L749-L760).
- Maestro provider class: [`packages/blaze-query/src/maestro.ts`](../../../../packages/blaze-query/src/maestro.ts#L26-L45).
- Maestro protocol parameters, UTxO resolution, and CBOR-backed reference-script fallback: [`packages/blaze-query/src/maestro.ts`](../../../../packages/blaze-query/src/maestro.ts#L63-L166), [`packages/blaze-query/src/maestro.ts`](../../../../packages/blaze-query/src/maestro.ts#L278-L322).
- Maestro transaction submission and evaluation: [`packages/blaze-query/src/maestro.ts`](../../../../packages/blaze-query/src/maestro.ts#L358-L440).
- Maestro public package export: [`packages/blaze-query/src/index.ts`](../../../../packages/blaze-query/src/index.ts#L1-L10).
- Kupmios provider class and Plutus language support: [`packages/blaze-query/src/kupmios.ts`](../../../../packages/blaze-query/src/kupmios.ts#L37-L47).
- Kupmios transaction submission, script resolution, and evaluation: [`packages/blaze-query/src/kupmios.ts`](../../../../packages/blaze-query/src/kupmios.ts#L350-L416).

Provider routing and debug logging:

- `ProviderOperation`, `ProviderDebugEvent`, `ProviderDebugLogger`, and `ProviderRoutingConfig`: [`packages/blaze-query/src/provider-router.ts`](../../../../packages/blaze-query/src/provider-router.ts#L18-L81).
- `RoutedProvider` routes query, evaluation, submission, and per-operation overrides, and rejects mixed provider networks: [`packages/blaze-query/src/provider-router.ts`](../../../../packages/blaze-query/src/provider-router.ts#L87-L304).
- Public package exports: [`packages/blaze-query/src/index.ts`](../../../../packages/blaze-query/src/index.ts#L1-L10).
- Provider-routing guide: [`/query/guides/provider-routing`](/query/guides/provider-routing).

## Transaction API evidence

- Metadata handling: [`TxBuilder.setMetadata`](../../../../packages/blaze-tx/src/TxBuilder.ts#L2873-L2885).
- Typed script output locking and spending with typed datum and typed redeemer checks: [`TxBuilder.lockTypedAssets`](../../../../packages/blaze-tx/src/TxBuilder.ts#L891-L914), [`TxBuilder.addTypedInput`](../../../../packages/blaze-tx/src/TxBuilder.ts#L552-L568), plus the underlying [`TxBuilder.lockAssets`](../../../../packages/blaze-tx/src/TxBuilder.ts#L858-L889) and [`TxBuilder.addInput`](../../../../packages/blaze-tx/src/TxBuilder.ts#L443-L550) paths.
- Provider submission through the SDK is exercised in e2e shape by [`packages/e2e/tests/txs.e2e.test.ts`](../../../../packages/e2e/tests/txs.e2e.test.ts#L29-L40).
- Script vote redeemer and proposal-policy redeemer builder support appears in [`TxBuilder.setVotingProcedures`](../../../../packages/blaze-tx/src/TxBuilder.ts#L2388-L2461), [`TxBuilder.handleProposalRedeemer`](../../../../packages/blaze-tx/src/TxBuilder.ts#L2463-L2508), and [`TxBuilder.addVote`](../../../../packages/blaze-tx/src/TxBuilder.ts#L2510-L2547).

## Test and coverage evidence

Current query verification command:

```sh
bun --filter @blaze-cardano/query test
bun --filter @blaze-cardano/query typecheck
```

Result: passed. Vitest reported 8 passing test files and 50 passing tests, and typechecking completed successfully.

New feature coverage command:

```sh
(cd packages/blaze-query && bunx vitest run test/provider-router.test.ts --coverage --coverage.include=src/provider-router.ts --coverage.reporter=text-summary)
```

Result: passed. Coverage for the new provider-routing feature was:

| Metric     | Coverage |
| ---------- | -------: |
| Statements |   92.64% |
| Branches   |     100% |
| Functions  |      92% |
| Lines      |   92.64% |

Focused tests:

- Category routing for query/evaluation/submission: [`packages/blaze-query/test/provider-router.test.ts`](../../../../packages/blaze-query/test/provider-router.test.ts#L85-L115).
- Per-operation overrides, including routed script-reference lookup: [`packages/blaze-query/test/provider-router.test.ts`](../../../../packages/blaze-query/test/provider-router.test.ts#L117-L160).
- Network mismatch rejection: [`packages/blaze-query/test/provider-router.test.ts`](../../../../packages/blaze-query/test/provider-router.test.ts#L140-L166).
- Debug events around provider calls: [`packages/blaze-query/test/provider-router.test.ts`](../../../../packages/blaze-query/test/provider-router.test.ts#L165-L185).
- Blockfrost parameter, UTxO, datum, submission, evaluation, script-ref, and error-path behavior: [`packages/blaze-query/test/blockfrost.test.ts`](../../../../packages/blaze-query/test/blockfrost.test.ts#L126-L255).
- Kupmios parameter, UTxO, datum, script resolution, script-reference fallback, submission, evaluation, and error-path behavior: [`packages/blaze-query/test/kupmios.test.ts`](../../../../packages/blaze-query/test/kupmios.test.ts#L128-L278).
- Maestro parameter, UTxO, reference-script fallback, datum, submission, evaluation, and error-path behavior: [`packages/blaze-query/test/maestro.test.ts`](../../../../packages/blaze-query/test/maestro.test.ts#L133-L325).

Current transaction-builder verification commands:

```sh
bun --filter @blaze-cardano/tx test
bun --filter @blaze-cardano/tx typecheck
bun --filter @blaze-cardano/tx build
bun --filter @blaze-cardano/sdk build
```

Results: `@blaze-cardano/tx` tests passed with 9 passing test files and 55 passing tests. The tx typecheck and the tx and SDK package builds also completed successfully.

Live e2e evidence is produced by `.github/workflows/e2e.yml`. The workflow runs Blockfrost-backed transaction and script-deployment tests with the existing `SEED_MNEMONIC` and `BLOCKFROST_KEY` secrets. It also runs a Kupmios protocol-parameter e2e test when `KUPO_URL` and `OGMIOS_URL` are configured. Maestro provider parity runs when `MAESTRO_KEY` is configured, using the e2e wallet address by default or `E2E_QUERY_ADDRESS` as an override. For the final provider PoA, run the workflow manually with `full-provider-evidence=true`; that mode fails before tests if the Kupmios or Maestro evidence inputs are missing and forces the live Kupmios and provider-parity tests to run. The manual full-provider run is titled `e2e full-provider-evidence` in GitHub Actions, and the strict PoA checker rejects provider evidence links that do not point to a successful `e2e` workflow run with that title marker. The e2e tests append public-safe GitHub step-summary evidence for transaction IDs, provider parity UTxO counts, protocol-parameter values, deployment manifest hashes, script hashes, reference inputs, and reconciliation actions without printing seed phrases or provider keys.

## Documentation and changelog evidence

- Provider-routing guide added at [`/query/guides/provider-routing`](/query/guides/provider-routing).
- Transaction-building guide added at [`/tx/guides/transaction-building`](/tx/guides/transaction-building).
- Current tracked query API report is published at [`/query/api/query`](/query/api/query).
- The changeset that will generate release changelog entries for provider routing, advanced query APIs, transaction safety helpers, and declarative script deployment utilities is [`.changeset/silent-lamps-route.md`](https://github.com/butaneprotocol/blaze-cardano/blob/main/.changeset/silent-lamps-route.md).

## Peer review evidence

- PR [#259 Add plutus v3 support for blockfrost provider](https://github.com/butaneprotocol/blaze-cardano/pull/259): merged, approved by `EzePze`.
- PR [#265 Add set metadata function](https://github.com/butaneprotocol/blaze-cardano/pull/265): merged, approved by `rvcas`.
- PR [#269 More intelligent script ref fetching in blockfrost](https://github.com/butaneprotocol/blaze-cardano/pull/269): merged, approved by `rvcas`.
- PR [#326 chore: update to latest cardano-sdk](https://github.com/butaneprotocol/blaze-cardano/pull/326): merged, approved by `cjkoepke`.

## Readiness

The previously missing M1 item was explicit provider routing with debug logging. That is implemented, documented, tested above the 80% coverage target, and recorded in a changeset. Public PR and green `Check` workflow links are checked as external PoA evidence.
