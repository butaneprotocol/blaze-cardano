---
"@blaze-cardano/tx": patch
---

Size collateral from the evaluated fee. `complete()` no longer prepares collateral on a pass that skipped script evaluation, where every redeemer still carries the per-transaction maximum budget: that placeholder fee rejected wallets able to cover the real collateral and replaced collateral passed to `provideCollateral`.
