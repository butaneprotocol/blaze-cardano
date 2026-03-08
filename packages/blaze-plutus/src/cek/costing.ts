// Cost model types and evaluation functions for builtin operations.
// Implements the cost model algebra used to calculate execution budgets.
// Ported from plutuz/src/cek/costing.zig.

const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function satAdd(a: number, b: number): number {
  const r = a + b;
  return r > MAX_SAFE ? MAX_SAFE : r;
}

function satMul(a: number, b: number): number {
  const r = a * b;
  return r > MAX_SAFE ? MAX_SAFE : r;
}

// --- Primitive cost functions ---

export interface LinearSize {
  readonly intercept: number;
  readonly slope: number;
}

function linearCost(l: LinearSize, x: number): number {
  return satAdd(l.intercept, satMul(l.slope, x));
}

export interface OneVariableQuadratic {
  readonly coeff0: number;
  readonly coeff1: number;
  readonly coeff2: number;
}

function quadraticCost(q: OneVariableQuadratic, x: number): number {
  return satAdd(
    satAdd(q.coeff0, satMul(q.coeff1, x)),
    satMul(q.coeff2, satMul(x, x)),
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
  x: number,
  y: number,
): number {
  const raw = satAdd(
    satAdd(
      satAdd(q.coeff00, satMul(q.coeff10, x)),
      satAdd(satMul(q.coeff01, y), satMul(q.coeff20, satMul(x, x))),
    ),
    satAdd(satMul(q.coeff11, satMul(x, y)), satMul(q.coeff02, satMul(y, y))),
  );
  return Math.max(q.minimum, raw);
}

// --- One-argument cost models ---

export type OneArgCost =
  | { tag: "constant"; value: number }
  | { tag: "linear"; model: LinearSize }
  | { tag: "quadratic"; model: OneVariableQuadratic };

function evalOneArg(model: OneArgCost, x: number): number {
  switch (model.tag) {
    case "constant":
      return model.value;
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

function evalTwoArg(model: TwoArgCost, x: number, y: number): number {
  switch (model.tag) {
    case "constant":
      return model.value;
    case "linear_in_x":
      return linearCost(model.model, x);
    case "linear_in_y":
      return linearCost(model.model, y);
    case "added_sizes":
      return linearCost(model.model, satAdd(x, y));
    case "subtracted_sizes":
      return Math.max(
        model.minimum,
        satAdd(model.intercept, satMul(model.slope, x - y)),
      );
    case "multiplied_sizes":
      return linearCost(model.model, satMul(x, y));
    case "min_size":
      return linearCost(model.model, Math.min(x, y));
    case "max_size":
      return linearCost(model.model, Math.max(x, y));
    case "linear_on_diagonal":
      return x === y
        ? satAdd(model.intercept, satMul(model.slope, x))
        : model.constant;
    case "quadratic_in_y":
      return quadraticCost(model.model, y);
    case "const_above_diagonal":
      return x < y ? model.constant : twoVarQuadraticCost(model.model, x, y);
    case "const_below_diagonal":
      return x > y ? model.constant : twoVarQuadraticCost(model.model, x, y);
    case "with_interaction":
      return satAdd(
        satAdd(model.c00, satMul(model.c10, x)),
        satAdd(satMul(model.c01, y), satMul(model.c11, satMul(x, y))),
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
  x: number,
  y: number,
  z: number,
): number {
  switch (model.tag) {
    case "constant":
      return model.value;
    case "linear_in_x":
      return linearCost(model.model, x);
    case "linear_in_y":
      return linearCost(model.model, y);
    case "linear_in_z":
      return linearCost(model.model, z);
    case "quadratic_in_z":
      return quadraticCost(model.model, z);
    case "literal_in_y_or_linear_in_z":
      return Math.max(y, linearCost(model.model, z));
    case "linear_in_y_and_z":
      return satAdd(
        model.intercept,
        satAdd(satMul(model.slopeY, y), satMul(model.slopeZ, z)),
      );
    case "linear_in_max_yz":
      return linearCost(model.model, Math.max(y, z));
    case "exp_mod": {
      const yz = satMul(y, z);
      const base = satAdd(
        model.coeff00,
        satAdd(satMul(model.coeff11, yz), satMul(model.coeff12, satMul(yz, z))),
      );
      return x > z ? satAdd(base, Math.floor(base / 2)) : base;
    }
  }
}

// --- Six-argument cost models ---

export type SixArgCost = { tag: "constant"; value: number };

function evalSixArg(model: SixArgCost): number {
  return model.value;
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
  sizes: number[],
): { cpu: number; mem: number } {
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
