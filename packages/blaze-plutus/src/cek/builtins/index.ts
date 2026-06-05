import type { Value } from "../value";
import type { DefaultFunction } from "../../types";
import { EvaluationError } from "../error";
import type { BuiltinFn } from "./helpers";
import * as arithmetic from "./arithmetic";
import * as bytestring from "./bytestring";
import * as string_ from "./string";
import * as data_ from "./data";
import * as list_ from "./list";
import * as pair_ from "./pair";
import * as control_ from "./control";
import * as crypto_ from "./crypto";
import * as bitwise_ from "./bitwise";
import * as array_ from "./array";
import * as value_ from "./value";
import * as bls_ from "./bls";

const BUILTINS: Partial<Record<DefaultFunction, BuiltinFn>> = {
  ...arithmetic.builtins,
  ...bytestring.builtins,
  ...string_.builtins,
  ...data_.builtins,
  ...list_.builtins,
  ...pair_.builtins,
  ...control_.builtins,
  ...crypto_.builtins,
  ...bitwise_.builtins,
  ...array_.builtins,
  ...value_.builtins,
  ...bls_.builtins,
};

export function callBuiltinImpl(func: DefaultFunction, args: Value[]): Value {
  const fn = BUILTINS[func];
  if (fn === undefined) {
    throw new EvaluationError(`builtin not implemented: ${func}`);
  }
  return fn(args);
}
