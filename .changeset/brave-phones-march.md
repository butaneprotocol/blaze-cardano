---
"@blaze-cardano/blueprint": patch
---

Fix blueprint code generation:

- Fix generic type naming by extracting type parameters from schema metadata (handles module names with underscores like `library_b`)
- Fix generic type naming for nested module paths (e.g., `SignedPayload<ProtocolRedeemer>` → `SignedPayload_ProtocolRedeemer`)
- Use `Type.Number()` for map integer keys since JS objects can't have BigInt keys
- Replace `Type.Unsafe<PlutusData>` with `TPlutusData` to fix TS2742 declaration emit errors
- Add PolicyId type to blueprint generation
