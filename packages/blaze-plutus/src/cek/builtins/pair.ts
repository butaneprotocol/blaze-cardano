import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";

type BuiltinFn = (args: Value[]) => Value;

// --- Builtins ---

function fstPair(args: Value[]): Value {
  const val = args[0]!;
  if (val.tag === "constant" && val.value.type === "pair") {
    return { tag: "constant", value: val.value.first };
  }
  throw new EvaluationError(
    `fstPair: expected pair constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

function sndPair(args: Value[]): Value {
  const val = args[0]!;
  if (val.tag === "constant" && val.value.type === "pair") {
    return { tag: "constant", value: val.value.second };
  }
  throw new EvaluationError(
    `sndPair: expected pair constant, got ${val.tag === "constant" ? val.value.type : val.tag}`,
  );
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  fstPair,
  sndPair,
};
