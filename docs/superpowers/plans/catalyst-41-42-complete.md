# Catalyst 41 and 42 Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the local implementation, documentation, test evidence, and release evidence needed to submit complete Proof of Achievement packages for Catalyst proposals `1200041` and `1200042`.

**Architecture:** Proposal `1200041` is delivered through provider reliability, transaction-builder safety, advanced query APIs, documentation, release process, and closeout evidence. Proposal `1200042` is delivered through a focused `@blaze-cardano/deploy` package, SDK re-exports, deploy examples, provider script-reference lookup, tests, and CI/CD evidence. The Catalyst docs act as the evidence index, while package docs remain product-facing.

**Tech Stack:** Bun workspace, TypeScript, Vitest, Docusaurus, API Extractor reports, GitHub Actions, Blockfrost, Maestro, Kupmios, Ogmios, Blaze emulator.

## Current Status

The local branch implementation for proposals `1200041` and `1200042` is in reviewable shape. The repository now contains the implementation, tests, examples, package docs, Catalyst evidence docs, CI workflow changes, release package checks, and a single Catalyst changeset needed for the local side of the PoA package.

The full PoA package is not complete until the external evidence exists. Remaining external artifacts are public PR and green `Check` workflow links from this branch, deployed docs links, npm release links after merge/release, closeout videos, full live provider evidence with Maestro configured, public community contribution or engagement metric links for proposal `1200041`, two public senior Cardano developer review comments or approvals for the script-deployment work, and the real-world application/adoption links required by proposal `1200042` closeout.

Verified local gates:

- `bun --filter @blaze-cardano/deploy test`
- `bun --filter @blaze-cardano/query test`
- `bun --filter @blaze-cardano/tx test`
- `bun --filter @blaze-cardano/e2e test`
- `bun run typecheck`
- `bun run lint`
- `bun run test`
- `bun run build`
- `bun run docs:format:check`
- `bun run prettier --check .`
- `bun syncpack lint`
- `bun syncpack format --check`
- `git diff --check`
- `bun --filter @blaze-cardano/query bench`
- `bun --filter @blaze-cardano/deploy coverage`
- `bun --filter @blaze-cardano/tx test:coverage`
- `bun run docs:prepare`
- `cd docs && bun run build`
- `bun --filter script-deploy-basic typecheck`
- `bun --filter script-deploy-basic start`
- `bun --filter script-deploy-aiken typecheck`
- `bun --filter script-deploy-aiken start`
- `bun --filter script-deploy-ci typecheck`
- `bun --filter advanced-querying typecheck`
- `bun --filter advanced-querying start`
- `/tmp/blaze-actionlint/actionlint .github/workflows/*.yml examples/script-deploy-ci/.github/workflows/deploy-scripts.yml`

---

## File Map

- `.github/workflows/check.yml`: normal CI plus docs source formatting.
- `.github/workflows/docs.yml`: published documentation build.
- `.github/workflows/e2e.yml`: credential-gated provider and deployment evidence.
- `.github/workflows/release.yml`: package release verification.
- `.changeset/silent-lamps-route.md`: single release changeset for the Catalyst package updates.
- `package.json`: root verification scripts and docs formatting checks.
- `docs/docusaurus.config.ts`: package docs, deploy docs, and Catalyst evidence docs registration.
- `docs/sidebars/root.sidebar.ts`: root docs navigation.
- `docs/sidebars/deploy.sidebar.mjs`: deploy package docs navigation.
- `docs/sidebars/catalyst.sidebar.mjs`: Catalyst evidence docs navigation.
- `docs/catalyst/1200041/*/index.md`: proposal `1200041` milestone and closeout evidence.
- `docs/catalyst/1200042/*/index.md`: proposal `1200042` milestone and closeout evidence.
- `docs/src/roadmap.md`: public roadmap evidence.
- `docs/src/cardano-integration-process.md`: Cardano integration and CI/CD process evidence.
- `packages/blaze-query/src/*`: provider router, cache, events, query client, Ogmios chain sync, polling fallback, and provider script-reference resolution.
- `packages/blaze-query/test/*`: provider router, cache, query client, and event tests.
- `packages/blaze-query/benchmarks/*`: query-cache performance baseline.
- `packages/blaze-tx/src/*`: transaction builder deploy hook, typed script helpers, safety errors, builder reuse protections.
- `packages/blaze-tx/tests/tx/*`: transaction builder unit, type-level, and property-style safety tests.
- `packages/blaze-sdk/src/index.ts`: public SDK re-exports for query, tx, and deploy surfaces.
- `packages/blaze-deploy/*`: script deployment package implementation, docs, tests, API report, and package config.
- `examples/advanced-querying/*`: advanced query API example.
- `examples/script-deploy-basic/*`: minimal deploy utility example.
- `examples/script-deploy-aiken/*`: Aiken script deployment example.
- `examples/script-deploy-ci/*`: CI/CD deployment example with plan review and cache artifact handling.
- `packages/e2e/tests/*`: provider, query, and script-deployment integration evidence, including GitHub step-summary proof rows for public PoA runs.

---

## Task 1: Branch And Hygiene

**Files:**

- Verify: repository state only.

- [x] Confirm the active branch is `feat/catalyst-41-42-complete`.

Run:

```sh
git branch --show-current
```

Expected: `feat/catalyst-41-42-complete`.

- [x] Confirm there are no staged files before user review.

Run:

```sh
git diff --cached --stat
```

Expected: empty output.

- [x] Keep changelogs generated. Do not hand-edit generated changelog output.

Acceptance: only the intended changeset file is edited directly.

---

## Task 2: Proposal 1200041 M1 Provider And Transaction Builder Surface

**Files:**

- Modify: `packages/blaze-query/src/provider-router.ts`
- Modify: `packages/blaze-query/src/blockfrost.ts`
- Modify: `packages/blaze-query/src/kupmios.ts`
- Modify: `packages/blaze-query/src/maestro.ts`
- Modify: `packages/blaze-query/src/provider.ts`
- Modify: `packages/blaze-query/src/index.ts`
- Modify: `packages/blaze-sdk/src/index.ts`
- Modify: `packages/blaze-tx/src/TxBuilder.ts`
- Modify: `packages/blaze-tx/src/index.ts`
- Modify: `packages/blaze-tx/docs/guides/transaction-building.md`
- Modify: `packages/blaze-query/docs/guides/provider-routing.md`
- Test: `packages/blaze-query/test/provider-router.test.ts`
- Test: `packages/blaze-tx/tests/tx/tx.test.ts`

- [x] Ensure Blockfrost, Maestro, and Kupmios are all available as validated provider paths.

Run:

```sh
bun --filter @blaze-cardano/query test
```

Expected: provider tests pass, including router success, fallback, debug logging, and direct fast-path coverage.

- [x] Ensure provider routing keeps the direct fast path for single-provider calls and logs routed/fallback calls through `call`.

Acceptance: direct provider usage is not forced through routing overhead, while routed calls produce useful debug events.

- [x] Ensure transaction-builder docs cover metadata, explicit script-address locking, typed datums, typed redeemers, burn-address convenience, asset ID format, and submission flow.

Run:

```sh
bun run docs:format:check
```

Expected: source docs formatting passes.

- [x] Ensure generated API reports include the public query, tx, and SDK surfaces.

Run:

```sh
bun run typecheck
```

Expected: all workspace packages typecheck.

---

## Task 3: Proposal 1200041 M2 Advanced Querying And Performance

**Files:**

- Create: `packages/blaze-query/src/cache.ts`
- Create: `packages/blaze-query/src/query-client.ts`
- Create: `packages/blaze-query/src/events.ts`
- Create: `packages/blaze-query/src/ogmios-chain-sync.ts`
- Create: `packages/blaze-query/src/polling-events.ts`
- Create: `packages/blaze-query/benchmarks/*`
- Create: `packages/blaze-query/docs/guides/advanced-querying.md`
- Create: `packages/blaze-query/docs/guides/provider-internals.md`
- Create: `examples/advanced-querying/*`
- Test: `packages/blaze-query/test/query-cache.test.ts`
- Test: `packages/blaze-query/test/query-client.test.ts`
- Test: `packages/blaze-query/test/events.test.ts`
- Test: `packages/blaze-query/test/ogmios-chain-sync.test.ts`

- [x] Implement and validate cache keying, cache reads, cache writes, and query-client provider composition.

Run:

```sh
bun --filter @blaze-cardano/query test
```

Expected: query cache, query client, events, chain sync, and provider router tests pass.

- [x] Implement websocket-style chain events through Ogmios chain sync plus polling fallback behavior.

Acceptance: consumers can subscribe to block events through the new event layer without writing provider-specific code.

- [x] Keep performance baseline executable and documented.

Run:

```sh
bun --filter @blaze-cardano/query bench
```

Expected: cache key, cache hit, and cache set benchmarks meet configured minimums.

- [x] Keep the advanced-querying example type-safe and runnable.

Run:

```sh
bun --filter advanced-querying typecheck
bun --filter advanced-querying start
```

Expected: the example prints successful cache/query behavior.

---

## Task 4: Proposal 1200041 M3 Transaction Safety

**Files:**

- Create: `packages/blaze-tx/src/errors.ts`
- Create: `packages/blaze-tx/src/safety.ts`
- Create: `packages/blaze-tx/src/typed-script.ts`
- Create: `packages/blaze-tx/docs/guides/safety.md`
- Create: `packages/blaze-tx/docs/guides/script-transactions.md`
- Test: `packages/blaze-tx/tests/tx/safety.test.ts`
- Test: `packages/blaze-tx/tests/tx/typed-script-types.test.ts`
- Test: `packages/blaze-tx/tests/tx/property.test.ts`
- Modify: `packages/blaze-tx/src/TxBuilder.ts`

- [x] Add explicit typed script helpers for datums, redeemers, typed inputs, typed locking, burns, transfers, and minting.

Run:

```sh
bun --filter @blaze-cardano/tx test
```

Expected: transaction builder tests pass, including typed script and safety checks.

- [x] Enforce builder reuse protection and clearer transaction-construction errors.

Acceptance: repeated use of consumed builder state fails with a clear Blaze error instead of producing ambiguous behavior.

- [x] Keep the type-level tests as part of normal package verification.

Run:

```sh
bun --filter @blaze-cardano/tx typecheck
```

Expected: type-only tests compile where valid and reject mismatched typed datum/redeemer flows.

---

## Task 5: Proposal 1200041 M4 Documentation, Onboarding, And Community Process

**Files:**

- Create: `packages/blaze-sdk/docs/guides/getting-started.md`
- Create: `packages/blaze-sdk/docs/guides/aiken-transaction.md`
- Modify: `packages/*/docs/index.md`
- Modify: `packages/*/docs/guides/introduction.md`
- Create: `docs/src/roadmap.md`
- Create: `docs/src/cardano-integration-process.md`
- Modify: `CONTRIBUTING.md`
- Create: `.github/ISSUE_TEMPLATE/*`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `SECURITY.md`

- [x] Ensure SDK onboarding explains provider setup, wallet setup, transaction building, script locking, Aiken scripts, and submission.

Run:

```sh
cd docs && bun run build
```

Expected: Docusaurus build succeeds with SDK and package docs.

- [x] Ensure provider implementation docs describe Blockfrost, Maestro, Kupmios, provider routing, provider internals, and advanced query behavior.

Acceptance: a reviewer can inspect the docs site and understand where each provider fits.

- [x] Ensure public contribution, security, issue, PR, roadmap, and Cardano integration docs exist.

Acceptance: proposal closeout evidence can link directly to public repo pages and published docs pages.

---

## Task 6: Proposal 1200041 M5 Release And Closeout Evidence

**Files:**

- Modify: `.changeset/silent-lamps-route.md`
- Modify: `.github/workflows/release.yml`
- Modify: `package.json`
- Create: `docs/catalyst/1200041/m5/index.md`
- Create: `docs/catalyst/1200041/closeout/index.md`

- [x] Keep the release changeset succinct and scoped to packages affected by the Catalyst work.

Run:

```sh
bun syncpack lint
bun syncpack format --check
```

Expected: package graph checks pass.

- [x] Verify release docs and closeout docs point to package APIs, guides, CI, release workflow, roadmap, and integration process.

Run:

```sh
bun run docs:format:check
cd docs && bun run build
```

Expected: Catalyst evidence docs are included in the docs build.

- [ ] After merge, publish the npm release and attach release, CI, and docs links to the Catalyst PoA.

Acceptance: the PoA submission has public links to npm, changelog/release notes, merged PR, CI run, docs, and closeout video.

---

## Task 7: Proposal 1200042 M1 Script Deployment Utilities

**Files:**

- Create: `packages/blaze-deploy/src/manifest.ts`
- Create: `packages/blaze-deploy/src/cache.ts`
- Create: `packages/blaze-deploy/src/planner.ts`
- Create: `packages/blaze-deploy/src/deploy.ts`
- Create: `packages/blaze-deploy/src/address.ts`
- Create: `packages/blaze-deploy/src/errors.ts`
- Create: `packages/blaze-deploy/src/types.ts`
- Create: `packages/blaze-deploy/src/index.ts`
- Create: `packages/blaze-deploy/test/*`
- Modify: `packages/blaze-sdk/src/index.ts`
- Modify: `packages/blaze-tx/src/TxBuilder.ts`
- Modify: `packages/blaze-query/src/provider.ts`
- Modify: `packages/blaze-query/src/blockfrost.ts`

- [x] Implement declarative manifests, type-safe deployment targets, cache parsing, manifest hashing, dependency ordering, reconciliation, deployment, replacement, retirement, and burn-address helpers.

Run:

```sh
bun --filter @blaze-cardano/deploy test
```

Expected: deploy package tests pass.

- [x] Ensure `TxBuilder.deployScript` locks reference scripts at explicit addresses and supports the burn-address convenience path.

Run:

```sh
bun --filter @blaze-cardano/tx test
```

Expected: transaction builder tests pass with script deployment coverage.

- [x] Ensure providers can resolve script-reference UTxOs, with optimized Blockfrost lookup and shared provider interface.

Run:

```sh
bun --filter @blaze-cardano/query test
```

Expected: provider interface and Blockfrost tests pass.

---

## Task 8: Proposal 1200042 M2 Script Management Standards And CI/CD

**Files:**

- Create: `packages/blaze-deploy/src/manage.ts`
- Create: `packages/blaze-deploy/src/compat.ts`
- Create: `packages/blaze-deploy/docs/guides/ci-cd.md`
- Create: `packages/blaze-deploy/docs/guides/script-management.md`
- Create: `packages/blaze-deploy/docs/guides/provider-compatibility.md`
- Create: `examples/script-deploy-ci/*`

- [x] Implement version validation, active-version selection, compatibility checks, replacement records, dependency checks, and cache round-tripping.

Run:

```sh
bun --filter @blaze-cardano/deploy test
```

Expected: versioning, replacement, dependency, cache, compatibility, and planner tests pass.

- [x] Keep the CI/CD example credential-safe and reviewable.

Run:

```sh
bun --filter script-deploy-ci typecheck
/tmp/blaze-actionlint/actionlint .github/workflows/*.yml examples/script-deploy-ci/.github/workflows/deploy-scripts.yml
```

Expected: example typecheck and workflow lint pass.

- [x] Ensure the CI deploy script prints the reconciled plan before submission and writes the verified cache afterward.

Acceptance: the script exposes target names and action types without printing seed phrases, provider keys, private keys, signed transactions, or private cache paths.

---

## Task 9: Proposal 1200042 M3 Integrated Deploy Demos And Closeout

**Files:**

- Create: `examples/script-deploy-basic/*`
- Create: `examples/script-deploy-aiken/*`
- Create: `packages/e2e/tests/script-deployment-emulator.e2e.test.ts`
- Create: `packages/e2e/tests/script-deployment.e2e.test.ts`
- Create: `packages/e2e/tests/provider-parity.e2e.test.ts`
- Create: `docs/catalyst/1200042/m3/index.md`
- Create: `docs/catalyst/1200042/closeout/index.md`

- [x] Keep the basic deployment example runnable without network credentials.

Run:

```sh
bun --filter script-deploy-basic typecheck
bun --filter script-deploy-basic start
```

Expected: the example deploys on the emulator and prints transaction, cache, and reuse-plan evidence.

- [x] Keep the Aiken deployment example runnable without network credentials.

Run:

```sh
bun --filter script-deploy-aiken typecheck
bun --filter script-deploy-aiken start
```

Expected: the example builds Aiken artifacts and deploys on the emulator.

- [x] Keep credential-free deployment e2e evidence available in normal local test runs.

Run:

```sh
bun --filter @blaze-cardano/e2e test packages/e2e/tests/script-deployment-emulator.e2e.test.ts
```

Expected: emulator deployment e2e test passes without provider credentials.

- [ ] After merge and release, add public CI, npm, docs, demo, and closeout video links to the PoA submission.

Acceptance: the Catalyst submission has enough public evidence for another reviewer to reproduce the package, docs, examples, and deployment behavior.

---

## Task 10: Catalyst Evidence Documents

**Files:**

- Create: `docs/catalyst/index.md`
- Create: `docs/catalyst/1200041/m1/index.md`
- Create: `docs/catalyst/1200041/m2/index.md`
- Create: `docs/catalyst/1200041/m3/index.md`
- Create: `docs/catalyst/1200041/m4/index.md`
- Create: `docs/catalyst/1200041/m5/index.md`
- Create: `docs/catalyst/1200041/closeout/index.md`
- Create: `docs/catalyst/1200042/m1/index.md`
- Create: `docs/catalyst/1200042/m2/index.md`
- Create: `docs/catalyst/1200042/m3/index.md`
- Create: `docs/catalyst/1200042/closeout/index.md`

- [x] Keep each milestone document focused on the exact milestone acceptance criteria and the evidence links needed for the PoA.

Run:

```sh
bun run docs:format:check
cd docs && bun run build
```

Expected: Catalyst docs format and build cleanly.

- [x] Keep external-only artifacts described as submission links, not repo-local claims.

Acceptance: public review links, public CI links after push, deployed docs URLs, npm release URLs, and closeout video URLs are supplied through the Catalyst submission once they exist.

- [x] Keep proposal `1200041` peer review evidence separate from proposal `1200042` peer review evidence.

Acceptance: `1200041` uses existing public Cardano developer approvals where available; `1200042` uses the required public comments or approvals specific to script deployment.

---

## Task 11: Final Verification Gate

**Files:**

- Verify: full repository.

- [x] Run repository formatting and package consistency checks.

Run:

```sh
bun run prettier --check .
bun syncpack lint
bun syncpack format --check
git diff --check
```

Expected: all checks pass.

- [x] Run full lint, typecheck, tests, release checks, docs build, and examples.

Run:

```sh
bun run lint
bun run typecheck
bun run test
bun --filter @blaze-cardano/e2e test
bun run docs:prepare
cd docs && bun run build
bun --filter @blaze-cardano/query bench
bun --filter script-deploy-basic typecheck
bun --filter script-deploy-basic start
bun --filter script-deploy-aiken typecheck
bun --filter script-deploy-aiken start
bun --filter script-deploy-ci typecheck
bun --filter advanced-querying typecheck
bun --filter advanced-querying start
```

Expected: local suite passes, with provider-live e2e tests skipped only when credentials are absent.

- [x] Run workflow linting.

Run:

```sh
/tmp/blaze-actionlint/actionlint .github/workflows/*.yml examples/script-deploy-ci/.github/workflows/deploy-scripts.yml
```

Expected: workflow lint passes.

- [x] Run secret and artifact hygiene scans.

Run:

```sh
git ls-files --others --exclude-standard
rg -n "TO""DO|FIX""ME|TB""D|coming ""soon" docs/catalyst packages/blaze-deploy examples packages/blaze-query packages/blaze-tx packages/e2e scripts
rg -n "(^|[^A-Za-z0-9_])sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|SEED_MNEMONIC=[a-z]+( [a-z]+)+" . --glob '!docs/superpowers/plans/catalyst-41-42-complete.md'
```

Expected: no generated build artifacts are untracked, no new draft-marker text appears in submission-critical files, and no secrets are present.

---

## Submission Plan

### Proposal 1200041

Submit PoA after the branch is merged, CI is public and green, docs are deployed, and release artifacts exist. Include:

- Merged PR link.
- Green CI run link.
- Published docs links for provider routing, provider internals, advanced querying, transaction building, script transactions, safety, SDK getting started, Aiken transaction guide, roadmap, and Cardano integration process.
- npm release link for the SDK and affected packages.
- Public peer review links from senior Cardano developers.
- Public community contribution or engagement metric links for the documentation/onboarding milestone.
- Catalyst milestone evidence page links for M1, M2, M3, M4, M5, and closeout.
- Closeout report and closeout video links.

### Proposal 1200042

Submit PoA after the branch is merged, CI is public and green, docs are deployed, release artifacts exist, and script-deployment review evidence is public. Include:

- Merged PR link.
- Green CI run link.
- Published deploy package docs for manifest, cache, reconciliation, versioning, dependencies, CI/CD, and examples.
- npm release link for `@blaze-cardano/deploy` and the SDK release that re-exports it.
- Script deployment example links for basic, Aiken, and CI/CD flows.
- Public testnet transaction IDs or public CI evidence for the live deployment path when provider credentials are available.
- Two public senior Cardano developer comments or approvals for the deployment package and docs.
- Catalyst milestone evidence page links for M1, M2, M3, and closeout.
- Closeout report and closeout video links.

---

## Current External Blockers

- Full-provider e2e evidence requires `SEED_MNEMONIC`, `BLOCKFROST_KEY`, `KUPO_URL`, `OGMIOS_URL`, and `MAESTRO_KEY`. The current GitHub secret check finds the first four configured and `MAESTRO_KEY` missing, so live provider parity evidence cannot cover Maestro until it is added.
- Public implementation evidence requires this branch to be pushed or opened as a PR from `feat/catalyst-41-42-complete`.
- Public CI links require the `Check` workflow to pass for the submitted branch or PR.
- Published docs links require docs deployment after merge or a public preview deployment.
- npm release links require the release workflow to run after merge.
- Closeout videos must be recorded and published.
- Proposal `1200041` still needs public community contribution or engagement metric links for the documentation and onboarding evidence.
- Proposal `1200042` still needs two public senior Cardano developer review comments or approvals specific to the script deployment work.
- Proposal `1200042` closeout still needs at least two public real-world application links or case studies, plus community feedback or initial adoption metrics.
