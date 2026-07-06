---
"@blaze-cardano/tx": minor
"@blaze-cardano/blueprint": minor
---

Add transaction-construction safety features: a `TypedScript` wrapper that binds datum and redeemer types to a script, typed `addInput` and a `lockScriptAssets` helper, explicit `mintAssets`/`burnAssets` with positive-quantity enforcement, and a `TxBuilderReuseError` when a completed builder is completed again. Blueprint codegen now generates validators as `TypedScript` subclasses with branded datum/redeemer types and `datum()`/`redeemer()` serializers.
