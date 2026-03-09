import { sha256 } from "@noble/hashes/sha256";
import { sha3_256 as noble_sha3_256 } from "@noble/hashes/sha3";
import { keccak_256 as noble_keccak_256 } from "@noble/hashes/sha3";
import { blake2b } from "@noble/hashes/blake2b";
import { ripemd160 } from "@noble/hashes/ripemd160";
import { ed25519 } from "@noble/curves/ed25519";
import { secp256k1, schnorr } from "@noble/curves/secp256k1";
import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import {
  type BuiltinFn,
  unwrapByteString,
  byteStringResult,
  boolResult,
} from "./helpers";

// --- Hash builtins ---

function sha2_256(args: Value[]): Value {
  return byteStringResult(sha256(unwrapByteString(args[0]!)));
}

function sha3_256_builtin(args: Value[]): Value {
  return byteStringResult(noble_sha3_256(unwrapByteString(args[0]!)));
}

function blake2b_256(args: Value[]): Value {
  return byteStringResult(blake2b(unwrapByteString(args[0]!), { dkLen: 32 }));
}

function blake2b_224(args: Value[]): Value {
  return byteStringResult(blake2b(unwrapByteString(args[0]!), { dkLen: 28 }));
}

function keccak_256_builtin(args: Value[]): Value {
  return byteStringResult(noble_keccak_256(unwrapByteString(args[0]!)));
}

function ripemd_160(args: Value[]): Value {
  return byteStringResult(ripemd160(unwrapByteString(args[0]!)));
}

// --- Signature verification builtins ---

function verifyEd25519Signature(args: Value[]): Value {
  const pk = unwrapByteString(args[0]!);
  const msg = unwrapByteString(args[1]!);
  const sig = unwrapByteString(args[2]!);
  if (pk.length !== 32)
    throw new EvaluationError(
      "verifyEd25519Signature: public key must be 32 bytes",
    );
  if (sig.length !== 64)
    throw new EvaluationError(
      "verifyEd25519Signature: signature must be 64 bytes",
    );
  try {
    return boolResult(ed25519.verify(sig, msg, pk));
  } catch {
    return boolResult(false);
  }
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

function verifyEcdsaSecp256k1Signature(args: Value[]): Value {
  const pk = unwrapByteString(args[0]!);
  const msg = unwrapByteString(args[1]!);
  const sig = unwrapByteString(args[2]!);
  if (pk.length !== 33)
    throw new EvaluationError(
      "verifyEcdsaSecp256k1Signature: public key must be 33 bytes",
    );
  if (msg.length !== 32)
    throw new EvaluationError(
      "verifyEcdsaSecp256k1Signature: message must be 32 bytes",
    );
  if (sig.length !== 64)
    throw new EvaluationError(
      "verifyEcdsaSecp256k1Signature: signature must be 64 bytes",
    );

  // Parse compressed public key — failure is EvaluationError
  try {
    secp256k1.Point.fromBytes(pk);
  } catch {
    throw new EvaluationError(
      "verifyEcdsaSecp256k1Signature: invalid public key",
    );
  }

  // Extract r, s from raw 64-byte signature
  const r = BigInt("0x" + bytesToHex(sig.slice(0, 32)));
  const s = BigInt("0x" + bytesToHex(sig.slice(32, 64)));

  // Validate r, s in [1, n-1] — out of range is an error per spec
  const n = secp256k1.CURVE.n;
  if (r === 0n || r >= n || s === 0n || s >= n)
    throw new EvaluationError(
      "verifyEcdsaSecp256k1Signature: r or s out of range",
    );

  // BIP-146 low-s check
  const halfOrder = n >> 1n;
  if (s > halfOrder) return boolResult(false);

  // Verify using compact 64-byte signature format
  try {
    const ecdsaSig = new secp256k1.Signature(r, s);
    return boolResult(secp256k1.verify(ecdsaSig.toBytes("compact"), msg, pk));
  } catch {
    return boolResult(false);
  }
}

function verifySchnorrSecp256k1Signature(args: Value[]): Value {
  const pk = unwrapByteString(args[0]!);
  const msg = unwrapByteString(args[1]!);
  const sig = unwrapByteString(args[2]!);
  if (pk.length !== 32)
    throw new EvaluationError(
      "verifySchnorrSecp256k1Signature: public key must be 32 bytes",
    );
  if (sig.length !== 64)
    throw new EvaluationError(
      "verifySchnorrSecp256k1Signature: signature must be 64 bytes",
    );

  // Validate public key can be parsed — invalid key is an error per spec
  try {
    schnorr.utils.lift_x(schnorr.utils.bytesToNumberBE(pk));
  } catch {
    throw new EvaluationError(
      "verifySchnorrSecp256k1Signature: invalid public key",
    );
  }

  // Verify — failure returns false
  try {
    return boolResult(schnorr.verify(sig, msg, pk));
  } catch {
    return boolResult(false);
  }
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  sha2_256,
  sha3_256: sha3_256_builtin,
  blake2b_256,
  blake2b_224,
  keccak_256: keccak_256_builtin,
  ripemd_160,
  verifyEd25519Signature,
  verifyEcdsaSecp256k1Signature,
  verifySchnorrSecp256k1Signature,
};
