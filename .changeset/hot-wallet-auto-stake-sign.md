---
"@blaze-cardano/wallet": patch
---

Auto-detect stake key signing in HotWallet from requiredSigners

HotWallet.signTransaction() now inspects tx.body().requiredSigners() for the wallet's stake key hash and automatically signs with the stake key when present. This mirrors CIP-30 wallet behavior where all required keys are signed automatically, fixing test failures when the SDK sets the owner credential to the stake key hash.
