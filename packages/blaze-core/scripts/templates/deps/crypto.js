import blake from "blakejs";
import sodium from "libsodium-wrappers-sumo";
import { pbkdf2Sync } from "pbkdf2";
import {
  castHexBlob,
  HexBlob,
  typedHex,
  InvalidArgumentError,
} from "./util.js";

export const ready = async () => {
  await sodium.ready;
};

export const BIP32_PUBLIC_KEY_HASH_LENGTH = 28;
export const ED25519_PUBLIC_KEY_LENGTH = 32;

export const Hash28ByteBase16 = (value) => typedHex(value, 56);
export const Hash32ByteBase16 = (value) => typedHex(value, 64);
Hash32ByteBase16.fromHexBlob = (value) => castHexBlob(value, 64);

export const Ed25519SignatureHex = (value) => typedHex(value, 128);
export const Bip32PublicKeyHex = (key) => typedHex(key, 128);
export const Bip32PrivateKeyHex = (key) => typedHex(key, 192);
export const Ed25519PublicKeyHex = (value) =>
  typedHex(value, ED25519_PUBLIC_KEY_LENGTH * HexBlob.CHARS_PER_BYTE);
Ed25519PublicKeyHex.fromBip32PublicKey = (bip32PublicKey) =>
  bip32PublicKey.slice(0, ED25519_PUBLIC_KEY_LENGTH * HexBlob.CHARS_PER_BYTE);
export const Ed25519PrivateExtendedKeyHex = (value) => typedHex(value, 128);
export const Ed25519PrivateNormalKeyHex = (value) => typedHex(value, 64);
export const Ed25519KeyHashHex = (value) => typedHex(value, 56);
export const Bip32PublicKeyHashHex = (value) =>
  typedHex(value, BIP32_PUBLIC_KEY_HASH_LENGTH * HexBlob.CHARS_PER_BYTE);

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

export const ED25519_PUBLIC_KEY_HASH_LENGTH = 28;

export class Ed25519KeyHash {
  constructor(hash) {
    this.__hash = hash;
  }

  static fromBytes(hash) {
    if (hash.length !== ED25519_PUBLIC_KEY_HASH_LENGTH) {
      throw new InvalidArgumentError(
        "hash",
        `Hash should be ${ED25519_PUBLIC_KEY_HASH_LENGTH} bytes; however ${hash.length} bytes were provided.`,
      );
    }
    return new Ed25519KeyHash(hash);
  }

  static fromHex(hash) {
    return Ed25519KeyHash.fromBytes(Buffer.from(hash, "hex"));
  }

  bytes() {
    return this.__hash;
  }

  hex() {
    return Ed25519KeyHashHex(Buffer.from(this.__hash).toString("hex"));
  }
}

export const ED25519_SIGNATURE_LENGTH = 64;

export class Ed25519Signature {
  constructor(signature) {
    this.__signature = signature;
  }

  static fromBytes(signature) {
    if (signature.length !== ED25519_SIGNATURE_LENGTH) {
      throw new InvalidArgumentError(
        "signature",
        `signature should be ${ED25519_SIGNATURE_LENGTH} bytes; however ${signature.length} bytes were provided.`,
      );
    }
    return new Ed25519Signature(signature);
  }

  static fromHex(signature) {
    return Ed25519Signature.fromBytes(Buffer.from(signature, "hex"));
  }

  bytes() {
    return this.__signature;
  }

  hex() {
    return Ed25519SignatureHex(Buffer.from(this.__signature).toString("hex"));
  }
}

export class Ed25519PublicKey {
  constructor(keyMaterial) {
    this.__keyMaterial = keyMaterial;
  }

  static fromBytes(keyMaterial) {
    if (keyMaterial.length !== ED25519_PUBLIC_KEY_LENGTH) {
      throw new InvalidArgumentError(
        "keyMaterial",
        `Key should be ${ED25519_PUBLIC_KEY_LENGTH} bytes; however ${keyMaterial.length} bytes were provided.`,
      );
    }
    return new Ed25519PublicKey(keyMaterial);
  }

  static fromHex(keyMaterial) {
    return Ed25519PublicKey.fromBytes(Buffer.from(keyMaterial, "hex"));
  }

  verify(signature, message) {
    return sodium.crypto_sign_verify_detached(
      signature.bytes(),
      Buffer.from(message, "hex"),
      this.__keyMaterial,
    );
  }

  hash() {
    const hash = sodium.crypto_generichash(
      ED25519_PUBLIC_KEY_HASH_LENGTH,
      this.__keyMaterial,
    );
    return Ed25519KeyHash.fromBytes(hash);
  }

  bytes() {
    return this.__keyMaterial;
  }

  hex() {
    return Ed25519PublicKeyHex(Buffer.from(this.__keyMaterial).toString("hex"));
  }
}

const SCALAR_INDEX = 0;
const SCALAR_SIZE = 32;
const IV_INDEX = 32;
const IV_SIZE = 32;

export const NORMAL_ED25519_PRIVATE_KEY_LENGTH = 32;
export const EXTENDED_ED25519_PRIVATE_KEY_LENGTH = 64;

const extendedScalar = (extendedKey) => extendedKey.slice(SCALAR_INDEX, SCALAR_SIZE);
const extendedIv = (extendedKey) => extendedKey.slice(IV_INDEX, IV_INDEX + IV_SIZE);

const signExtendedDetached = (extendedKey, message) => {
  const scalar = extendedScalar(extendedKey);
  const publicKey = sodium.crypto_scalarmult_ed25519_base_noclamp(scalar);
  const nonce = sodium.crypto_core_ed25519_scalar_reduce(
    sodium.crypto_hash_sha512(Buffer.concat([extendedIv(extendedKey), message])),
  );
  const r = sodium.crypto_scalarmult_ed25519_base_noclamp(nonce);
  let hram = sodium.crypto_hash_sha512(Buffer.concat([r, publicKey, message]));
  hram = sodium.crypto_core_ed25519_scalar_reduce(hram);

  return Buffer.concat([
    r,
    sodium.crypto_core_ed25519_scalar_add(
      sodium.crypto_core_ed25519_scalar_mul(hram, scalar),
      nonce,
    ),
  ]);
};

export const Ed25519PrivateKeyType = {
  Normal: "Normal",
  Extended: "Extended",
};

export class Ed25519PrivateKey {
  constructor(keyMaterial, type) {
    this.__keyMaterial = keyMaterial;
    this.__type = type;
  }

  static fromNormalBytes(keyMaterial) {
    if (keyMaterial.length !== NORMAL_ED25519_PRIVATE_KEY_LENGTH) {
      throw new InvalidArgumentError(
        "keyMaterial",
        `Key should be ${NORMAL_ED25519_PRIVATE_KEY_LENGTH} bytes; however ${keyMaterial.length} bytes were provided.`,
      );
    }

    return new Ed25519PrivateKey(keyMaterial, Ed25519PrivateKeyType.Normal);
  }

  static fromExtendedBytes(keyMaterial) {
    if (keyMaterial.length !== EXTENDED_ED25519_PRIVATE_KEY_LENGTH) {
      throw new InvalidArgumentError(
        "keyMaterial",
        `Key should be ${EXTENDED_ED25519_PRIVATE_KEY_LENGTH} bytes; however ${keyMaterial.length} bytes were provided.`,
      );
    }

    return new Ed25519PrivateKey(keyMaterial, Ed25519PrivateKeyType.Extended);
  }

  static fromNormalHex(keyMaterial) {
    return Ed25519PrivateKey.fromNormalBytes(Buffer.from(keyMaterial, "hex"));
  }

  static fromExtendedHex(keyMaterial) {
    return Ed25519PrivateKey.fromExtendedBytes(Buffer.from(keyMaterial, "hex"));
  }

  toPublic() {
    return Ed25519PublicKey.fromBytes(
      this.__type === Ed25519PrivateKeyType.Extended
        ? sodium.crypto_scalarmult_ed25519_base_noclamp(
            extendedScalar(this.__keyMaterial),
          )
        : sodium.crypto_sign_seed_keypair(this.__keyMaterial).publicKey,
    );
  }

  sign(message) {
    return Ed25519Signature.fromBytes(
      this.__type === Ed25519PrivateKeyType.Extended
        ? signExtendedDetached(this.__keyMaterial, Buffer.from(message, "hex"))
        : sodium.crypto_sign_detached(
            Buffer.from(message, "hex"),
            Buffer.concat([this.__keyMaterial, this.toPublic().bytes()]),
          ),
    );
  }

  bytes() {
    return this.__keyMaterial;
  }

  hex() {
    const value = Buffer.from(this.__keyMaterial).toString("hex");
    return this.__type === Ed25519PrivateKeyType.Extended
      ? Ed25519PrivateExtendedKeyHex(value)
      : Ed25519PrivateNormalKeyHex(value);
  }
}

export const add28Mul8 = (x, y) => {
  let carry = 0;
  const out = new Uint8Array(32);
  for (let i = 0; i < 28; i++) {
    const r = x[i] + (y[i] << 3) + carry;
    out[i] = r & 0xff;
    carry = r >> 8;
  }

  for (let i = 28; i < 32; i++) {
    const r = x[i] + carry;
    out[i] = r & 0xff;
    carry = r >> 8;
  }

  return out;
};

export const add256bits = (x, y) => {
  let carry = 0;
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const r = x[i] + y[i] + carry;
    out[i] = r;
    carry = r >> 8;
  }

  return out;
};

const isHardenedDerivation = (index) => index >= 2147483648;

const deriveHardened = (index, scalar, iv, chainCode) => {
  const data = Buffer.allocUnsafe(1 + 64 + 4);
  data.writeUInt32LE(index, 1 + 64);
  scalar.copy(data, 1);
  iv.copy(data, 1 + 32);

  data[0] = 0x00;
  const zMac = sodium.crypto_auth_hmacsha512(data, chainCode);

  data[0] = 0x01;
  const ccMac = sodium.crypto_auth_hmacsha512(data, chainCode);

  return { ccMac, zMac };
};

const deriveSoft = (index, scalar, chainCode) => {
  const data = Buffer.allocUnsafe(1 + 32 + 4);
  data.writeUInt32LE(index, 1 + 32);

  const vk = Buffer.from(sodium.crypto_scalarmult_ed25519_base_noclamp(scalar));
  vk.copy(data, 1);

  data[0] = 0x02;
  const zMac = sodium.crypto_auth_hmacsha512(data, chainCode);

  data[0] = 0x03;
  const ccMac = sodium.crypto_auth_hmacsha512(data, chainCode);

  return { ccMac, zMac };
};

const pointOfTrunc28Mul8 = (sk) => {
  const scalar = add28Mul8(new Uint8Array(32).fill(0), sk);
  return sodium.crypto_scalarmult_ed25519_base_noclamp(scalar);
};

export const derivePrivate = (key, index) => {
  const kl = key.subarray(0, 32);
  const kr = key.subarray(32, 64);
  const cc = key.subarray(64, 96);

  const { ccMac, zMac } = isHardenedDerivation(index)
    ? deriveHardened(index, kl, kr, cc)
    : deriveSoft(index, kl, cc);

  const chainCode = ccMac.slice(32, 64);
  const zl = zMac.slice(0, 32);
  const zr = zMac.slice(32, 64);

  const left = add28Mul8(kl, zl);
  const right = add256bits(kr, zr);

  return Buffer.concat([left, right, chainCode]);
};

export const derivePublic = (key, index) => {
  const pk = key.subarray(0, 32);
  const cc = key.subarray(32, 64);

  const data = Buffer.allocUnsafe(1 + 32 + 4);
  data.writeUInt32LE(index, 1 + 32);

  if (isHardenedDerivation(index)) {
    throw new InvalidArgumentError(
      "index",
      "Public key can not be derived from a hardened index.",
    );
  }

  pk.copy(data, 1);

  data[0] = 0x02;
  const z = sodium.crypto_auth_hmacsha512(data, cc);

  data[0] = 0x03;
  const c = sodium.crypto_auth_hmacsha512(data, cc);

  const chainCode = c.slice(32, 64);
  const zl = z.slice(0, 32);
  const p = pointOfTrunc28Mul8(zl);

  return Buffer.concat([sodium.crypto_core_ed25519_add(p, pk), chainCode]);
};

export const BIP32_ED25519_PUBLIC_KEY_LENGTH = 64;

export class Bip32PublicKey {
  constructor(key) {
    this.__key = key;
  }

  static fromBytes(key) {
    if (key.length !== BIP32_ED25519_PUBLIC_KEY_LENGTH) {
      throw new InvalidArgumentError(
        "key",
        `Key should be ${BIP32_ED25519_PUBLIC_KEY_LENGTH} bytes; however ${key.length} bytes were provided.`,
      );
    }

    return new Bip32PublicKey(key);
  }

  static fromHex(key) {
    return Bip32PublicKey.fromBytes(Buffer.from(key, "hex"));
  }

  toRawKey() {
    return Ed25519PublicKey.fromBytes(this.__key.slice(0, ED25519_PUBLIC_KEY_LENGTH));
  }

  derive(derivationIndices) {
    let key = Buffer.from(this.__key);
    for (const index of derivationIndices) {
      key = derivePublic(key, index);
    }

    return Bip32PublicKey.fromBytes(key);
  }

  bytes() {
    return this.__key;
  }

  hex() {
    return Bip32PublicKeyHex(Buffer.from(this.__key).toString("hex"));
  }

  hash() {
    const hash = sodium.crypto_generichash(BIP32_PUBLIC_KEY_HASH_LENGTH, this.__key);
    return Bip32PublicKeyHashHex(Buffer.from(hash).toString("hex"));
  }
}

const PBKDF2_ITERATIONS = 4096;
const PBKDF2_KEY_SIZE = 96;
const PBKDF2_DIGEST_ALGORITHM = "sha512";
const CHAIN_CODE_INDEX = 64;
const CHAIN_CODE_SIZE = 32;

const clampScalar = (scalar) => {
  scalar[0] &= 248;
  scalar[31] &= 31;
  scalar[31] |= 64;
  return scalar;
};

export const BIP32_ED25519_PRIVATE_KEY_LENGTH = 96;

export class Bip32PrivateKey {
  constructor(key) {
    this.__key = key;
  }

  static fromBip39Entropy(entropy, password) {
    const xprv = pbkdf2Sync(
      password,
      entropy,
      PBKDF2_ITERATIONS,
      PBKDF2_KEY_SIZE,
      PBKDF2_DIGEST_ALGORITHM,
    );

    return Bip32PrivateKey.fromBytes(clampScalar(xprv));
  }

  static fromBytes(key) {
    if (key.length !== BIP32_ED25519_PRIVATE_KEY_LENGTH) {
      throw new InvalidArgumentError(
        "key",
        `Key should be ${BIP32_ED25519_PRIVATE_KEY_LENGTH} bytes; however ${key.length} bytes were provided.`,
      );
    }

    return new Bip32PrivateKey(key);
  }

  static fromHex(key) {
    return Bip32PrivateKey.fromBytes(Buffer.from(key, "hex"));
  }

  derive(derivationIndices) {
    let key = Buffer.from(this.__key);
    for (const index of derivationIndices) {
      key = derivePrivate(key, index);
    }

    return Bip32PrivateKey.fromBytes(key);
  }

  toRawKey() {
    return Ed25519PrivateKey.fromExtendedBytes(
      this.__key.slice(0, EXTENDED_ED25519_PRIVATE_KEY_LENGTH),
    );
  }

  toPublic() {
    const scalar = this.__key.slice(0, EXTENDED_ED25519_PRIVATE_KEY_LENGTH).slice(0, 32);
    const publicKey = sodium.crypto_scalarmult_ed25519_base_noclamp(scalar);

    return Bip32PublicKey.fromBytes(
      Buffer.concat([
        publicKey,
        this.__key.slice(CHAIN_CODE_INDEX, CHAIN_CODE_INDEX + CHAIN_CODE_SIZE),
      ]),
    );
  }

  bytes() {
    return this.__key;
  }

  hex() {
    return Bip32PrivateKeyHex(Buffer.from(this.__key).toString("hex"));
  }
}
