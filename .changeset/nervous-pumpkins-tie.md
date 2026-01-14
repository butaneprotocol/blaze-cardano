---
"@blaze-cardano/blueprint": patch
---

Fix blueprint code generation for generic types and maps:

- Fix generic type naming for nested module paths (e.g., `SignedPayload<ProtocolRedeemer>` → `SignedPayload_ProtocolRedeemer`)
- Preserve underscores in version names like `v0_3` when parsing generic types
- Use `Type.Number()` for map integer keys since JS objects can't have BigInt keys
- Replace `Type.Unsafe<PlutusData>` with `TPlutusData` to fix TS2742 declaration emit errors
