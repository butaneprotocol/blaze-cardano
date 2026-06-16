---
title: CI/CD
---

# CI/CD

Script deployment jobs should be repeatable and conservative. A CI job should build the scripts, load the manifest, verify the previous cache against live chain state, submit only required deployment transactions, and save the verified cache after the provider can resolve the resulting reference-script UTxOs.

## Pipeline Shape

A deployment job should follow this order.

1. Install dependencies with the repository lockfile.
2. Build or load the scripts.
3. Define the deployment manifest.
4. Load the previous deployment cache.
5. Reconcile the manifest against the provider.
6. Review or print the deployment plan.
7. Submit only the required deployment transactions.
8. Save the verified cache after the provider resolves the live script UTxOs.

Never trust a cache file by itself. The deployment planner treats cache records as hints and verifies live chain state before reusing a script reference.

## Example Workflow

The `examples/script-deploy-ci` directory contains a minimal GitHub Actions workflow and deployment script. The workflow keeps provider credentials and signing material in repository secrets, runs typechecking before deployment, and writes the deployment cache as an artifact.

```yaml
name: Deploy scripts

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.3.14"
      - run: bun install --frozen-lockfile
      - run: bun --filter @blaze-cardano/sdk build
      - run: bun --filter script-deploy-ci typecheck
      - run: bun --filter script-deploy-ci deploy
        env:
          BLOCKFROST_KEY: ${{ secrets.BLOCKFROST_KEY }}
          SEED_MNEMONIC: ${{ secrets.SCRIPT_DEPLOYMENT_SEED_MNEMONIC }}
          SCRIPT_DEPLOYMENT_CACHE: deployment-cache.json
      - uses: actions/upload-artifact@v4
        with:
          name: script-deployment-cache
          path: deployment-cache.json
```

Use a manual trigger for production deployments unless the project has a separate policy for automatic releases. Reference scripts are on-chain state, so deployment should be observable and easy to audit.

## Plan Review

Print the reconciled plan before submission. `reuse` actions should dominate after the first successful deployment. `deploy` and `replace` actions should be rare enough that a reviewer can inspect the target name, version, script hash, and address before the transaction is submitted.

```ts
const plan = await reconcileScriptDeployment({ manifest, provider, cache });

for (const action of plan.actions) {
  const name = action.type === "retire" ? action.record.name : action.target.name;
  console.log(`${action.type}: ${name}`);
}
```

## Secret Handling

Do not print seed phrases, private keys, provider API keys, signed transactions, or private cache paths. It is safe to print target names, versions, script hashes, deployment addresses, plan actions, transaction IDs, and manifest hashes.

## Failure Behavior

A deployment job should fail if the provider cannot resolve the script reference after confirmation. That failure means the submitted transaction and the provider-visible chain state disagree, or the provider has not indexed the script yet. Retrying after provider indexing is safer than writing an unverified cache record.

## Release Evidence

For a public release, attach these artifacts to the pull request or release notes: the manifest source, the deployment cache snapshot, the CI run URL, transaction IDs for new deployments, package version, and docs URL. These artifacts are enough for another developer to replay the intended deployment state and compare it with live chain data.
