# Catalyst 1200042 milestone 1 evidence

Proposal: [Blaze: Tools for Handling and Managing Script Deployments](https://milestones.projectcatalyst.io/projects/1200042)

Current Statement of Milestones: `soms.id=9826`, Milestone 1, "Implement Core Script Deployment Functionality".

## What M1 claims

The current SoM requires:

- Declarative, type-safe utilities for script deployment.
- Utility functions easing deployment of scripts to the network.
- A system to reconcile declarative goals with chain cache.
- Type-safe TypeScript implementation.
- Script deployment functions working on test networks.
- Functional and efficient chain-cache reconciliation.
- Unit tests and usage documentation.
- Code review comments from at least two senior Cardano developers.

## Success criteria coverage

| Success criterion                                      | Evidence                                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Declarative utilities are implemented and type-safe    | `defineScriptDeployment`, typed manifests, planner/action types, and package typecheck                                             |
| Deployment functions work as expected on test networks | Gated live e2e test exists and runs with the repository `SEED_MNEMONIC` and `BLOCKFROST_KEY` secrets                               |
| Chain-cache reconciliation is functional and efficient | Planner/cache implementation, unit tests, and provider `resolveScriptRef` integration                                              |
| Developed functions are unit tested                    | `packages/blaze-deploy/tests/deploy.test.ts`                                                                                       |
| Initial usage documentation is available               | Deploy guides and generated API docs                                                                                               |
| Senior Cardano developer comments are public           | Existing public PR review/comment links are listed below, with strict PoA checking for two distinct script-deployment review links |

The live Catalyst PoA review for this M1 had one approval and one rejection. The rejection did not dispute the implementation. It asked for a dedicated project folder with specific file links because the prior PoA evidence was scattered. This file gives reviewers those links in one place.

## Code evidence

- First-class deployment package: [`packages/blaze-deploy/src/index.ts`](../../../../packages/blaze-deploy/src/index.ts).
- Declarative manifest and manifest hash: [`packages/blaze-deploy/src/manifest.ts`](../../../../packages/blaze-deploy/src/manifest.ts).
- Chain/cache reconciliation planner: [`packages/blaze-deploy/src/planner.ts`](../../../../packages/blaze-deploy/src/planner.ts).
- Deployment cache serialization: [`packages/blaze-deploy/src/cache.ts`](../../../../packages/blaze-deploy/src/cache.ts).
- Deployment executor: [`packages/blaze-deploy/src/deploy.ts`](../../../../packages/blaze-deploy/src/deploy.ts).
- Type-safe deployment utility: [`TxBuilder.deployScript`](../../../../packages/blaze-tx/src/TxBuilder.ts#L916-L950) creates a reference-script UTxO, calculates minimum ADA, and respects an explicit deployment lovelace floor.
- Declarative reference-script lookup: [`Provider.resolveScriptRef`](../../../../packages/blaze-query/src/provider.ts#L141-L173) resolves a deployed script by script object or script hash.
- Efficient Blockfrost chain-cache reconciliation: [`Blockfrost.resolveScriptRef`](../../../../packages/blaze-query/src/blockfrost.ts#L691-L702) searches UTxOs by `reference_script_hash`.
- Blockfrost script cache for reference scripts: [`packages/blaze-query/src/blockfrost.ts`](../../../../packages/blaze-query/src/blockfrost.ts#L39-L59) and script resolution around [`packages/blaze-query/src/blockfrost.ts`](../../../../packages/blaze-query/src/blockfrost.ts#L642-L688).
- Script deployment is exposed through the SDK package export: [`packages/blaze-sdk/src/index.ts`](../../../../packages/blaze-sdk/src/index.ts).
- `TxBuilder.deployScript` is part of the tracked tx and SDK API reports published at [`/tx/api/tx`](/tx/api/tx) and [`/sdk/api/sdk`](/sdk/api/sdk).
- `Provider.resolveScriptRef` is part of the tracked query and SDK API reports published at [`/query/api/query`](/query/api/query) and [`/sdk/api/sdk`](/sdk/api/sdk).

## Test evidence

Current verification commands:

```sh
bun --filter @blaze-cardano/deploy test
bun --filter @blaze-cardano/deploy coverage
bun --filter @blaze-cardano/deploy typecheck
bun --filter @blaze-cardano/deploy lint
bun --filter @blaze-cardano/emulator typecheck
bun --filter @blaze-cardano/emulator test
bun --filter @blaze-cardano/e2e typecheck
bun --filter @blaze-cardano/e2e test
```

Result: deploy package passed 1 test file and 22 tests, including deployment execution, dependent deployment execution order, provider script-reference resolution, cache update, replacement history, active-version selection, version validation, provider-network validation, wallet-network validation, cache parsing validation, cache hash validation, confirmation failure handling, dependency ordering, retire behavior, and reuse reconciliation. Emulator verification also passed with 5 test files and 55 tests. E2E verification passed locally for the credential-free script deployment emulator path, while live provider tests skipped without network credentials.

Current deploy package coverage from `bun --filter @blaze-cardano/deploy coverage`:

| Scope     | Statements | Branches | Functions |  Lines |
| --------- | ---------: | -------: | --------: | -----: |
| All files |      91.1% |    85.6% |    89.85% | 92.45% |

Script deployment coverage:

- Script publication and lookup: [`packages/blaze-emulator/test/Emulator.test.ts`](../../../../packages/blaze-emulator/test/Emulator.test.ts#L75-L78).
- Reference-script deployment plus `provider.resolveScriptRef(alwaysTrueScript, address1)`: [`packages/blaze-emulator/test/Emulator.test.ts`](../../../../packages/blaze-emulator/test/Emulator.test.ts#L220-L228).
- Reference script is then used as a reference input for script spending in the same test flow: [`packages/blaze-emulator/test/Emulator.test.ts`](../../../../packages/blaze-emulator/test/Emulator.test.ts#L256-L265).
- RPC script publishing route coverage: [`packages/blaze-emulator/test/rpc/app.test.ts`](../../../../packages/blaze-emulator/test/rpc/app.test.ts#L336-L347).
- Declarative deployment execution and reuse planning: [`packages/blaze-deploy/tests/deploy.test.ts`](../../../../packages/blaze-deploy/tests/deploy.test.ts).
- Credential-free end-to-end deployment through the emulator provider: [`packages/e2e/tests/script-deployment-emulator.e2e.test.ts`](../../../../packages/e2e/tests/script-deployment-emulator.e2e.test.ts).

These tests cover deployment and chain-cache reconciliation without requiring live network credentials in local CI. The gated live e2e test in [`packages/e2e/tests/script-deployment.e2e.test.ts`](../../../../packages/e2e/tests/script-deployment.e2e.test.ts) runs from `.github/workflows/e2e.yml` when `SEED_MNEMONIC` and `BLOCKFROST_KEY` are configured, and supplies the live testnet proof for this milestone. The deployment e2e test appends a public-safe GitHub step summary with the submitted transaction IDs, deployment manifest hash, target script hash, reference input, record status, and next reconciliation actions.

## Documentation and changelog evidence

- Tracked API report for `@blaze-cardano/deploy`: [`/deploy/api/deploy`](/deploy/api/deploy).
- Tracked SDK API report showing deploy re-export, `TxBuilder.deployScript`, and `Provider.resolveScriptRef`: [`/sdk/api/sdk`](/sdk/api/sdk).
- Tracked tx and query API reports for `TxBuilder.deployScript` and `Provider.resolveScriptRef`: [`/tx/api/tx`](/tx/api/tx), [`/query/api/query`](/query/api/query).
- The changeset that will generate release changelog entries for declarative script deployment utilities, provider script-reference resolution, and related SDK integration is [`.changeset/silent-lamps-route.md`](https://github.com/butaneprotocol/blaze-cardano/blob/main/.changeset/silent-lamps-route.md).

## Peer review evidence

- PR [#193 Basic Script Deployment Utils](https://github.com/butaneprotocol/blaze-cardano/pull/193): merged and formally approved by `MicroProofs`.
- `MicroProofs` review comment: [looks good comment](https://github.com/butaneprotocol/blaze-cardano/pull/193#issuecomment-2448828906).
- `rvcas` member comment: [trusts Kasey comment](https://github.com/butaneprotocol/blaze-cardano/pull/193#issuecomment-2448858850).

Important accuracy note: GitHub currently shows one formal pull-request approval on PR #193, from `MicroProofs`. The second reviewer evidence is a PR comment from `rvcas`, not a formal approval review.

## Readiness

The implementation, tests, docs, and changelog evidence exist in the repository, with the current public review links listed above. The prior Catalyst rejection asked for structure and specific links; this file supplies them in `docs/catalyst/1200042/m1/index.md`. Public PR, CI, and review/comment URLs are supplied in the PoA evidence set before submission.
