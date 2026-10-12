---
"@blaze-cardano/core": minor
"@blaze-cardano/tx": patch
---

Upgrade `@cardano-sdk/core` to `^0.47.1`, making its Dijkstra serialization types available through Blaze's existing `Serialization` and `Cardano` exports. Upstream removes `Transaction.setIsValid`; consumers of that API must account for the change. This dependency update does not add subtransaction construction or balancing to `TxBuilder`.

Keep transaction cost-model selection compatible with the expanded upstream Plutus language enum by iterating Blaze's supported V1–V3 entries.
