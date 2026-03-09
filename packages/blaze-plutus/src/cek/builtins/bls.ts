import { bls12_381 } from "@noble/curves/bls12-381";
import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import {
  type BuiltinFn,
  unwrapByteString,
  unwrapInteger,
  byteStringResult,
  boolResult,
} from "./helpers";

// --- BLS12-381 constants ---

const G1Point = bls12_381.G1.ProjectivePoint;
const G2Point = bls12_381.G2.ProjectivePoint;
const Fp12 = bls12_381.fields.Fp12;
const Fr = bls12_381.fields.Fr;

const MSM_SCALAR_UB = (1n << 4095n) - 1n;
const MSM_SCALAR_LB = -(1n << 4095n);

// BLS spec: when infinity flag (0x40) is set, sign bit (0x20) must be 0
function hasInvalidInfinityEncoding(bytes: Uint8Array): boolean {
  return (bytes[0]! & 0x60) === 0x60;
}

// --- Unwrap helpers ---

function unwrapG1(val: Value): Uint8Array {
  if (val.tag === "constant" && val.value.type === "bls12_381_g1_element") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected bls12_381_g1_element, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function unwrapG2(val: Value): Uint8Array {
  if (val.tag === "constant" && val.value.type === "bls12_381_g2_element") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected bls12_381_g2_element, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function unwrapMlResult(val: Value): Uint8Array {
  if (val.tag === "constant" && val.value.type === "bls12_381_ml_result") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected bls12_381_ml_result, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

// --- Result builders ---

function g1Result(bytes: Uint8Array): Value {
  return { tag: "constant", value: { type: "bls12_381_g1_element", value: bytes } };
}

function g2Result(bytes: Uint8Array): Value {
  return { tag: "constant", value: { type: "bls12_381_g2_element", value: bytes } };
}

function mlResult(bytes: Uint8Array): Value {
  return { tag: "constant", value: { type: "bls12_381_ml_result", value: bytes } };
}

// --- Scalar reduction ---

function reduceScalar(scalar: bigint): bigint {
  let s = scalar % Fr.ORDER;
  if (s < 0n) s += Fr.ORDER;
  return s;
}

// --- G1 builtins ---

function bls12_381_G1_add(args: Value[]): Value {
  const a = G1Point.fromHex(unwrapG1(args[0]!));
  const b = G1Point.fromHex(unwrapG1(args[1]!));
  return g1Result(a.add(b).toRawBytes(true));
}

function bls12_381_G1_neg(args: Value[]): Value {
  const a = G1Point.fromHex(unwrapG1(args[0]!));
  return g1Result(a.negate().toRawBytes(true));
}

function bls12_381_G1_scalarMul(args: Value[]): Value {
  const scalar = unwrapInteger(args[0]!);
  const point = G1Point.fromHex(unwrapG1(args[1]!));
  const s = reduceScalar(scalar);
  if (s === 0n) {
    return g1Result(G1Point.ZERO.toRawBytes(true));
  }
  return g1Result(point.multiply(s).toRawBytes(true));
}

function bls12_381_G1_equal(args: Value[]): Value {
  const a = G1Point.fromHex(unwrapG1(args[0]!));
  const b = G1Point.fromHex(unwrapG1(args[1]!));
  return boolResult(a.equals(b));
}

function bls12_381_G1_compress(args: Value[]): Value {
  // G1 elements are already stored compressed (48 bytes)
  return byteStringResult(unwrapG1(args[0]!));
}

function bls12_381_G1_uncompress(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  if (bs.length !== 48) {
    throw new EvaluationError(
      `bls12_381_G1_uncompress: expected 48 bytes, got ${bs.length}`,
    );
  }
  if (hasInvalidInfinityEncoding(bs)) {
    throw new EvaluationError(
      "bls12_381_G1_uncompress: invalid compressed point",
    );
  }
  try {
    G1Point.fromHex(bs);
  } catch {
    throw new EvaluationError(
      "bls12_381_G1_uncompress: invalid compressed point",
    );
  }
  return g1Result(bs);
}

function bls12_381_G1_hashToGroup(args: Value[]): Value {
  const msg = unwrapByteString(args[0]!);
  const dst = unwrapByteString(args[1]!);
  if (dst.length > 255) {
    throw new EvaluationError(
      "bls12_381_G1_hashToGroup: DST must be at most 255 bytes",
    );
  }
  const hashed = bls12_381.G1.hashToCurve(msg, { DST: dst });
  const point = G1Point.fromAffine(hashed.toAffine());
  return g1Result(point.toRawBytes(true));
}

function bls12_381_G1_multiScalarMul(args: Value[]): Value {
  const scalarList = unwrapList(args[0]!, "integer");
  const pointList = unwrapList(args[1]!, "bls12_381_g1_element");
  const len = Math.min(scalarList.length, pointList.length);

  if (len === 0) {
    return g1Result(G1Point.ZERO.toRawBytes(true));
  }

  const scalars: bigint[] = [];
  const points = [];

  for (let i = 0; i < len; i++) {
    const s = (scalarList[i]! as { type: "integer"; value: bigint }).value;
    if (s > MSM_SCALAR_UB || s < MSM_SCALAR_LB) {
      throw new EvaluationError(
        "bls12_381_G1_multiScalarMul: scalar out of bounds",
      );
    }
    scalars.push(reduceScalar(s));
    const bytes = (pointList[i]! as { type: "bls12_381_g1_element"; value: Uint8Array }).value;
    points.push(G1Point.fromHex(bytes));
  }

  const result = G1Point.msm(points, scalars);
  return g1Result(result.toRawBytes(true));
}

// --- G2 builtins ---

function bls12_381_G2_add(args: Value[]): Value {
  const a = G2Point.fromHex(unwrapG2(args[0]!));
  const b = G2Point.fromHex(unwrapG2(args[1]!));
  return g2Result(a.add(b).toRawBytes(true));
}

function bls12_381_G2_neg(args: Value[]): Value {
  const a = G2Point.fromHex(unwrapG2(args[0]!));
  return g2Result(a.negate().toRawBytes(true));
}

function bls12_381_G2_scalarMul(args: Value[]): Value {
  const scalar = unwrapInteger(args[0]!);
  const point = G2Point.fromHex(unwrapG2(args[1]!));
  const s = reduceScalar(scalar);
  if (s === 0n) {
    return g2Result(G2Point.ZERO.toRawBytes(true));
  }
  return g2Result(point.multiply(s).toRawBytes(true));
}

function bls12_381_G2_equal(args: Value[]): Value {
  const a = G2Point.fromHex(unwrapG2(args[0]!));
  const b = G2Point.fromHex(unwrapG2(args[1]!));
  return boolResult(a.equals(b));
}

function bls12_381_G2_compress(args: Value[]): Value {
  // G2 elements are already stored compressed (96 bytes)
  return byteStringResult(unwrapG2(args[0]!));
}

function bls12_381_G2_uncompress(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  if (bs.length !== 96) {
    throw new EvaluationError(
      `bls12_381_G2_uncompress: expected 96 bytes, got ${bs.length}`,
    );
  }
  if (hasInvalidInfinityEncoding(bs)) {
    throw new EvaluationError(
      "bls12_381_G2_uncompress: invalid compressed point",
    );
  }
  try {
    G2Point.fromHex(bs);
  } catch {
    throw new EvaluationError(
      "bls12_381_G2_uncompress: invalid compressed point",
    );
  }
  return g2Result(bs);
}

function bls12_381_G2_hashToGroup(args: Value[]): Value {
  const msg = unwrapByteString(args[0]!);
  const dst = unwrapByteString(args[1]!);
  if (dst.length > 255) {
    throw new EvaluationError(
      "bls12_381_G2_hashToGroup: DST must be at most 255 bytes",
    );
  }
  const hashed = bls12_381.G2.hashToCurve(msg, { DST: dst });
  const point = G2Point.fromAffine(hashed.toAffine());
  return g2Result(point.toRawBytes(true));
}

function bls12_381_G2_multiScalarMul(args: Value[]): Value {
  const scalarList = unwrapList(args[0]!, "integer");
  const pointList = unwrapList(args[1]!, "bls12_381_g2_element");
  const len = Math.min(scalarList.length, pointList.length);

  if (len === 0) {
    return g2Result(G2Point.ZERO.toRawBytes(true));
  }

  const scalars: bigint[] = [];
  const points = [];

  for (let i = 0; i < len; i++) {
    const s = (scalarList[i]! as { type: "integer"; value: bigint }).value;
    if (s > MSM_SCALAR_UB || s < MSM_SCALAR_LB) {
      throw new EvaluationError(
        "bls12_381_G2_multiScalarMul: scalar out of bounds",
      );
    }
    scalars.push(reduceScalar(s));
    const bytes = (pointList[i]! as { type: "bls12_381_g2_element"; value: Uint8Array }).value;
    points.push(G2Point.fromHex(bytes));
  }

  const result = G2Point.msm(points, scalars);
  return g2Result(result.toRawBytes(true));
}

// --- Pairing builtins ---

function bls12_381_millerLoop(args: Value[]): Value {
  const g1 = G1Point.fromHex(unwrapG1(args[0]!));
  const g2 = G2Point.fromHex(unwrapG2(args[1]!));
  const result = bls12_381.pairing(g1, g2, false);
  return mlResult(Fp12.toBytes(result));
}

function bls12_381_mulMlResult(args: Value[]): Value {
  const a = Fp12.fromBytes(unwrapMlResult(args[0]!));
  const b = Fp12.fromBytes(unwrapMlResult(args[1]!));
  return mlResult(Fp12.toBytes(Fp12.mul(a, b)));
}

function bls12_381_finalVerify(args: Value[]): Value {
  const a = Fp12.fromBytes(unwrapMlResult(args[0]!));
  const b = Fp12.fromBytes(unwrapMlResult(args[1]!));
  return boolResult(
    Fp12.eql(Fp12.finalExponentiate(a), Fp12.finalExponentiate(b)),
  );
}

// --- List unwrap helper ---

import type { Constant } from "../../types";

function unwrapList(val: Value, expectedItemType: string): readonly Constant[] {
  if (val.tag === "constant" && val.value.type === "list") {
    return val.value.values;
  }
  throw new EvaluationError(
    `expected list of ${expectedItemType}, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  bls12_381_G1_add,
  bls12_381_G1_neg,
  bls12_381_G1_scalarMul,
  bls12_381_G1_equal,
  bls12_381_G1_compress,
  bls12_381_G1_uncompress,
  bls12_381_G1_hashToGroup,
  bls12_381_G1_multiScalarMul,
  bls12_381_G2_add,
  bls12_381_G2_neg,
  bls12_381_G2_scalarMul,
  bls12_381_G2_equal,
  bls12_381_G2_compress,
  bls12_381_G2_uncompress,
  bls12_381_G2_hashToGroup,
  bls12_381_G2_multiScalarMul,
  bls12_381_millerLoop,
  bls12_381_mulMlResult,
  bls12_381_finalVerify,
};
