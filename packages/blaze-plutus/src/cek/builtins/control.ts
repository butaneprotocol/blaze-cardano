import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import { type BuiltinFn, unwrapBool } from "./helpers";

// --- Builtins ---

function ifThenElse(args: Value[]): Value {
  return unwrapBool(args[0]!) ? args[1]! : args[2]!;
}

function chooseUnit(args: Value[]): Value {
  const unit = args[0]!;
  if (unit.tag !== "constant" || unit.value.type !== "unit") {
    throw new EvaluationError(
      `chooseUnit: expected unit constant, got ${unit.tag === "constant" ? unit.value.type : unit.tag}`,
    );
  }
  return args[1]!;
}

function trace(args: Value[]): Value {
  // args[0] is a string — we could log it, but the spec just returns args[1]
  return args[1]!;
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  ifThenElse,
  chooseUnit,
  trace,
};
