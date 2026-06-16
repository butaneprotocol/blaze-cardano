---
title: Script Management
---

# Script Management

Script deployment is only useful if the project can tell which scripts are current, which records were replaced, and which dependencies must be deployed first. Blaze uses a small manifest and cache standard for that job.

## Identifiers

Blaze script deployments use three identifiers.

| Identifier | Source | Purpose |
| --- | --- | --- |
| Script identity | Script hash | Identifies the compiled validator or minting policy. |
| Deployment identity | Network, address, script hash, and version | Identifies where a particular script version is expected to be found. |
| Manifest identity | Canonical hash of the deployment manifest | Identifies the complete desired deployment state. |

The manifest hash is deterministic. Target order, dependency order, and metadata key order are normalized before hashing, so equivalent manifests produce the same identity.

## Versions

Deployment versions use `x.y.z` format. `defineScriptDeployment` rejects other version strings before planning or transaction construction begins.

```ts
import { compareDeploymentVersions, nextPatchVersion } from "@blaze-cardano/deploy";

const nextVersion = nextPatchVersion("1.2.3"); // "1.2.4"
const order = compareDeploymentVersions("1.2.4", "1.2.3"); // 1
```

Changing a script should create a new version. When `deployScriptRefs` handles a `replace` action, the previous record is stored as `superseded` and the new record becomes the active `matched` record. The cache keeps both records for audit output.

```ts
const active = cache.findByName("order-validator");
const history = cache.records().filter((record) => record.name === "order-validator");
```

If more than one non-superseded record exists for the same target name, `findByName` returns the highest active semantic version. This lets a deployment job keep historical records without accidentally planning from an older active version.

## Dependencies

Dependencies are declared by target name. The deployment planner sorts targets so dependencies are planned before scripts that depend on them.

```ts
const manifest = defineScriptDeployment({
  id: "dex",
  network: "cardano-preview",
  targets: [
    {
      name: "order-validator",
      version: "1.0.0",
      script: orderValidator,
      address: orderAddress,
    },
    {
      name: "settlement-policy",
      version: "1.0.0",
      script: settlementPolicy,
      address: policyAddress,
      dependencies: ["order-validator"],
    },
  ],
});
```

Unknown dependencies and dependency cycles are rejected during manifest validation. That keeps CI failures early and avoids submitting a partial deployment whose dependent script was never published.

## Record Status

Deployment records use these statuses.

| Status | Meaning |
| --- | --- |
| `matched` | The cache record points to the active deployment for a target. |
| `superseded` | The record was replaced by another script hash. |
| `missing` | Reserved for cache/reporting integrations that record missing deployments. |
| `stale` | Reserved for cache/reporting integrations that record old or unverified deployments. |

The built-in executor writes `matched` records for successful deployments and `superseded` records for replacements. It removes retired target history when a target is removed from the manifest.

## Audit Output

Use cache snapshots as deployment audit artifacts. A snapshot records the manifest hash and all deployment records, including superseded history. Cache parsing validates record shape, semantic versions, statuses, transaction input strings, 28-byte script hashes, and 32-byte manifest hashes so malformed CI artifacts fail before they can influence a deployment plan.

```ts
import { stringifyScriptDeploymentCache } from "@blaze-cardano/deploy";

const deploymentReport = stringifyScriptDeploymentCache(cache, result.manifestHash);
```

For release work, store the manifest source, cache snapshot, CI logs, and transaction IDs together. That gives reviewers enough information to connect the intended script set to the reference-script UTxOs found on chain.
