---
"@blaze-cardano/tx": patch
---

Certificate redeemers point at their certificate's position in the body. `addDelegation`, `addDeregisterStake` and the dRep certificates indexed their redeemer among certificates of the same kind sorted by credential hash, so a transaction mixing certificate kinds got colliding `Cert` indices (registering then delegating gave two `Cert#0`). `addDelegation` and `addDeregisterStake` also shifted `Reward` redeemers, moving a withdrawal's redeemer off its withdrawal.
