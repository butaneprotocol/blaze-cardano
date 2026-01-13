---
"@blaze-cardano/emulator": patch
---

Fix unclamped Ed25519 scalar bug in emulator key generation

The emulator was generating BIP32 private keys using random bytes without proper Ed25519 scalar clamping, causing intermittent (~50%) signature verification failures. Keys are now properly clamped according to Ed25519 requirements before use.
