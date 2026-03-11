import blake from "blakejs";
import { castHexBlob, HexBlob, typedHex } from "./util.js";

export const ready = async () => {};

export const BIP32_PUBLIC_KEY_HASH_LENGTH = 28;
export const ED25519_PUBLIC_KEY_LENGTH = 32;

export const Hash28ByteBase16 = (value) => typedHex(value, 56);
export const Hash32ByteBase16 = (value) => typedHex(value, 64);
Hash32ByteBase16.fromHexBlob = (value) => castHexBlob(value, 64);

export const Ed25519SignatureHex = (value) => typedHex(value, 128);
export const Bip32PublicKeyHex = (key) => typedHex(key, 128);
export const Ed25519PublicKeyHex = (value) =>
  typedHex(value, ED25519_PUBLIC_KEY_LENGTH * HexBlob.CHARS_PER_BYTE);
Ed25519PublicKeyHex.fromBip32PublicKey = (bip32PublicKey) =>
  bip32PublicKey.slice(0, ED25519_PUBLIC_KEY_LENGTH * HexBlob.CHARS_PER_BYTE);
export const Ed25519KeyHashHex = (value) => typedHex(value, 56);

const hexStringToBuffer = (value) => Buffer.from(value, "hex");
export const blake2b = {
  hash(message, outputLengthBytes) {
    return blake.blake2bHex(
      hexStringToBuffer(message),
      undefined,
      outputLengthBytes,
    );
  },
  async hashAsync(message, outputLengthBytes) {
    return blake2b.hash(message, outputLengthBytes);
  },
};
