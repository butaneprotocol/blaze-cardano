import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import {
  type BuiltinFn,
  unwrapByteString,
  byteStringResult,
  boolResult,
} from "./helpers";

// --- Module-specific helpers ---

function unwrapString(val: Value): string {
  if (val.tag === "constant" && val.value.type === "string") {
    return val.value.value;
  }
  throw new EvaluationError(
    `expected string constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function stringResult(s: string): Value {
  return { tag: "constant", value: { type: "string", value: s } };
}

// --- Builtins ---

function appendString(args: Value[]): Value {
  const a = unwrapString(args[0]!);
  const b = unwrapString(args[1]!);
  return stringResult(a + b);
}

function equalsString(args: Value[]): Value {
  const a = unwrapString(args[0]!);
  const b = unwrapString(args[1]!);
  return boolResult(a === b);
}

function encodeUtf8(args: Value[]): Value {
  const s = unwrapString(args[0]!);
  return byteStringResult(new TextEncoder().encode(s));
}

function decodeUtf8(args: Value[]): Value {
  const bs = unwrapByteString(args[0]!);
  try {
    const s = new TextDecoder("utf-8", { fatal: true }).decode(bs);
    return stringResult(s);
  } catch {
    throw new EvaluationError("decodeUtf8: invalid UTF-8 byte sequence");
  }
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  appendString,
  equalsString,
  encodeUtf8,
  decodeUtf8,
};
