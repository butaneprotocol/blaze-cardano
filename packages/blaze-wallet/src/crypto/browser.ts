import type { WalletCryptoFunctions } from "./types";
import {
  createCborWriterFallback,
  randomBytesFallback,
  sha256Fallback,
  signEd25519Fallback,
} from "./fallbacks.js";

function isBrowserEnvironment(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function createBrowserCryptoFunctions():
  | WalletCryptoFunctions
  | undefined {
  if (!isBrowserEnvironment()) {
    return undefined;
  }

  const webCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  return {
    environment: "browser",
    createCborWriter: createCborWriterFallback,
    signEd25519: signEd25519Fallback,
    randomBytes: (length: number): Uint8Array => {
      if (webCrypto && typeof webCrypto.getRandomValues === "function") {
        const bytes = new Uint8Array(length);
        webCrypto.getRandomValues(bytes);
        return bytes;
      }
      return randomBytesFallback(length);
    },
    sha256: async (data: Uint8Array): Promise<Uint8Array> => {
      if (webCrypto?.subtle) {
        const digest = await webCrypto.subtle.digest("SHA-256", data);
        return new Uint8Array(digest);
      }
      return sha256Fallback(data);
    },
  };
}
