# Cardano integration process

Use this process when adding support for new Cardano ledger features, provider capabilities, transaction-builder behavior, wallet behavior, or script-deployment behavior.

## 1. Identify the ledger surface

Document the ledger concept, affected eras, required serialization types, relevant CIPs, and any provider-specific data needed to query, construct, evaluate, submit, or inspect transactions. If the feature changes script execution, also document the datum, redeemer, script-purpose, cost-model, and reference-input implications.

## 2. Place the feature in the right package

- Put serialization and ledger primitives in `@blaze-cardano/core`.
- Put provider reads, submission, evaluation, and event surfaces in `@blaze-cardano/query`.
- Put transaction-construction behavior in `@blaze-cardano/tx`.
- Put wallet signing or CIP-facing behavior in `@blaze-cardano/wallet`.
- Put reusable script deployment, management, and cache reconciliation behavior in `@blaze-cardano/deploy`.
- Re-export stable user-facing APIs through `@blaze-cardano/sdk`.

Avoid cross-package shortcuts that make a feature difficult to test. If a package needs a new dependency, record why the dependency belongs there instead of in the caller.

## 3. Add provider and emulator coverage

Provider work should include focused tests for request shaping, pagination, success responses, and error responses. Query behavior that is provider-specific should document the backend calls being made. Transaction behavior should have emulator-backed coverage when it affects chain state or script execution. Script deployment behavior should prove both first deployment and reuse reconciliation.

## 4. Add transaction-safety coverage

Transaction-builder changes should include tests for the failure mode they are meant to prevent. Pay particular attention to asset burns, datum placement, redeemer indexing, reference inputs, completed transaction reuse, signer requirements, metadata, and scripts whose types must stay paired with their datums and redeemers.

## 5. Add docs and examples

Public APIs need generated API docs and a guide when the feature changes how developers write application code. Provider changes should document backend requests, pagination, caching, and limitations. Transaction-builder changes should include copyable examples. Script-deployment changes should include manifest, cache, planner, and CI/CD examples when they affect release workflows.

## 6. Verify locally

Run the focused checks for touched packages before opening a PR. For broad integration changes, run the workspace checks as well.

```sh
bun run lint
bun run typecheck
bun run build
bun run test
bun run test:e2e
cd docs && bun run build
```

Package-specific API docs should be regenerated with the package `api:prepare` script when public types change.

## 7. Release through changesets

Add a succinct changeset for user-facing changes. Generated changelogs are produced by the release process and should not be edited manually. Before a release, confirm that CI is green, docs build, API reports are current, and npm package metadata points to the intended public documentation.

## 8. Record public evidence

For funded, security-sensitive, or release-critical work, keep public evidence close to the work: PR links, review links, CI links, docs URLs, release links, benchmark output, coverage output, and deployment cache snapshots where relevant. This makes the integration auditable after the code has merged.
