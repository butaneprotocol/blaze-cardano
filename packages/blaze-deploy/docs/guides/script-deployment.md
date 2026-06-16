---
title: Script Deployment
---

# Script Deployment

`@blaze-cardano/deploy` turns a set of reference scripts into a repeatable deployment job. The package separates the job into three parts: a manifest that describes the desired chain state, a planner that reconciles that manifest with live chain data, and an executor that submits only the transactions still needed.

## Define a Manifest

Use `defineScriptDeployment` to describe the reference scripts an application expects to have on chain. Each target has a stable name, a semantic version, the script, the deployment address, optional minimum ADA, optional dependencies, and optional metadata.

```ts
import { defineScriptDeployment } from "@blaze-cardano/deploy";

const manifest = defineScriptDeployment({
  id: "example",
  network: "cardano-preview",
  targets: [
    {
      name: "always-true",
      version: "1.0.0",
      script: alwaysTrueScript,
      address: deploymentAddress,
      minAda: 3_000_000n,
      metadata: {
        contract: "always-true",
        environment: "preview",
      },
    },
  ],
});
```

The deployment address should normally be explicit. That keeps ownership, funding, and audit behavior clear for applications that need to prove where a script reference was published.

```ts
import { deploymentAddressFromValidator } from "@blaze-cardano/deploy";

const deploymentAddress = deploymentAddressFromValidator(NetworkId.Testnet, deploymentValidator);
```

A burn address is also available as a convenience for deployments where the reference script UTxO should not be spendable by a normal key.

```ts
import { burnDeploymentAddress } from "@blaze-cardano/deploy";

const deploymentAddress = burnDeploymentAddress(NetworkId.Testnet);
```

The manifest network must match the deployment address network, and reconciliation also checks the provider's known network name. A `cardano-preview` manifest should not be planned with a `cardano-preprod` provider, even though both networks use testnet addresses.

## Reconcile Before Submitting

Before submitting anything, reconcile the manifest against the provider and an optional cache. The cache is only a hint: a cached target is reused only when the provider can still resolve the live reference-script UTxO for the target script and address.

```ts
import { MemoryScriptDeploymentCache, reconcileScriptDeployment } from "@blaze-cardano/deploy";

const cache = new MemoryScriptDeploymentCache(previousRecords);
const plan = await reconcileScriptDeployment({ manifest, provider, cache });
```

The planner returns four action types.

| Action | Meaning |
| --- | --- |
| `reuse` | The live chain already has a matching reference script UTxO. |
| `deploy` | No live matching script was found, so a new deployment transaction is needed. |
| `replace` | The cache has a record for the target name, but the manifest points to a different script. |
| `retire` | The cache has an active record for a target that no longer appears in the manifest. |

## Deploy Script References

Use `deployScriptRefs` when the plan is ready to execute. It builds one transaction per required deployment or replacement, signs with the supplied wallet, submits through the provider, requires confirmation, and resolves the live reference-script UTxO before writing the cache record.

```ts
import { deployScriptRefs } from "@blaze-cardano/deploy";

const result = await deployScriptRefs({
  manifest,
  provider,
  wallet,
  cache,
});

console.log(result.transactions);
console.log(cache.snapshot(result.manifestHash));
```

If a submitted script cannot be resolved after confirmation, deployment fails instead of trusting the local transaction body. This prevents a stale cache from claiming that a script reference exists when the provider cannot find it.

The executor also checks the wallet network before spending. A mainnet wallet cannot execute a preview, preprod, or sanchonet manifest, and a testnet wallet cannot execute a mainnet manifest.

## Persist the Cache

Use `stringifyScriptDeploymentCache` and `parseScriptDeploymentCache` to store deployment records in CI artifacts, repository-controlled deployment metadata, or application release artifacts.

```ts
import { parseScriptDeploymentCache, stringifyScriptDeploymentCache } from "@blaze-cardano/deploy";

const text = stringifyScriptDeploymentCache(cache, result.manifestHash);
const restored = parseScriptDeploymentCache(JSON.parse(text));
```

Cache records include the target name, version, script hash, address, transaction input, status, manifest hash, and supersession pointer when a record was replaced. `parseScriptDeploymentCache` validates the cache shape, semantic versions, statuses, transaction input strings, 28-byte script hashes, and 32-byte manifest hashes before returning a cache. The cache keeps history, while `findByName` returns the highest active version for normal deployment planning.
