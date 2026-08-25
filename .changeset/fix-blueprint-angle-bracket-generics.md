---
"@blaze-cardano/blueprint": patch
---

fix(blueprint): handle angle-bracket generic titles from newer Aiken

Newer Aiken emits blueprint definition titles like `Tuple<<ByteArray,Data>>`
and `Tuple<<types/common/AssetClass,Int>>`. `Generator.normalizeTypeName` only
understood the older `Tuple$a_b` dollar format, so these fell through to the
"last path segment" branch and produced invalid TypeScript object keys (e.g.
`AssetClass,Int>>:`), making the generated module fail to parse. The base name
is now taken from everything before the first `<`, with type parameters
extracted from the schema structure when available (falling back to parsing
the title). Type parameters that are themselves generic instantiations
(`Tuple<<ByteArray,List<Int>>>`, `List<types/order/RouteStep>`) are normalized
recursively — this also applies to dollar-format definitions resolved through
the schema, which previously kept brackets from nested parameter names.
