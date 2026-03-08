import type { Value } from "../value";
import type { DefaultFunction } from "../../types";
import { EvaluationError } from "../error";
import * as arithmetic from "./arithmetic";

type BuiltinFn = (args: Value[]) => Value;

const BUILTINS: Partial<Record<DefaultFunction, BuiltinFn>> = {
  ...arithmetic.builtins,
};

export function callBuiltinImpl(func: DefaultFunction, args: Value[]): Value {
  const fn = BUILTINS[func];
  if (fn === undefined) {
    throw new EvaluationError(`builtin not implemented: ${func}`);
  }
  return fn(args);
}
