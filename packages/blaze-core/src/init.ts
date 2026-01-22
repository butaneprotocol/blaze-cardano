import * as Crypto from "@cardano-sdk/crypto";
/**
 * Initialize the `@cardano-sdk/crypto` module.
 * This function must be called before calling any exported functions from `@cardano-sdk/crypto`. It is safe to call multiple times.
 * Blaze should be calling this internally before using any exports from that module. If it does not, please file a bug.
 */
export async function initCrypto() {
  await Crypto.ready();
}
