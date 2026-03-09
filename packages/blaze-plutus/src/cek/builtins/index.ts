import type { Value } from "../value";
import type { DefaultFunction } from "../../types";
import { EvaluationError } from "../error";
import * as arithmetic from "./arithmetic";
import * as bytestring from "./bytestring";
import * as string_ from "./string";
import * as data_ from "./data";
import * as list_ from "./list";
import * as pair_ from "./pair";
import * as control_ from "./control";

type BuiltinFn = (args: Value[]) => Value;

const BUILTINS: Partial<Record<DefaultFunction, BuiltinFn>> = {
  ...arithmetic.builtins,
  ...bytestring.builtins,
  ...string_.builtins,
  ...data_.builtins,
  ...list_.builtins,
  ...pair_.builtins,
  ...control_.builtins,
};

export function callBuiltinImpl(func: DefaultFunction, args: Value[]): Value {
  const fn = BUILTINS[func];
  if (fn === undefined) {
    throw new EvaluationError(`builtin not implemented: ${func}`);
  }
  return fn(args);
}
