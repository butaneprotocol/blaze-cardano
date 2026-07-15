---
title: Provider compatibility
---

# Provider compatibility

Script deployment reconciliation depends on `Provider.resolveScriptRef`. The method accepts a script or script hash and an optional deployment address, then returns the live UTxO that carries the matching reference script.

## Compatibility matrix

| Provider | Behavior | Notes |
| --- | --- | --- |
| Blockfrost | Uses provider script-reference lookup where available and caches resolved scripts. | Good for public testnet CI because the deployment job can reuse existing Blockfrost credentials. |
| Maestro | Explicitly scans deployment-address UTxOs and compares reference-script hashes. | Useful for parity checks and applications already using Maestro for submission or evaluation. |
| Kupmios | Uses Kupo outputs and Ogmios script resolution. | Good for projects running their own infrastructure or needing websocket-backed chain state. |
| Emulator | Resolves deterministic in-memory script-reference UTxOs for tests. | Useful for local integration tests and examples that should not require credentials. |

## Address-scan helper

`Provider.resolveScriptRef` is abstract. Providers that do not have an optimized script-reference lookup can call `findScriptRefInAddressUtxos`. The helper searches UTxOs at the deployment address and compares each output script reference hash with the requested script hash.

This is slower than provider-native indexed lookup, so providers opt into it explicitly. It keeps the deployment package usable with providers that can list UTxOs at an address and expose reference scripts in those UTxOs.

## Provider selection

Deployment and application runtime do not have to use the same provider. A project can deploy with Blockfrost in CI, run integration tests with the emulator, and use Kupmios in production services. When an application needs separate backends for querying, evaluation, and submission, use `RoutedProvider` from `@blaze-cardano/query` and route deployment calls to the provider with the most reliable script-reference lookup.

The provider must still match the manifest network. Reconciliation rejects known network-name mismatches such as a `cardano-preview` manifest with a `cardano-preprod` provider. Providers with an `unknown` network name are allowed, but production deployment jobs should prefer providers that identify their Cardano network explicitly. Execution also checks the wallet network before spending so a mainnet wallet cannot fund a testnet manifest, and a testnet wallet cannot fund a mainnet manifest.

## Tool compatibility

The package works with normal Cardano development tools instead of requiring a separate deployment service.

| Tool | Integration point |
| --- | --- |
| Aiken | Compile validators, load the resulting script, and include it in a deployment manifest. |
| cardano-cli | Inspect the UTxO CBOR stored in deployment cache records and compare it with provider-visible chain state. |
| GitHub Actions | Run the deployment script with provider and wallet secrets, then persist the cache snapshot. |
| Blaze emulator | Run manifest, planning, deployment, and reuse reconciliation locally without testnet credentials. |

## Operational checks

Before accepting a deployment cache, verify that the provider can resolve each active target by script hash and deployment address. If one provider cannot resolve a freshly submitted script, retry after indexing or verify with another provider before publishing the cache as release evidence.
