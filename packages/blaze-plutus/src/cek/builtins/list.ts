import type { Constant, DefaultFunction, ListConstant } from "../../types";
import { typeOfConstant, constantTypeEquals } from "../../types";
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

function unwrapConstant(val: Value): Constant {
  if (val.tag === "constant") {
    return val.value;
  }
  throw new EvaluationError(`expected constant, got ${val.tag}`);
}

// --- Builtins ---

function headList(args: Value[]): Value {
  const list = unwrapListConstant(args[0]!);
  if (list.values.length === 0) {
    throw new EvaluationError("headList: empty list");
  }
  return { tag: "constant", value: list.values[0]! };
}

function tailList(args: Value[]): Value {
  const list = unwrapListConstant(args[0]!);
  if (list.values.length === 0) {
    throw new EvaluationError("tailList: empty list");
  }
  return {
    tag: "constant",
    value: {
      type: "list",
      itemType: list.itemType,
      values: list.values.slice(1),
    },
  };
}

function mkCons(args: Value[]): Value {
  const elem = unwrapConstant(args[0]!);
  const list = unwrapListConstant(args[1]!);

  // Type check: element type must match list's item type
  const elemType = typeOfConstant(elem);
  if (!constantTypeEquals(elemType, list.itemType)) {
    throw new EvaluationError(`mkCons: type mismatch`);
  }

  return {
    tag: "constant",
    value: {
      type: "list",
      itemType: list.itemType,
      values: [elem, ...list.values],
    },
  };
}

function nullList(args: Value[]): Value {
  const list = unwrapListConstant(args[0]!);
  return {
    tag: "constant",
    value: { type: "bool", value: list.values.length === 0 },
  };
}

function chooseList(args: Value[]): Value {
  const list = unwrapListConstant(args[0]!);
  return list.values.length === 0 ? args[1]! : args[2]!;
}

function dropList(args: Value[]): Value {
  const n = unwrapInteger(args[0]!);
  const list = unwrapListConstant(args[1]!);
  const drop =
    n < 0n
      ? 0
      : n > BigInt(list.values.length)
        ? list.values.length
        : Number(n);
  return {
    tag: "constant",
    value: {
      type: "list",
      itemType: list.itemType,
      values: list.values.slice(drop),
    },
  };
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  headList,
  tailList,
  mkCons,
  nullList,
  chooseList,
  dropList,
};
