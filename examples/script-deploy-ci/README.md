# Script deployment CI example

This example shows the shape of a deployment job that publishes reference scripts from a declarative manifest and stores the deployment cache as a CI artifact.

The job expects a funded preview wallet and provider credentials. It is intentionally separate from the main Blaze CI because script deployment spends real testnet UTxOs.

Required environment variables:

- `SEED_MNEMONIC`
- `BLOCKFROST_KEY`
- `SCRIPT_DEPLOYMENT_ADDRESS`, a funded/operator-controlled preview address where the reference-script UTxO should be created
- `SCRIPT_DEPLOYMENT_CACHE`, optional path to the cache JSON file

Run locally with:

```sh
bun install
bun run deploy
```

The command prints the reconciled deployment plan before submission, then writes an updated deployment cache to `SCRIPT_DEPLOYMENT_CACHE` or `deployment-cache.json` next to the example script.
