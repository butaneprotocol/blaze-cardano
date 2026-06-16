# Introduction

`@blaze-cardano/wallet` provides the wallet interfaces and implementations used by Blaze.

Wallets supply UTxOs, change addresses, network ids, signatures, and transaction submission. `Blaze.from(provider, wallet)` wires a wallet together with a provider so new transactions can be built with the right inputs, change address, network id, and evaluator.

Common choices:

- `HotWallet` and `HotSingleWallet` for local signing in tests, examples, and server-side tools.
- `WebWallet` for browser CIP-30 wallets.
- `ColdWallet` when code needs address and balance behavior but signing is handled elsewhere.

For an application setup flow, see the SDK [getting started guide](/sdk/guides/getting-started).
