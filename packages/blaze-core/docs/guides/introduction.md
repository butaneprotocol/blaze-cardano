# Introduction

`@blaze-cardano/core` contains the shared Cardano primitives used by the rest of Blaze.

Use it directly when code needs to construct or inspect addresses, scripts, transactions, values, metadata, Plutus data, certificates, governance actions, hashes, keys, and network identifiers. Higher-level packages re-export many of these types through `@blaze-cardano/sdk`, but package-level imports keep low-level tools explicit.

Most application code follows this pattern:

1. Use core types for addresses, scripts, assets, datums, and transaction objects.
2. Use `@blaze-cardano/tx` to build transactions from those values.
3. Use `@blaze-cardano/query` and `@blaze-cardano/wallet` to read chain state and sign/submit.

The generated API reference lists the full core type surface.
