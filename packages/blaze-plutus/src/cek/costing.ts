// Cost model types and evaluation functions for builtin operations.
// Implements the cost model algebra used to calculate execution budgets.
// Ported from plutuz/src/cek/costing.zig.

import { I64_MAX } from "../types";

function satAdd(a: bigint, b: bigint): bigint {
  const r = a + b;
  return r > I64_MAX ? I64_MAX : r;
}

function satMul(a: bigint, b: bigint): bigint {
  const r = a * b;
  return r > I64_MAX ? I64_MAX : r;
}

function bigMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

function bigMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

// --- Primitive cost functions ---

export interface LinearSize {
  readonly intercept: number;
  readonly slope: number;
}

function linearCost(l: LinearSize, x: bigint): bigint {
  return satAdd(BigInt(l.intercept), satMul(BigInt(l.slope), x));
}

export interface OneVariableQuadratic {
  readonly coeff0: number;
  readonly coeff1: number;
  readonly coeff2: number;
}

function quadraticCost(q: OneVariableQuadratic, x: bigint): bigint {
  return satAdd(
    satAdd(BigInt(q.coeff0), satMul(BigInt(q.coeff1), x)),
    satMul(BigInt(q.coeff2), satMul(x, x)),
  );
}

export interface TwoVariableQuadratic {
  readonly minimum: number;
  readonly coeff00: number;
  readonly coeff10: number;
  readonly coeff01: number;
  readonly coeff20: number;
  readonly coeff11: number;
  readonly coeff02: number;
}

function twoVarQuadraticCost(
  q: TwoVariableQuadratic,
  x: bigint,
  y: bigint,
): bigint {
  const raw = satAdd(
    satAdd(
      satAdd(BigInt(q.coeff00), satMul(BigInt(q.coeff10), x)),
      satAdd(satMul(BigInt(q.coeff01), y), satMul(BigInt(q.coeff20), satMul(x, x))),
    ),
    satAdd(satMul(BigInt(q.coeff11), satMul(x, y)), satMul(BigInt(q.coeff02), satMul(y, y))),
  );
  return bigMax(BigInt(q.minimum), raw);
}

// --- One-argument cost models ---

export type OneArgCost =
  | { tag: "constant"; value: number }
  | { tag: "linear"; model: LinearSize }
  | { tag: "quadratic"; model: OneVariableQuadratic };

function evalOneArg(model: OneArgCost, x: bigint): bigint {
  switch (model.tag) {
    case "constant":
      return BigInt(model.value);
    case "linear":
      return linearCost(model.model, x);
    case "quadratic":
      return quadraticCost(model.model, x);
  }
}

// --- Two-argument cost models ---

export type TwoArgCost =
  | { tag: "constant"; value: number }
  | { tag: "linear_in_x"; model: LinearSize }
  | { tag: "linear_in_y"; model: LinearSize }
  | { tag: "added_sizes"; model: LinearSize }
  | {
      tag: "subtracted_sizes";
      intercept: number;
      slope: number;
      minimum: number;
    }
  | { tag: "multiplied_sizes"; model: LinearSize }
  | { tag: "min_size"; model: LinearSize }
  | { tag: "max_size"; model: LinearSize }
  | {
      tag: "linear_on_diagonal";
      intercept: number;
      slope: number;
      constant: number;
    }
  | { tag: "quadratic_in_y"; model: OneVariableQuadratic }
  | {
      tag: "const_above_diagonal";
      constant: number;
      model: TwoVariableQuadratic;
    }
  | {
      tag: "const_below_diagonal";
      constant: number;
      model: TwoVariableQuadratic;
    }
  | {
      tag: "with_interaction";
      c00: number;
      c10: number;
      c01: number;
      c11: number;
    };

function evalTwoArg(model: TwoArgCost, x: bigint, y: bigint): bigint {
  switch (model.tag) {
    case "constant":
      return BigInt(model.value);
    case "linear_in_x":
      return linearCost(model.model, x);
    case "linear_in_y":
      return linearCost(model.model, y);
    case "added_sizes":
      return linearCost(model.model, satAdd(x, y));
    case "subtracted_sizes":
      return bigMax(
        BigInt(model.minimum),
        satAdd(BigInt(model.intercept), satMul(BigInt(model.slope), x - y)),
      );
    case "multiplied_sizes":
      return linearCost(model.model, satMul(x, y));
    case "min_size":
      return linearCost(model.model, bigMin(x, y));
    case "max_size":
      return linearCost(model.model, bigMax(x, y));
    case "linear_on_diagonal":
      return x === y
        ? satAdd(BigInt(model.intercept), satMul(BigInt(model.slope), x))
        : BigInt(model.constant);
    case "quadratic_in_y":
      return quadraticCost(model.model, y);
    case "const_above_diagonal":
      return x < y ? BigInt(model.constant) : twoVarQuadraticCost(model.model, x, y);
    case "const_below_diagonal":
      return x > y ? BigInt(model.constant) : twoVarQuadraticCost(model.model, x, y);
    case "with_interaction":
      return satAdd(
        satAdd(BigInt(model.c00), satMul(BigInt(model.c10), x)),
        satAdd(satMul(BigInt(model.c01), y), satMul(BigInt(model.c11), satMul(x, y))),
      );
  }
}

// --- Three-argument cost models ---

export type ThreeArgCost =
  | { tag: "constant"; value: number }
  | { tag: "linear_in_x"; model: LinearSize }
  | { tag: "linear_in_y"; model: LinearSize }
  | { tag: "linear_in_z"; model: LinearSize }
  | { tag: "quadratic_in_z"; model: OneVariableQuadratic }
  | { tag: "literal_in_y_or_linear_in_z"; model: LinearSize }
  | {
      tag: "linear_in_y_and_z";
      intercept: number;
      slopeY: number;
      slopeZ: number;
    }
  | { tag: "linear_in_max_yz"; model: LinearSize }
  | { tag: "exp_mod"; coeff00: number; coeff11: number; coeff12: number };

function evalThreeArg(
  model: ThreeArgCost,
  x: bigint,
  y: bigint,
  z: bigint,
): bigint {
  switch (model.tag) {
    case "constant":
      return BigInt(model.value);
    case "linear_in_x":
      return linearCost(model.model, x);
    case "linear_in_y":
      return linearCost(model.model, y);
    case "linear_in_z":
      return linearCost(model.model, z);
    case "quadratic_in_z":
      return quadraticCost(model.model, z);
    case "literal_in_y_or_linear_in_z":
      return bigMax(y, linearCost(model.model, z));
    case "linear_in_y_and_z":
      return satAdd(
        BigInt(model.intercept),
        satAdd(satMul(BigInt(model.slopeY), y), satMul(BigInt(model.slopeZ), z)),
      );
    case "linear_in_max_yz":
      return linearCost(model.model, bigMax(y, z));
    case "exp_mod": {
      const yz = satMul(y, z);
      const base = satAdd(
        BigInt(model.coeff00),
        satAdd(satMul(BigInt(model.coeff11), yz), satMul(BigInt(model.coeff12), satMul(yz, z))),
      );
      return x > z ? satAdd(base, base / 2n) : base;
    }
  }
}

// --- Six-argument cost models ---

export type SixArgCost = { tag: "constant"; value: number };

function evalSixArg(model: SixArgCost): bigint {
  return BigInt(model.value);
}

// --- CostingFun and BuiltinCostModel ---

export interface CostingFun<T> {
  readonly mem: T;
  readonly cpu: T;
}

export type BuiltinCostModel =
  | { arity: "one"; fun: CostingFun<OneArgCost> }
  | { arity: "two"; fun: CostingFun<TwoArgCost> }
  | { arity: "three"; fun: CostingFun<ThreeArgCost> }
  | { arity: "six"; fun: CostingFun<SixArgCost> };

export function evalBuiltinCost(
  model: BuiltinCostModel,
  sizes: bigint[],
): { cpu: bigint; mem: bigint } {
  switch (model.arity) {
    case "one":
      return {
        cpu: evalOneArg(model.fun.cpu, sizes[0]!),
        mem: evalOneArg(model.fun.mem, sizes[0]!),
      };
    case "two":
      return {
        cpu: evalTwoArg(model.fun.cpu, sizes[0]!, sizes[1]!),
        mem: evalTwoArg(model.fun.mem, sizes[0]!, sizes[1]!),
      };
    case "three":
      return {
        cpu: evalThreeArg(model.fun.cpu, sizes[0]!, sizes[1]!, sizes[2]!),
        mem: evalThreeArg(model.fun.mem, sizes[0]!, sizes[1]!, sizes[2]!),
      };
    case "six":
      return {
        cpu: evalSixArg(model.fun.cpu),
        mem: evalSixArg(model.fun.mem),
      };
  }
}
