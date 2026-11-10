import * as Crypto from "./internal/cardano-sdk/crypto";
/**
 * Initialize Blaze's Cardano cryptography module.
 * This function must be called before calling cryptographic functions that
 * depend on libsodium. It is safe to call multiple times.
 * Blaze should be calling this internally before using any exports from that module. If it does not, please file a bug.
 */
export async function initCrypto() {
  await Crypto.ready();
}
