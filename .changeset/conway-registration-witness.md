---
"@blaze-cardano/emulator": patch
"@blaze-cardano/tx": patch
---

Conway stake registration (cert type 7, with deposit) requires the credential's witness, as cardano-ledger's `getScriptWitnessConwayTxCert` / `getVKeyWitnessConwayTxCert` do; only the legacy `StakeRegistration` (type 0) is exempt. The emulator now consumes the credential of a type-7 registration, so a script registration needs the script and its cert redeemer and a key registration needs the stake key's signature. `addRegisterStake` counts a key credential's witness in the fee estimate, takes a script credential without a redeemer as a native script, and rejects a redeemer on a key credential.
