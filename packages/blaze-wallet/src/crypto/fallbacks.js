import {
  CborWriter,
  HexBlob,
  fromHex,
  sha2_256,
  toHex,
} from "@blaze-cardano/core";

export function createCborWriterFallback() {
  return new CborWriter();
}

export function signEd25519Fallback(privateKey, message) {
  return privateKey.sign(HexBlob(toHex(message))).bytes();
}

export function randomBytesFallback(length) {
  const bytes = new Uint8Array(length);
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.getRandomValues === "function"
  ) {
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
  }

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return bytes;
}

export function sha256Fallback(data) {
  return fromHex(sha2_256(HexBlob(toHex(data))));
}
