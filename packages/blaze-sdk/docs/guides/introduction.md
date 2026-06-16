# Introduction

`@blaze-cardano/sdk` is the convenience entry point for building Cardano applications with Blaze.

The SDK brings the common Blaze packages together so application code can create a provider, connect a wallet, build a transaction, sign it, and submit it without importing every lower-level package separately.

Typical flow:

1. Create a provider such as `Blockfrost`, `Maestro`, `Kupmios`, or a routed provider.
2. Create or connect a wallet.
3. Call `Blaze.from(provider, wallet)` to load protocol parameters.
4. Build a transaction with `blaze.newTransaction()`.
5. Sign and submit the completed transaction.

Continue with the [getting started guide](./getting-started.md), the tx [transaction building guide](/tx/guides/transaction-building), and the query [advanced querying guide](/query/guides/advanced-querying).
