---
"@blaze-cardano/blueprint": patch
"@blaze-cardano/data": patch
"@blaze-cardano/core": patch
"@blaze-cardano/emulator": patch
"@blaze-cardano/tx": minor
"@blaze-cardano/uplc": minor
"@blaze-cardano/vm": minor
---

Aiken v1.1.21 blueprint compatibility (angle-bracket generics parsed
without polynomial-backtracking regex, primitive type aliases), serialize
`undefined`/`null` as `Constr 0 []` (Aiken Void),
Conway-era Registration certs with script-credential redeemers, and
`useScriptSubstitutions()` for evaluating transactions with substitute
(e.g. trace-enabled) scripts. The emulator now accepts the Conway
Registration cert (type 7), which — like the legacy Shelley form — does not
require the stake credential's witness.
