import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import {
  type BuiltinFn,
  unwrapBool,
  unwrapByteString,
  unwrapInteger,
  byteStringResult,
  integerResult,
  boolResult,
} from "./helpers";

const INTEGER_TO_BYTE_STRING_MAXIMUM_OUTPUT_LENGTH = 8192;

// --- Helpers ---

function bitwiseOp(
  args: Value[],
  op: (a: number, b: number) => number,
  padByte: number,
): Value {
  const shouldPad = unwrapBool(args[0]!);
  const bs1 = unwrapByteString(args[1]!);
  const bs2 = unwrapByteString(args[2]!);

  const shorter = bs1.length <= bs2.length ? bs1 : bs2;
  const longer = bs1.length <= bs2.length ? bs2 : bs1;

  if (shouldPad) {
    // Output length = max(len1, len2), shorter padded on the RIGHT
    const result = new Uint8Array(longer.length);
    for (let i = 0; i < longer.length; i++) {
      const a = longer[i]!;
      const b = i < shorter.length ? shorter[i]! : padByte;
      result[i] = op(a, b);
    }
    return byteStringResult(result);
  } else {
    // Output length = min(len1, len2), LEFT-aligned
    const minLen = shorter.length;
    const result = new Uint8Array(minLen);
    for (let i = 0; i < minLen; i++) {
      result[i] = op(bs1[i]!, bs2[i]!);
    }
    return byteStringResult(result);
  }
}

// --- Logical bitwise ops ---

function andByteString(args: Value[]): Value {
  return bitwiseOp(args, (a, b) => a & b, 0xff);
}

function orByteString(args: Value[]): Value {
  return bitwiseOp(args, (a, b) => a | b, 0x00);
}

function xorByteString(args: Value[]): Value {
  return bitwiseOp(args, (a, b) => a ^ b, 0x00);
}

function complementByteString(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  const result = new Uint8Array(bs.length);
  for (let i = 0; i < bs.length; i++) {
    result[i] = bs[i]! ^ 0xff;
  }
  return byteStringResult(result);
}

// --- Shift & Rotate ---

function shiftByteString(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  const shiftAmount = unwrapInteger(args[1]!);

  if (bs.length === 0) return byteStringResult(new Uint8Array(0));

  const totalBits = bs.length * 8;

  // Clamp to safe range — if |shift| >= totalBits, result is all zeros
  let shift: number;
  if (shiftAmount > BigInt(totalBits) || shiftAmount < BigInt(-totalBits)) {
    return byteStringResult(new Uint8Array(bs.length));
  }
  shift = Number(shiftAmount);

  if (shift === 0) {
    return byteStringResult(Uint8Array.from(bs));
  }

  const result = new Uint8Array(bs.length);

  if (shift > 0) {
    // Left shift (toward MSB) — MSB0 ordering
    // Bit i of result comes from bit (i + shift) of source
    for (let i = 0; i < totalBits - shift; i++) {
      const srcIdx = i + shift;
      const srcByte = srcIdx >>> 3;
      const srcBit = 7 - (srcIdx & 7);
      if ((bs[srcByte]! >> srcBit) & 1) {
        const dstByte = i >>> 3;
        const dstBit = 7 - (i & 7);
        result[dstByte] = result[dstByte]! | (1 << dstBit);
      }
    }
  } else {
    // Right shift (toward LSB) — MSB0 ordering
    const absShift = -shift;
    for (let i = absShift; i < totalBits; i++) {
      const srcIdx = i - absShift;
      const srcByte = srcIdx >>> 3;
      const srcBit = 7 - (srcIdx & 7);
      if ((bs[srcByte]! >> srcBit) & 1) {
        const dstByte = i >>> 3;
        const dstBit = 7 - (i & 7);
        result[dstByte] = result[dstByte]! | (1 << dstBit);
      }
    }
  }

  return byteStringResult(result);
}

function rotateByteString(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  const rotAmount = unwrapInteger(args[1]!);

  if (bs.length === 0) return byteStringResult(new Uint8Array(0));

  const totalBits = BigInt(bs.length * 8);

  // Normalize rotation to [0, totalBits)
  let normalized = ((rotAmount % totalBits) + totalBits) % totalBits;
  if (normalized === 0n) return byteStringResult(Uint8Array.from(bs));

  const shift = Number(normalized);
  const byteShift = Math.floor(shift / 8);
  const bitShift = shift % 8;

  const result = new Uint8Array(bs.length);
  const len = bs.length;

  for (let i = 0; i < len; i++) {
    const src = (i + byteShift) % len;
    const next = (src + 1) % len;
    result[i] =
      ((bs[src]! << bitShift) | (bs[next]! >>> (8 - bitShift))) & 0xff;
  }

  return byteStringResult(result);
}

// --- Bit access ---

function readBit(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  const idx = unwrapInteger(args[1]!);

  if (idx < 0n) {
    throw new EvaluationError("readBit: negative index");
  }

  const totalBits = BigInt(bs.length * 8);
  if (idx >= totalBits) {
    throw new EvaluationError("readBit: index out of bounds");
  }

  const bitIdx = Number(idx);
  const byteIndex = bitIdx >>> 3;
  const bitOffset = bitIdx & 7;
  const flippedIndex = bs.length - 1 - byteIndex;

  return boolResult(((bs[flippedIndex]! >>> bitOffset) & 1) === 1);
}

function writeBits(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  const indicesVal = args[1]!;
  const setVal = unwrapBool(args[2]!);

  // Unwrap the list of integer indices
  if (indicesVal.tag !== "constant" || indicesVal.value.type !== "list") {
    throw new EvaluationError(
      `writeBits: expected list constant for indices, got ${indicesVal.tag === "constant" ? indicesVal.value.type : indicesVal.tag}`,
    );
  }

  const indices = indicesVal.value.values;
  const totalBits = BigInt(bs.length * 8);

  const result = Uint8Array.from(bs);

  for (const c of indices) {
    if (c.type !== "integer") {
      throw new EvaluationError(
        `writeBits: expected integer in index list, got ${c.type}`,
      );
    }
    const idx = c.value;
    if (idx < 0n || idx >= totalBits) {
      throw new EvaluationError("writeBits: index out of bounds");
    }

    const bitIdx = Number(idx);
    const byteIndex = bitIdx >>> 3;
    const bitOffset = bitIdx & 7;
    const flippedIndex = bs.length - 1 - byteIndex;

    if (setVal) {
      result[flippedIndex] = result[flippedIndex]! | (1 << bitOffset);
    } else {
      result[flippedIndex] = result[flippedIndex]! & ~(1 << bitOffset);
    }
  }

  return byteStringResult(result);
}

// --- Count / Find ---

// Popcount lookup table
const POPCOUNT_TABLE = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  POPCOUNT_TABLE[i] =
    (i & 1) +
    ((i >>> 1) & 1) +
    ((i >>> 2) & 1) +
    ((i >>> 3) & 1) +
    ((i >>> 4) & 1) +
    ((i >>> 5) & 1) +
    ((i >>> 6) & 1) +
    ((i >>> 7) & 1);
}

function countSetBits(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  let count = 0;
  for (let i = 0; i < bs.length; i++) {
    count += POPCOUNT_TABLE[bs[i]!]!;
  }
  return integerResult(BigInt(count));
}

function findFirstSetBit(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);

  // Iterate from LSB end (last byte) backward
  for (let byteIdx = bs.length - 1; byteIdx >= 0; byteIdx--) {
    const byte = bs[byteIdx]!;
    if (byte !== 0) {
      // Count trailing zeros
      let ctz = 0;
      let b = byte;
      while ((b & 1) === 0) {
        ctz++;
        b >>>= 1;
      }
      const bitIndex = ctz + (bs.length - 1 - byteIdx) * 8;
      return integerResult(BigInt(bitIndex));
    }
  }

  return integerResult(-1n);
}

// --- Replicate ---

function replicateByte(args: Value[]): Value {
  const size = unwrapInteger(args[0]!);
  const byte = unwrapInteger(args[1]!);

  if (size < 0n) {
    throw new EvaluationError("replicateByte: negative size");
  }
  if (size > BigInt(INTEGER_TO_BYTE_STRING_MAXIMUM_OUTPUT_LENGTH)) {
    throw new EvaluationError("replicateByte: size exceeds 8192");
  }
  if (byte < 0n || byte > 255n) {
    throw new EvaluationError("replicateByte: byte value not in [0, 255]");
  }

  const result = new Uint8Array(Number(size));
  result.fill(Number(byte));
  return byteStringResult(result);
}

// --- Integer/ByteString conversion ---

function integerToByteString(args: Value[]): Value {
  const bigEndian = unwrapBool(args[0]!);
  const size = unwrapInteger(args[1]!);
  const input = unwrapInteger(args[2]!);

  if (input < 0n) {
    throw new EvaluationError("integerToByteString: negative integer");
  }
  if (size < 0n) {
    throw new EvaluationError("integerToByteString: negative size");
  }
  if (size > BigInt(INTEGER_TO_BYTE_STRING_MAXIMUM_OUTPUT_LENGTH)) {
    throw new EvaluationError("integerToByteString: size exceeds 8192");
  }

  const requestedSize = Number(size);

  // Convert bigint to big-endian bytes
  let significantBytes: Uint8Array;
  if (input === 0n) {
    significantBytes = new Uint8Array(0);
  } else {
    const hex = input.toString(16);
    const padded = hex.length % 2 ? "0" + hex : hex;
    significantBytes = new Uint8Array(padded.length / 2);
    for (let i = 0; i < significantBytes.length; i++) {
      significantBytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
    }
  }

  if (requestedSize === 0) {
    // Unbounded — minimal representation
    if (
      significantBytes.length > INTEGER_TO_BYTE_STRING_MAXIMUM_OUTPUT_LENGTH
    ) {
      throw new EvaluationError(
        "integerToByteString: output exceeds 8192 bytes",
      );
    }
    if (bigEndian) {
      return byteStringResult(significantBytes);
    } else {
      // Reverse for little-endian
      const result = new Uint8Array(significantBytes.length);
      for (let i = 0; i < significantBytes.length; i++) {
        result[i] = significantBytes[significantBytes.length - 1 - i]!;
      }
      return byteStringResult(result);
    }
  } else {
    // Bounded — must fit in requested size
    if (significantBytes.length > requestedSize) {
      throw new EvaluationError(
        "integerToByteString: integer doesn't fit in requested size",
      );
    }

    const result = new Uint8Array(requestedSize);
    if (bigEndian) {
      // Pad with zeros on the left, significant bytes on the right
      const offset = requestedSize - significantBytes.length;
      result.set(significantBytes, offset);
    } else {
      // Little-endian: reversed significant bytes on the left, zeros on the right
      for (let i = 0; i < significantBytes.length; i++) {
        result[i] = significantBytes[significantBytes.length - 1 - i]!;
      }
    }

    return byteStringResult(result);
  }
}

function byteStringToInteger(args: Value[]): Value {
  const bigEndian = unwrapBool(args[0]!);
  const bs = unwrapByteString(args[1]!);

  if (bs.length === 0) return integerResult(0n);

  let result = 0n;
  if (bigEndian) {
    for (let i = 0; i < bs.length; i++) {
      result = (result << 8n) | BigInt(bs[i]!);
    }
  } else {
    // Little-endian: iterate right to left
    for (let i = bs.length - 1; i >= 0; i--) {
      result = (result << 8n) | BigInt(bs[i]!);
    }
  }

  return integerResult(result);
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  andByteString,
  orByteString,
  xorByteString,
  complementByteString,
  shiftByteString,
  rotateByteString,
  readBit,
  writeBits,
  countSetBits,
  findFirstSetBit,
  replicateByte,
  integerToByteString,
  byteStringToInteger,
};
