---
title: "@blaze-cardano/core"
---

`@blaze-cardano/core` contains the Cardano data types and serialization helpers shared across Blaze packages.

Most applications use these exports through `@blaze-cardano/sdk`, but package-level imports are useful when code needs direct access to addresses, scripts, transactions, values, Plutus data, certificates, governance types, hashes, and network identifiers.

## Main APIs

- Address, credential, script, transaction, UTxO, value, metadata, and Plutus data wrappers.
- Hashing, CBOR, mnemonic, and key utilities used by wallets and transaction builders.
- Protocol parameter and governance action types used by the tx builder and emulator.

Start with the [introduction](./guides/introduction.md) and use the API reference for the full type list.
