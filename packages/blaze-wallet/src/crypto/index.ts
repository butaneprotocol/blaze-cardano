import { createBrowserCryptoFunctions } from "./browser";
import {
  createCborWriterFallback,
  randomBytesFallback,
  sha256Fallback,
  signEd25519Fallback,
} from "./fallbacks.js";
import type { WalletCryptoFunctions } from "./types";

let cachedCryptoFunctions: Promise<WalletCryptoFunctions> | undefined;

function createFallbackCryptoFunctions(): WalletCryptoFunctions {
  return {
    environment: "fallback",
    createCborWriter: createCborWriterFallback,
    signEd25519: signEd25519Fallback,
    randomBytes: randomBytesFallback,
    sha256: async (data: Uint8Array): Promise<Uint8Array> => sha256Fallback(data),
  };
}

async function resolveCryptoFunctions(): Promise<WalletCryptoFunctions> {
  const browserCrypto = createBrowserCryptoFunctions();
  if (browserCrypto) {
    return browserCrypto;
  }

  const { createNodeCryptoFunctions } = await import("./nodejs");
  const nodeCrypto = await createNodeCryptoFunctions();
  if (nodeCrypto) {
    return nodeCrypto;
  }

  return createFallbackCryptoFunctions();
}

export function getCryptoFunctions(): Promise<WalletCryptoFunctions> {
  if (!cachedCryptoFunctions) {
    cachedCryptoFunctions = resolveCryptoFunctions();
  }
  return cachedCryptoFunctions;
}

export function resetCryptoFunctionsForTesting(): void {
  cachedCryptoFunctions = undefined;
}
