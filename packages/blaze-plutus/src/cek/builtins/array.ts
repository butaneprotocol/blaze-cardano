import type { ArrayConstant, DefaultFunction, ListConstant } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import { type BuiltinFn, unwrapInteger } from "./helpers";

// --- Module-specific unwrap helpers ---

function unwrapListConstant(val: Value): ListConstant {
  if (val.tag === "constant" && val.value.type === "list") {
    return val.value;
  }
  throw new EvaluationError(
    `expected list constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function unwrapArrayConstant(val: Value): ArrayConstant {
  if (val.tag === "constant" && val.value.type === "array") {
    return val.value;
  }
  throw new EvaluationError(
    `expected array constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

// --- Builtins ---

function listToArray(args: Value[]): Value {
  const list = unwrapListConstant(args[0]!);
  return {
    tag: "constant",
    value: {
      type: "array",
      itemType: list.itemType,
      values: list.values,
    },
  };
}

function lengthOfArray(args: Value[]): Value {
  const arr = unwrapArrayConstant(args[0]!);
  return {
    tag: "constant",
    value: { type: "integer", value: BigInt(arr.values.length) },
  };
}

function indexArray(args: Value[]): Value {
  const arr = unwrapArrayConstant(args[0]!);
  const idx = unwrapInteger(args[1]!);
  if (idx < 0n || idx >= BigInt(arr.values.length)) {
    throw new EvaluationError(
      `indexArray: index ${idx} out of bounds for array of length ${arr.values.length}`,
    );
  }
  return { tag: "constant", value: arr.values[Number(idx)]! };
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  listToArray,
  lengthOfArray,
  indexArray,
};
