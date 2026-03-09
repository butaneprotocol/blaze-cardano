// ExMem size measurement helpers.
// Convert runtime values to cost-model input sizes.
// Ported from plutuz/src/cek/ex_mem.zig and builtins/builtins.zig:computeArgSizes.

import type { DefaultFunction, LedgerValue, PlutusData } from "../types";
import { I64_MAX } from "../types";
import type { Value } from "./value";

// --- Primitive size functions ---

export function integerExMem(n: bigint): number {
  if (n === 0n) return 1;
  const abs = n < 0n ? -n : n;
  const bits = abs.toString(2).length;
  return Math.floor((bits - 1) / 64) + 1;
}

export function byteStringExMem(bs: Uint8Array): number {
  if (bs.length === 0) return 1;
  return Math.floor((bs.length - 1) / 8) + 1;
}

export function stringExMem(s: string): number {
  return new TextEncoder().encode(s).length;
}

export function dataExMem(d: PlutusData): number {
  let total = 0;
  const stack: PlutusData[] = [d];
  while (stack.length > 0) {
    const current = stack.pop()!;
    total += 4;
    switch (current.tag) {
      case "constr":
        for (let i = current.fields.length - 1; i >= 0; i--) {
          stack.push(current.fields[i]!);
        }
        break;
      case "map":
        for (let i = current.entries.length - 1; i >= 0; i--) {
          const [k, v] = current.entries[i]!;
          stack.push(v);
          stack.push(k);
        }
        break;
      case "list":
        for (let i = current.values.length - 1; i >= 0; i--) {
          stack.push(current.values[i]!);
        }
        break;
      case "integer":
        total += integerExMem(current.value);
        break;
      case "bytestring":
        total += byteStringExMem(current.value);
        break;
    }
  }
  return total;
}

export function valueSizeExMem(v: LedgerValue): number {
  let size = 0;
  for (const entry of v.entries) {
    size += entry.tokens.length;
  }
  return size;
}

export function sizeExMem(value: number): number {
  if (value <= 0) return 0;
  return Math.floor((value - 1) / 8) + 1;
}

export function integerCostedLiterally(n: bigint): bigint {
  const abs = n < 0n ? -n : n;
  if (abs > I64_MAX) return I64_MAX;
  return abs;
}

export function dataNodeCount(d: PlutusData): number {
  let total = 0;
  const stack: PlutusData[] = [d];
  while (stack.length > 0) {
    const current = stack.pop()!;
    total += 1;
    switch (current.tag) {
      case "constr":
        for (let i = current.fields.length - 1; i >= 0; i--) {
          stack.push(current.fields[i]!);
        }
        break;
      case "map":
        for (let i = current.entries.length - 1; i >= 0; i--) {
          const [k, v] = current.entries[i]!;
          stack.push(v);
          stack.push(k);
        }
        break;
      case "list":
        for (let i = current.values.length - 1; i >= 0; i--) {
          stack.push(current.values[i]!);
        }
        break;
      case "integer":
      case "bytestring":
        break;
    }
  }
  return total;
}

export function valueMaxDepth(v: LedgerValue): number {
  const outerSize = v.entries.length;
  let maxInner = 0;
  for (const entry of v.entries) {
    if (entry.tokens.length > maxInner) maxInner = entry.tokens.length;
  }
  const logOuter = outerSize > 0 ? Math.floor(Math.log2(outerSize)) + 1 : 0;
  const logInner = maxInner > 0 ? Math.floor(Math.log2(maxInner)) + 1 : 0;
  return logOuter + logInner;
}

// BLS constants
export const G1_EX_MEM = 18;
export const G2_EX_MEM = 36;
export const _ML_RESULT_EX_MEM = 72;

// --- Size extraction helpers ---

function intSize(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "integer") {
    return BigInt(integerExMem(val.value.value));
  }
  return 1n;
}

function bsSize(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "bytestring") {
    return BigInt(byteStringExMem(val.value.value));
  }
  return 0n;
}

function strSize(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "string") {
    return BigInt(stringExMem(val.value.value));
  }
  return 0n;
}

function dataSize(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "data") {
    return BigInt(dataExMem(val.value.value));
  }
  return 4n;
}

function valueSize(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "value") {
    return BigInt(valueSizeExMem(val.value.value));
  }
  return 0n;
}

function listSizeFromArg(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "list") {
    return BigInt(val.value.values.length);
  }
  return 0n;
}

function sizeExMemFromArg(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "integer") {
    const n = val.value.value;
    if (n > I64_MAX || n < -I64_MAX) return 0n;
    return BigInt(sizeExMem(Number(n)));
  }
  return 0n;
}

function intLiteralValue(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "integer") {
    return integerCostedLiterally(val.value.value);
  }
  return 0n;
}

function valueMaxDepthFromArg(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "value") {
    return BigInt(valueMaxDepth(val.value.value));
  }
  return 0n;
}

function dataNodeCountFromArg(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "data") {
    return BigInt(dataNodeCount(val.value.value));
  }
  return 0n;
}

// --- computeArgSizes: main dispatch ---

export function computeArgSizes(
  func: DefaultFunction,
  args: Value[],
): bigint[] {
  switch (func) {
    // 2-arg integer operations: (int, int)
    case "addInteger":
    case "subtractInteger":
    case "multiplyInteger":
    case "divideInteger":
    case "quotientInteger":
    case "remainderInteger":
    case "modInteger":
    case "equalsInteger":
    case "lessThanInteger":
    case "lessThanEqualsInteger":
      return [intSize(args[0]!), intSize(args[1]!), 0n];

    // 2-arg bytestring operations: (bs, bs)
    case "appendByteString":
    case "equalsByteString":
    case "lessThanByteString":
    case "lessThanEqualsByteString":
      return [bsSize(args[0]!), bsSize(args[1]!), 0n];

    // (int, bs)
    case "consByteString":
      return [intSize(args[0]!), bsSize(args[1]!), 0n];

    // (int, int, bs) - slice
    case "sliceByteString":
      return [intSize(args[0]!), intSize(args[1]!), bsSize(args[2]!)];

    // 1-arg bytestring
    case "lengthOfByteString":
    case "sha2_256":
    case "sha3_256":
    case "blake2b_256":
    case "blake2b_224":
    case "keccak_256":
    case "ripemd_160":
    case "complementByteString":
    case "countSetBits":
    case "findFirstSetBit":
      return [bsSize(args[0]!), 0n, 0n];

    // (bs, int)
    case "indexByteString":
    case "readBit":
      return [bsSize(args[0]!), intSize(args[1]!), 0n];

    // (bs, IntegerCostedLiterally)
    case "shiftByteString":
    case "rotateByteString":
      return [bsSize(args[0]!), intLiteralValue(args[1]!), 0n];

    // dropList: (IntegerCostedLiterally, list)
    case "dropList":
      return [intLiteralValue(args[0]!), listSizeFromArg(args[1]!), 0n];

    // replicateByte: (sizeExMem, int)
    case "replicateByte":
      return [sizeExMemFromArg(args[0]!), intSize(args[1]!), 0n];

    // 3-arg signature verification: (bs, bs, bs)
    case "verifyEd25519Signature":
    case "verifyEcdsaSecp256k1Signature":
    case "verifySchnorrSecp256k1Signature":
      return [bsSize(args[0]!), bsSize(args[1]!), bsSize(args[2]!)];

    // 2-arg string operations: (str, str)
    case "appendString":
    case "equalsString":
      return [strSize(args[0]!), strSize(args[1]!), 0n];

    // 1-arg string/bs
    case "encodeUtf8":
      return [strSize(args[0]!), 0n, 0n];
    case "decodeUtf8":
      return [bsSize(args[0]!), 0n, 0n];

    // Constant cost builtins (sizes don't matter)
    case "ifThenElse":
    case "chooseUnit":
    case "trace":
    case "fstPair":
    case "sndPair":
    case "chooseList":
    case "mkCons":
    case "headList":
    case "tailList":
    case "nullList":
    case "chooseData":
    case "constrData":
    case "mapData":
    case "listData":
    case "iData":
    case "bData":
    case "unConstrData":
    case "unMapData":
    case "unListData":
    case "unIData":
    case "unBData":
    case "mkPairData":
    case "mkNilData":
    case "mkNilPairData":
    case "bls12_381_G1_add":
    case "bls12_381_G1_neg":
    case "bls12_381_G1_equal":
    case "bls12_381_G1_compress":
    case "bls12_381_G1_uncompress":
    case "bls12_381_G2_add":
    case "bls12_381_G2_neg":
    case "bls12_381_G2_equal":
    case "bls12_381_G2_compress":
    case "bls12_381_G2_uncompress":
    case "bls12_381_millerLoop":
    case "bls12_381_mulMlResult":
    case "bls12_381_finalVerify":
    case "lengthOfArray":
    case "indexArray":
      return [0n, 0n, 0n];

    // insertCoin: .one model, valueMaxDepth of value arg (args[3])
    case "insertCoin":
      return [valueMaxDepthFromArg(args[3]!), 0n, 0n];

    // (data, data) - equalsData
    case "equalsData":
      return [dataSize(args[0]!), dataSize(args[1]!), 0n];

    // 1-arg data
    case "serialiseData":
      return [dataSize(args[0]!), 0n, 0n];

    // BLS scalar mul: (int, g1/g2)
    case "bls12_381_G1_scalarMul":
      return [intSize(args[0]!), BigInt(G1_EX_MEM), 0n];
    case "bls12_381_G2_scalarMul":
      return [intSize(args[0]!), BigInt(G2_EX_MEM), 0n];

    // BLS hash to group: (bs, bs)
    case "bls12_381_G1_hashToGroup":
    case "bls12_381_G2_hashToGroup":
      return [bsSize(args[0]!), bsSize(args[1]!), 0n];

    // BLS multi scalar mul: (list, list)
    case "bls12_381_G1_multiScalarMul":
    case "bls12_381_G2_multiScalarMul":
      return [listSizeFromArg(args[0]!), listSizeFromArg(args[1]!), 0n];

    // integerToByteString: (bool, sizeExMem, int)
    case "integerToByteString":
      return [1n, sizeExMemFromArg(args[1]!), intSize(args[2]!)];

    // byteStringToInteger: (bool, bs)
    case "byteStringToInteger":
      return [1n, bsSize(args[1]!), 0n];

    // 3-arg bitwise: (bool, bs, bs)
    case "andByteString":
    case "orByteString":
    case "xorByteString":
      return [1n, bsSize(args[1]!), bsSize(args[2]!)];

    // writeBits: (bs, list, list)
    case "writeBits":
      return [
        bsSize(args[0]!),
        listSizeFromArg(args[1]!),
        listSizeFromArg(args[2]!),
      ];

    // expModInteger: (int, int, int)
    case "expModInteger":
      return [intSize(args[0]!), intSize(args[1]!), intSize(args[2]!)];

    // listToArray: (list)
    case "listToArray":
      return [listSizeFromArg(args[0]!), 0n, 0n];

    // lookupCoin: (bs, bs, valueMaxDepth)
    case "lookupCoin":
      return [
        bsSize(args[0]!),
        bsSize(args[1]!),
        valueMaxDepthFromArg(args[2]!),
      ];

    // unionValue: (value, value)
    case "unionValue":
      return [valueSize(args[0]!), valueSize(args[1]!), 0n];

    // valueContains: (value, value)
    case "valueContains":
      return [valueSize(args[0]!), valueSize(args[1]!), 0n];

    // valueData: (value)
    case "valueData":
      return [valueSize(args[0]!), 0n, 0n];

    // unValueData: (dataNodeCount)
    case "unValueData":
      return [dataNodeCountFromArg(args[0]!), 0n, 0n];

    // scaleValue: (int, value)
    case "scaleValue":
      return [intSize(args[0]!), valueSize(args[1]!), 0n];
  }
}
