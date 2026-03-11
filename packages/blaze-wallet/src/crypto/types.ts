import type { CborWriter, Ed25519PrivateKey } from "@blaze-cardano/core";

export type WalletCryptoEnvironment = "browser" | "nodejs" | "fallback";

export interface WalletCryptoFunctions {
  environment: WalletCryptoEnvironment;
  createCborWriter(): CborWriter;
  signEd25519(privateKey: Ed25519PrivateKey, message: Uint8Array): Uint8Array;
  randomBytes(length: number): Uint8Array;
  sha256(data: Uint8Array): Promise<Uint8Array>;
}
