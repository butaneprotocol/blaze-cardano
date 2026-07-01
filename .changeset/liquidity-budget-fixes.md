---
"@blaze-cardano/blueprint": patch
"@blaze-cardano/data": patch
"@blaze-cardano/core": patch
"@blaze-cardano/tx": minor
"@blaze-cardano/uplc": minor
"@blaze-cardano/vm": minor
---

Aiken v1.1.21 blueprint compatibility (angle-bracket generics, primitive
type aliases), serialize `undefined`/`null` as `Constr 0 []` (Aiken Void),
Conway-era Registration certs with script-credential redeemers, and
`useScriptSubstitutions()` for evaluating transactions with substitute
(e.g. trace-enabled) scripts.
