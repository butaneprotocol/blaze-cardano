import type { HexBlob, OpaqueString } from "./util.js";

type HexOpaque<K extends string> = OpaqueString<K> & HexBlob;

export type Hash28ByteBase16 = HexOpaque<"Hash28ByteBase16">;
export type Hash32ByteBase16 = HexOpaque<"Hash32ByteBase16">;
export type Ed25519SignatureHex = HexOpaque<"Ed25519SignatureHex">;
export type Bip32PublicKeyHex = HexOpaque<"Bip32PublicKeyHex">;
export type Bip32PrivateKeyHex = HexOpaque<"Bip32PrivateKeyHex">;
export type Bip32PublicKeyHashHex = HexOpaque<"Bip32PublicKeyHashHex">;
export type Ed25519PublicKeyHex = HexOpaque<"Ed25519PublicKeyHex">;
export type Ed25519PrivateExtendedKeyHex = HexOpaque<"Ed25519PrivateExtendedKeyHex">;
export type Ed25519PrivateNormalKeyHex = HexOpaque<"Ed25519PrivateNormalKeyHex">;
export type Ed25519KeyHashHex = HexOpaque<"Ed25519KeyHashHex">;

export const BIP32_PUBLIC_KEY_HASH_LENGTH: number;
export const ED25519_PUBLIC_KEY_LENGTH: number;
export const ED25519_PUBLIC_KEY_HASH_LENGTH: number;
export const ED25519_SIGNATURE_LENGTH: number;
export const NORMAL_ED25519_PRIVATE_KEY_LENGTH: number;
export const EXTENDED_ED25519_PRIVATE_KEY_LENGTH: number;
export const BIP32_ED25519_PRIVATE_KEY_LENGTH: number;
export const BIP32_ED25519_PUBLIC_KEY_LENGTH: number;

export const ready: () => Promise<void>;

export const Hash28ByteBase16: (value: string) => Hash28ByteBase16;
export const Hash32ByteBase16: {
  (value: string): Hash32ByteBase16;
  fromHexBlob(value: string): Hash32ByteBase16;
};
export const Ed25519SignatureHex: (value: string) => Ed25519SignatureHex;
export const Bip32PublicKeyHex: (key: string) => Bip32PublicKeyHex;
export const Bip32PrivateKeyHex: (key: string) => Bip32PrivateKeyHex;
export const Ed25519PublicKeyHex: {
  (value: string): Ed25519PublicKeyHex;
  fromBip32PublicKey(bip32PublicKey: Bip32PublicKeyHex): Ed25519PublicKeyHex;
};
export const Ed25519PrivateExtendedKeyHex: (value: string) => Ed25519PrivateExtendedKeyHex;
export const Ed25519PrivateNormalKeyHex: (value: string) => Ed25519PrivateNormalKeyHex;
export const Ed25519KeyHashHex: (value: string) => Ed25519KeyHashHex;
export const Bip32PublicKeyHashHex: (value: string) => Bip32PublicKeyHashHex;

export const blake2b: {
  hash(message: string, outputLengthBytes: number): string;
  hashAsync(message: string, outputLengthBytes: number): Promise<string>;
};

export enum Ed25519PrivateKeyType {
  Normal = "Normal",
  Extended = "Extended",
}

export class Ed25519KeyHash {
  static fromBytes(hash: Uint8Array): Ed25519KeyHash;
  static fromHex(hash: string): Ed25519KeyHash;
  bytes(): Uint8Array;
  hex(): Ed25519KeyHashHex;
}

export class Ed25519Signature {
  static fromBytes(signature: Uint8Array): Ed25519Signature;
  static fromHex(signature: string): Ed25519Signature;
  bytes(): Uint8Array;
  hex(): Ed25519SignatureHex;
}

export class Ed25519PublicKey {
  static fromBytes(keyMaterial: Uint8Array): Ed25519PublicKey;
  static fromHex(keyMaterial: string): Ed25519PublicKey;
  verify(signature: Ed25519Signature, message: string): boolean;
  hash(): Ed25519KeyHash;
  bytes(): Uint8Array;
  hex(): Ed25519PublicKeyHex;
}

export class Ed25519PrivateKey {
  static fromNormalBytes(keyMaterial: Uint8Array): Ed25519PrivateKey;
  static fromExtendedBytes(keyMaterial: Uint8Array): Ed25519PrivateKey;
  static fromNormalHex(keyMaterial: string): Ed25519PrivateKey;
  static fromExtendedHex(keyMaterial: string): Ed25519PrivateKey;
  toPublic(): Ed25519PublicKey;
  sign(message: string): Ed25519Signature;
  bytes(): Uint8Array;
  hex(): Ed25519PrivateExtendedKeyHex | Ed25519PrivateNormalKeyHex;
}

export const add28Mul8: (x: Uint8Array, y: Uint8Array) => Uint8Array;
export const add256bits: (x: Uint8Array, y: Uint8Array) => Uint8Array;

export const derivePrivate: (key: Uint8Array, index: number) => Buffer;
export const derivePublic: (key: Uint8Array, index: number) => Buffer;

export class Bip32PublicKey {
  static fromBytes(key: Uint8Array): Bip32PublicKey;
  static fromHex(key: string): Bip32PublicKey;
  toRawKey(): Ed25519PublicKey;
  derive(derivationIndices: number[]): Bip32PublicKey;
  bytes(): Uint8Array;
  hex(): Bip32PublicKeyHex;
  hash(): Bip32PublicKeyHashHex;
}

export class Bip32PrivateKey {
  static fromBip39Entropy(entropy: Uint8Array, password: string): Bip32PrivateKey;
  static fromBytes(key: Uint8Array): Bip32PrivateKey;
  static fromHex(key: string): Bip32PrivateKey;
  derive(derivationIndices: number[]): Bip32PrivateKey;
  toRawKey(): Ed25519PrivateKey;
  toPublic(): Bip32PublicKey;
  bytes(): Uint8Array;
  hex(): Bip32PrivateKeyHex;
}
