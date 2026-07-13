---
"@blaze-cardano/blueprint": patch
---

Fix blueprint generation for aiken's angle-bracket generic type names. Newer aiken encodes generics as `Tuple<<A,B>>` (built-in Tuple) and `module/MyPair<A,B>` (user generics). The generator previously understood only the older `$` encoding and emitted invalid TypeScript identifiers, so the generated blueprint no longer compiled. It now parses both bracket forms (base name and the last path segment of each type parameter, depth-aware for nesting), guards reserved-word and empty identifiers, and fails loud on a normalized-name collision instead of silently aliasing two distinct types.
