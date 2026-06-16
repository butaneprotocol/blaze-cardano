---
title: "@blaze-cardano/uplc"
---

`@blaze-cardano/uplc` provides UPLC encoding, decoding, and script conversion helpers.

Use it when tooling needs to inspect compiled scripts, apply parameters, convert CBOR to script objects, or work directly with UPLC terms.

## Main APIs

- `UPLCEncoder` and `UPLCDecoder` for UPLC term serialization.
- `applyParams` and `applyParamsToScript` for parameterized validators.
- `cborToScript` for turning compiled script CBOR into Blaze script values.

Start with the [introduction](./guides/introduction.md) and the generated API reference for the full encoder and decoder surface.
