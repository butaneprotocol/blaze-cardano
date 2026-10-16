---
"@blaze-cardano/core": major
---

Move the Cardano ledger, serialization, and cryptography implementation into
Blaze. The public `Cardano` and `Serialization` namespaces remain available,
but their runtime class identities and declaration origins are now owned by
Blaze instead of `@cardano-sdk`.
