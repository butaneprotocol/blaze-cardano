import type { Value } from "../value";
import { EvaluationError } from "../error";

export type BuiltinFn = (args: Value[]) => Value;

// --- Unwrap helpers ---

export function unwrapByteString(val: Value): Uint8Array {
  if (val.tag === "constant" && val.value.type === "bytestring") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected bytestring constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

export function unwrapInteger(val: Value): bigint {
  if (val.tag === "constant" && val.value.type === "integer") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected integer constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

// --- Result builders ---

export function byteStringResult(bs: Uint8Array): Value {
  return { tag: "constant", value: { type: "bytestring", value: bs } };
}

export function integerResult(n: bigint): Value {
  return { tag: "constant", value: { type: "integer", value: n } };
}

export function boolResult(b: boolean): Value {
  return { tag: "constant", value: { type: "bool", value: b } };
}
