import * as Crypto from "../vendor/cardano-js-sdk/deps/crypto.js";
/**
 * Initialize blaze-core's vendored crypto module.
 * This function must be called before calling any exported crypto functions. It is safe to call multiple times.
 * Blaze should be calling this internally before using any exports from that module. If it does not, please file a bug.
 */
export async function initCrypto() {
  await Crypto.ready();
}
