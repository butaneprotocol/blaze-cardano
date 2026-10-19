---
"@blaze-cardano/core": minor
"@blaze-cardano/tx": minor
"@blaze-cardano/wallet": minor
"@blaze-cardano/sdk": minor
---

Build and sign CIP-0118 sub-transactions.

- `TxBuilder.completeSubTransaction(imbalance?)` completes a builder as a sub-transaction: no fee and no collateral, leaving exactly `imbalance` for the rest of the batch (positive: a surplus the batch collects; negative: a deficit the batch supplies). Plutus scripts are refused: CIP-0118 forbids PlutusV1-V3 in sub-transactions, and PlutusV4 is not supported yet.
- `TxBuilder.estimateSubTransaction(surplus?)` estimates a sub-transaction without changing the builder: the deficit the wallet can't cover, the fee it adds to its top-level transaction, and its signed size.
- `TxBuilder.addRequiredTopLevelGuard(credential, data?)` sets a sub-transaction's `required_top_level_guards`.
- `Wallet.signSubTransaction` (optional; implemented by `HotWallet` and `HotSingleWallet`) and `Blaze.signSubTransaction` sign a sub-transaction.
- `@blaze-cardano/core` exports `SubTransaction` and `SubTransactionBody`.
- `TxBuilder` runs each pre-complete hook once per builder: after a failed completion, only hooks that didn't finish run again on the next call.
