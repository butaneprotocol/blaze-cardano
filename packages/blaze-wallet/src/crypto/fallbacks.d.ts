import type { CborWriter, Ed25519PrivateKey } from "@blaze-cardano/core";

export function createCborWriterFallback(): CborWriter;
export function signEd25519Fallback(
  privateKey: Ed25519PrivateKey,
  message: Uint8Array,
): Uint8Array;
export function randomBytesFallback(length: number): Uint8Array;
export function sha256Fallback(data: Uint8Array): Uint8Array;
