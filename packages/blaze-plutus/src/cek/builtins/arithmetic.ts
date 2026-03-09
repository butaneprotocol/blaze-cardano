import type { DefaultFunction } from "../../types";
import type { Value } from "../value";
import { EvaluationError } from "../error";
import {
  type BuiltinFn,
  unwrapInteger,
  integerResult,
  boolResult,
} from "./helpers";

// --- Simple arithmetic ---

function addInteger(args: Value[]): Value {
  return integerResult(unwrapInteger(args[0]!) + unwrapInteger(args[1]!));
}

function subtractInteger(args: Value[]): Value {
  return integerResult(unwrapInteger(args[0]!) - unwrapInteger(args[1]!));
}

function multiplyInteger(args: Value[]): Value {
  return integerResult(unwrapInteger(args[0]!) * unwrapInteger(args[1]!));
}

function quotientInteger(args: Value[]): Value {
  const a = unwrapInteger(args[0]!);
  const b = unwrapInteger(args[1]!);
  if (b === 0n) throw new EvaluationError("division by zero");
  return integerResult(a / b);
}

function remainderInteger(args: Value[]): Value {
  const a = unwrapInteger(args[0]!);
  const b = unwrapInteger(args[1]!);
  if (b === 0n) throw new EvaluationError("division by zero");
  return integerResult(a % b);
}

// --- Floor division/mod ---

function divideInteger(args: Value[]): Value {
  const a = unwrapInteger(args[0]!);
  const b = unwrapInteger(args[1]!);
  if (b === 0n) throw new EvaluationError("division by zero");
  const q = a / b;
  const r = a % b;
  if (r !== 0n && (a < 0n) !== (b < 0n)) {
    return integerResult(q - 1n);
  }
  return integerResult(q);
}

function modInteger(args: Value[]): Value {
  const a = unwrapInteger(args[0]!);
  const b = unwrapInteger(args[1]!);
  if (b === 0n) throw new EvaluationError("division by zero");
  const r = a % b;
  if (r !== 0n && (a < 0n) !== (b < 0n)) {
    return integerResult(r + b);
  }
  return integerResult(r);
}

// --- Comparisons ---

function equalsInteger(args: Value[]): Value {
  return boolResult(unwrapInteger(args[0]!) === unwrapInteger(args[1]!));
}

function lessThanInteger(args: Value[]): Value {
  return boolResult(unwrapInteger(args[0]!) < unwrapInteger(args[1]!));
}

function lessThanEqualsInteger(args: Value[]): Value {
  return boolResult(unwrapInteger(args[0]!) <= unwrapInteger(args[1]!));
}

// --- expModInteger ---

function bigintMod(a: bigint, m: bigint): bigint {
  const r = a % m;
  return r < 0n ? r + m : r;
}

function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  let result = 1n;
  let b = bigintMod(base, m);
  let e = exp;
  while (e > 0n) {
    if (e & 1n) {
      result = bigintMod(result * b, m);
    }
    e >>= 1n;
    b = bigintMod(b * b, m);
  }
  return result;
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

function modInverse(a: bigint, m: bigint): bigint {
  let old_r = a;
  let r = m;
  let old_s = 1n;
  let s = 0n;

  while (r !== 0n) {
    // floor division
    const q = old_r / r;
    const adj_q =
      old_r % r !== 0n && (old_r < 0n) !== (r < 0n) ? q - 1n : q;

    const temp_r = r;
    r = old_r - adj_q * r;
    old_r = temp_r;

    const temp_s = s;
    s = old_s - adj_q * s;
    old_s = temp_s;
  }

  return bigintMod(old_s, m);
}

function expModInteger(args: Value[]): Value {
  const base = unwrapInteger(args[0]!);
  const exp = unwrapInteger(args[1]!);
  const mod = unwrapInteger(args[2]!);

  if (mod <= 0n) {
    throw new EvaluationError("expModInteger: modulus must be positive");
  }
  if (mod === 1n) return integerResult(0n);
  if (exp === 0n) return integerResult(1n);

  if (exp > 0n) {
    return integerResult(modPow(base, exp, mod));
  }

  // Negative exponent
  if (base === 0n) {
    throw new EvaluationError(
      "expModInteger: zero base with negative exponent",
    );
  }
  const reducedBase = bigintMod(base, mod);
  if (gcd(reducedBase, mod) !== 1n) {
    throw new EvaluationError(
      "expModInteger: base and modulus are not coprime",
    );
  }
  const inv = modInverse(reducedBase, mod);
  return integerResult(modPow(inv, -exp, mod));
}

// --- Export dispatch record ---

export const builtins: Partial<Record<DefaultFunction, BuiltinFn>> = {
  addInteger,
  subtractInteger,
  multiplyInteger,
  divideInteger,
  quotientInteger,
  remainderInteger,
  modInteger,
  equalsInteger,
  lessThanInteger,
  lessThanEqualsInteger,
  expModInteger,
};
