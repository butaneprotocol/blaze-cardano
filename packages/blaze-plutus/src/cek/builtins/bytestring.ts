import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";

type BuiltinFn = (args: Value[]) => Value;

// --- Unwrap helpers ---

function unwrapByteString(val: Value): Uint8Array {
  if (val.tag === "constant" && val.value.type === "bytestring") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected bytestring constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function unwrapInteger(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "integer") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected integer constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

// --- Result builders ---

function byteStringResult(bs: Uint8Array): Value {
  return { tag: "constant", value: { type: "bytestring", value: bs } };
}

function integerResult(n: bigint): Value {
  return { tag: "constant", value: { type: "integer", value: n } };
}

function boolResult(b: boolean): Value {
  return { tag: "constant", value: { type: "bool", value: b } };
}

// --- Builtins ---

function appendByteString(args: Value[]): Value {
  const a = unwrapByteString(args[0]!);
  const b = unwrapByteString(args[1]!);
  const result = new Uint8Array(a.length + b.length);
  result.set(a, 0);
  result.set(b, a.length);
  return byteStringResult(result);
}

function consByteString(args: Value[]): Value {
  const n = unwrapInteger(args[0]!);
  const bs = unwrapByteString(args[1]!);
  if (n < 0n || n > 255n) {
    throw new EvaluationError(
      `consByteString: byte value out of range [0, 255]: ${n}`,
    );
  }
  const result = new Uint8Array(bs.length + 1);
  result[0] = Number(n);
  result.set(bs, 1);
  return byteStringResult(result);
}

function clampToSafe(n: bigint): number {
  if (n < 0n) return 0;
  if (n > BigInt(Number.MAX_SAFE_INTEGER)) return Number.MAX_SAFE_INTEGER;
  return Number(n);
}

function sliceByteString(args: Value[]): Value {
  const skipBig = unwrapInteger(args[0]!);
  const takeBig = unwrapInteger(args[1]!);
  const bs = unwrapByteString(args[2]!);
  const skip = Math.max(0, Math.min(clampToSafe(skipBig), bs.length));
  const take = Math.max(0, Math.min(clampToSafe(takeBig), bs.length - skip));
  return byteStringResult(bs.slice(skip, skip + take));
}

function lengthOfByteString(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  return integerResult(BigInt(bs.length));
}

function indexByteString(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  const idxBig = unwrapInteger(args[1]!);
  const idx = clampToSafe(idxBig);
  if (idxBig < 0n || idx >= bs.length) {
    throw new EvaluationError(
      `indexByteString: index out of bounds: ${idxBig}, length: ${bs.length}`,
    );
  }
  return integerResult(BigInt(bs[idx]!));
}

function equalsByteString(args: Value[]): Value {
  const a = unwrapByteString(args[0]!);
  const b = unwrapByteString(args[1]!);
  if (a.length !== b.length) return boolResult(false);
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return boolResult(false);
  }
  return boolResult(true);
}

function lessThanByteString(args: Value[]): Value {
  const a = unwrapByteString(args[0]!);
  const b = unwrapByteString(args[1]!);
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i]! < b[i]!) return boolResult(true);
    if (a[i]! > b[i]!) return boolResult(false);
  }
  return boolResult(a.length < b.length);
}

function lessThanEqualsByteString(args: Value[]): Value {
  const a = unwrapByteString(args[0]!);
  const b = unwrapByteString(args[1]!);
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) {
    if (a[i]! < b[i]!) return boolResult(true);
    if (a[i]! > b[i]!) return boolResult(false);
  }
  return boolResult(a.length <= b.length);
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  appendByteString,
  consByteString,
  sliceByteString,
  lengthOfByteString,
  indexByteString,
  equalsByteString,
  lessThanByteString,
  lessThanEqualsByteString,
};
