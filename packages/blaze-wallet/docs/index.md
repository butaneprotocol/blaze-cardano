---
title: "@blaze-cardano/wallet"
---

`@blaze-cardano/wallet` contains wallet implementations and interfaces used by Blaze applications.

Use it when an application needs to sign transactions, submit through a wallet, read wallet UTxOs, or bridge browser CIP-30 wallets into Blaze.

## Main APIs

- `Wallet` defines the shared wallet interface used by `Blaze`.
- `HotWallet` and `HotSingleWallet` provide local signing wallets for tests, tools, and server-side flows.
- `WebWallet` wraps CIP-30 browser wallets.
- `ColdWallet` supports address-only flows where signing happens elsewhere.

Start with the [introduction](./guides/introduction.md) and the SDK [getting started guide](/sdk/guides/getting-started).
