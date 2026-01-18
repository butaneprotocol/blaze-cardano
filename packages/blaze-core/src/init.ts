import * as Crypto from "@cardano-sdk/crypto";
export async function initCrypto() {
  await Crypto.ready();
}
