import type { WalletCryptoFunctions } from "./types";
import {
  createCborWriterFallback,
  randomBytesFallback,
  sha256Fallback,
  signEd25519Fallback,
} from "./fallbacks.js";

function isNodeEnvironment(): boolean {
  return typeof process !== "undefined" && !!process.versions?.node;
}

async function tryLoadNodeCrypto():
  | typeof import("node:crypto")
  | undefined {
  try {
    return await import("node:crypto");
  } catch {
    return undefined;
  }
}

export async function createNodeCryptoFunctions():
  Promise<WalletCryptoFunctions | undefined> {
  if (!isNodeEnvironment()) {
    return undefined;
  }

  const nodeCrypto = await tryLoadNodeCrypto();

  return {
    environment: "nodejs",
    createCborWriter: createCborWriterFallback,
    signEd25519: signEd25519Fallback,
    randomBytes: (length: number): Uint8Array => {
      if (nodeCrypto) {
        return new Uint8Array(nodeCrypto.randomBytes(length));
      }
      return randomBytesFallback(length);
    },
    sha256: async (data: Uint8Array): Promise<Uint8Array> => {
      if (nodeCrypto) {
        const hash = nodeCrypto.createHash("sha256");
        hash.update(data);
        return new Uint8Array(hash.digest());
      }
      return sha256Fallback(data);
    },
  };
}
