# Catalyst 1200042 closeout report

Proposal 1200042 funded tools for handling and managing script deployments in Blaze.

## Delivered repository work

- Added `@blaze-cardano/deploy` as a first-class package for declarative script deployment.
- Re-exported the deployment package through `@blaze-cardano/sdk` so the updated SDK release includes the deployment surface.
- Added deployment manifests with stable target names, semantic versions, scripts, deployment addresses, minimum ADA settings, metadata, and dependency declarations.
- Added deterministic manifest hashing so deployment state can be compared and audited across machines and CI runs.
- Added manifest validation for duplicate targets, unknown dependencies, dependency cycles, version format, and network/address mismatch.
- Added deployment planning that reconciles the manifest with live provider state and returns `reuse`, `deploy`, `replace`, and `retire` actions.
- Added deployment execution that builds reference-script transactions, signs with the supplied wallet, submits through the provider, waits for confirmation, resolves the live reference-script UTxO, and writes verified cache records.
- Added cache serialization and parsing for release artifacts and CI cache persistence.
- Added script management helpers for version comparison, patch version increments, superseded records, and cardano-cli-compatible transaction input formatting.
- Added provider compatibility docs covering Blockfrost, Maestro, Kupmios, emulator tests, generic fallback lookup, Aiken workflows, cardano-cli transaction input formatting, and GitHub Actions deployment.
- Added basic, Aiken, and CI script-deployment examples.
- Added credential-free emulator e2e coverage plus gated live e2e coverage for script deployment, Kupmios provider reads, and provider parity, with a manual full-provider evidence mode that fails if required provider inputs are missing.

## Verification

The deploy package and related examples are verified with these commands.

```sh
bun --filter @blaze-cardano/deploy test
bun --filter @blaze-cardano/deploy coverage
bun --filter @blaze-cardano/deploy typecheck
bun --filter @blaze-cardano/deploy lint
bun --filter @blaze-cardano/deploy build
bun run build
bun run docs:format:check
bun run docs:prepare
bun --filter @blaze-cardano/e2e typecheck
bun --filter @blaze-cardano/e2e test
bun --filter script-deploy-basic typecheck
bun --filter script-deploy-basic start
bun --filter script-deploy-aiken typecheck
bun --filter script-deploy-aiken start
bun --filter script-deploy-ci typecheck
cd docs && bun run build
```

The public e2e workflow enables the live script deployment test with `BLAZE_SCRIPT_DEPLOYMENT_E2E=true` and repository secrets for the provider and wallet. Kupmios provider coverage runs when Kupo and Ogmios endpoints are configured. Provider parity runs when Maestro is configured, using the e2e wallet address by default or `E2E_QUERY_ADDRESS` as an override. For full provider evidence, run the workflow manually with `full-provider-evidence=true`; that mode fails before tests if the Kupmios or Maestro evidence inputs are missing and forces the live Kupmios and provider-parity tests to run. The manual full-provider run is titled `e2e full-provider-evidence` in GitHub Actions, and the strict PoA checker rejects provider evidence links that do not point to a successful `e2e` workflow run with that title marker. The workflow summary records configured/missing status for each provider evidence input, and the tests append public-safe proof data for submitted transaction IDs, deployment manifest hashes, target script hashes, reference inputs, record statuses, reconciliation actions, provider parity counts, and protocol-parameter values without printing secret values.

## PoA link validation

The repository supplies the integrated deployment and management system, usage docs, examples, tests, CI workflow configuration, and changeset. The public PoA link set includes a public PR opened from `feat/catalyst-41-42-complete` or that branch URL, a green `Check` workflow run, deployed docs links, npm release links, at least two public real-world application links or case studies showing the system in use, community feedback links, and closeout video link. The evidence set should include direct published links for M1, M2, M3, and this closeout page, plus npm links for both `@blaze-cardano/sdk` and `@blaze-cardano/deploy`.

## Adoption evidence

The proposal requires at least two real-world applications successfully using the system, plus community feedback and initial adoption metrics. Repository examples demonstrate the integration patterns. The public adoption evidence should include two separate real-world application or case-study links plus a separate adoption or community-feedback link.
