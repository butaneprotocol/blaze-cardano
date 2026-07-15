---
title: Script management
---

# Script management

Script deployment is only useful if the project can tell which scripts are current and which records were replaced. Blaze uses a small manifest and cache standard for that job.

## Identifiers

Blaze script deployments use three identifiers.

| Identifier | Source | Purpose |
| --- | --- | --- |
| Script identity | Script hash | Identifies the compiled validator or minting policy. |
| Deployment identity | Network, address, script hash, and version | Identifies where a particular script version is expected to be found. |
| Manifest identity | Canonical hash of the deployment manifest | Identifies the complete desired deployment state. |

The manifest hash is deterministic. Target order and metadata key order are normalized before hashing, so equivalent manifests produce the same identity.

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

## Dependency management

An application that spends from or mints with on-chain scripts depends on those scripts the same way it depends on packages: each one must exist, at a known version, before the application works. The manifest is the declaration of that dependency set. Every target pins a name, an `x.y.z` version, a script hash, and a deployment address, so the full set of scripts an application needs is reviewable in one place and hashed into one manifest identity.

Reconciliation manages those dependencies against the chain. For each target the planner checks the live reference-script UTxO and decides whether to `reuse` it, `deploy` it fresh, or `replace` a record whose script hash no longer matches. Targets removed from the manifest are retired. Because targets are pinned by hash, a dependency cannot drift silently: any change to a script produces a different hash, a `replace` action, and a `superseded` record in the audit history.

```ts
const plan = await reconcileScriptDeployment({ manifest, provider, cache });
for (const action of plan.actions) {
  console.log(action.type, "target" in action ? action.target.name : action.record.name);
}
```

## Record status

Deployment records use these statuses.

| Status | Meaning |
| --- | --- |
| `matched` | The cache record points to the active deployment for a target. |
| `superseded` | The record was replaced by another script hash. |
| `missing` | Reserved for cache/reporting integrations that record missing deployments. |
| `stale` | Reserved for cache/reporting integrations that record old or unverified deployments. |

The built-in executor writes `matched` records for successful deployments and `superseded` records for replacements. It removes retired target history when a target is removed from the manifest.

## Audit output

Use cache snapshots as deployment audit artifacts. A snapshot records the manifest hash and all deployment records, including superseded history and resolved script-reference UTxO CBOR. Cache parsing validates record shape, semantic versions, statuses, UTxO CBOR, 28-byte script hashes, and 32-byte manifest hashes before a deployment plan can use the artifact.

```ts
import { stringifyScriptDeploymentCache } from "@blaze-cardano/deploy";

const deploymentReport = stringifyScriptDeploymentCache(cache, result.manifestHash);
```

For release work, store the manifest source, cache snapshot, CI logs, and transaction IDs together. That gives reviewers enough information to connect the intended script set to the reference-script UTxOs found on chain.
