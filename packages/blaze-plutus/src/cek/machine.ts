import type {
  Constant,
  DeBruijn,
  DefaultFunction,
  ExBudget,
  Term,
} from "../types";
import {
  defaultFunctionArity,
  defaultFunctionForceCount,
  unlimitedBudget,
  I64_MAX,
} from "../types";
import type { Value } from "./value";
import { extendEnv, lookupEnv } from "./value";
import type { Env } from "./value";
import type { Context } from "./context";
import { transferArgStack } from "./context";
import { dischargeValue } from "./discharge";
import type { BuiltinCostModel } from "./costing";
import { evalBuiltinCost } from "./costing";
import { DEFAULT_BUILTIN_COSTS } from "./costs";
import { computeArgSizes } from "./exmem";
import { EvaluationError } from "./error";
import { callBuiltinImpl } from "./builtins";

export { EvaluationError } from "./error";

// --- Step kinds (indices into unbudgetedSteps) ---

const STEP_CONSTANT = 0;
const STEP_VAR = 1;
const STEP_LAMBDA = 2;
const STEP_APPLY = 3;
const STEP_DELAY = 4;
const STEP_FORCE = 5;
const STEP_BUILTIN = 6;
const STEP_CONSTR = 7;
const STEP_CASE = 8;
const STEP_COUNT = 9; // total accumulated count at index 9

const SLIPPAGE = 200;

// --- Machine costs: ExBudget per step kind ---

const MACHINE_COSTS: ExBudget[] = [
  /* constant */ { cpu: 16000n, mem: 100n },
  /* var      */ { cpu: 16000n, mem: 100n },
  /* lambda   */ { cpu: 16000n, mem: 100n },
  /* apply    */ { cpu: 16000n, mem: 100n },
  /* delay    */ { cpu: 16000n, mem: 100n },
  /* force    */ { cpu: 16000n, mem: 100n },
  /* builtin  */ { cpu: 16000n, mem: 100n },
  /* constr   */ { cpu: 16000n, mem: 100n },
  /* case     */ { cpu: 16000n, mem: 100n },
];

const STARTUP_COST: ExBudget = { cpu: 100n, mem: 100n };

export class CekMachine {
  private static readonly I64_MIN = -9223372036854775808n;

  private budget: ExBudget;
  private restricting: boolean;
  private unbudgetedSteps: Uint32Array;
  private builtinCosts: Record<DefaultFunction, BuiltinCostModel>;

  constructor(
    initialBudget?: ExBudget,
    builtinCosts?: Record<DefaultFunction, BuiltinCostModel>,
  ) {
    const initial = initialBudget ?? unlimitedBudget();
    this.budget = { cpu: initial.cpu, mem: initial.mem };
    this.restricting = initial.cpu !== I64_MAX || initial.mem !== I64_MAX;
    this.unbudgetedSteps = new Uint32Array(STEP_COUNT + 1);
    this.builtinCosts = builtinCosts ?? DEFAULT_BUILTIN_COSTS;
  }

  get remainingBudget(): ExBudget {
    this.spendUnbudgetedSteps();
    return this.budget;
  }

  run(term: Term<DeBruijn>): Term<DeBruijn> {
    this.spendBudget(STARTUP_COST);
    let state: MachineState = {
      tag: "compute",
      ctx: { tag: "no_frame" },
      env: null,
      term,
    };

    for (;;) {
      switch (state.tag) {
        case "compute":
          state = this.compute(state.ctx, state.env, state.term);
          break;
        case "return":
          state = this.returnCompute(state.ctx, state.value);
          break;
        case "done":
          this.spendUnbudgetedSteps();
          return state.term;
      }
    }
  }

  private stepAndMaybeSpend(step: number): void {
    this.unbudgetedSteps[step]! += 1;
    this.unbudgetedSteps[STEP_COUNT]! += 1;
    if (this.unbudgetedSteps[STEP_COUNT]! >= SLIPPAGE) {
      this.spendUnbudgetedSteps();
    }
  }

  private spendBudget(cost: ExBudget): void {
    let cpu = this.budget.cpu - cost.cpu;
    let mem = this.budget.mem - cost.mem;
    if (cpu < CekMachine.I64_MIN) cpu = CekMachine.I64_MIN;
    if (mem < CekMachine.I64_MIN) mem = CekMachine.I64_MIN;
    this.budget = { cpu, mem };
    if (this.restricting && (cpu < 0n || mem < 0n)) {
      throw new EvaluationError("out of budget");
    }
  }

  private spendUnbudgetedSteps(): void {
    let cpu = 0n;
    let mem = 0n;
    for (let i = 0; i < STEP_COUNT; i++) {
      const count = this.unbudgetedSteps[i]!;
      if (count > 0) {
        const cost = MACHINE_COSTS[i]!;
        cpu += BigInt(count) * cost.cpu;
        mem += BigInt(count) * cost.mem;
        this.unbudgetedSteps[i] = 0;
      }
    }
    this.unbudgetedSteps[STEP_COUNT] = 0;
    this.spendBudget({ cpu, mem });
  }

  private compute(ctx: Context, env: Env, term: Term<DeBruijn>): MachineState {
    switch (term.tag) {
      case "var": {
        this.stepAndMaybeSpend(STEP_VAR);
        const value = lookupEnv(env, term.name.index);
        if (value === undefined) {
          throw new EvaluationError(
            `unbound variable: index ${term.name.index}`,
          );
        }
        return { tag: "return", ctx, value };
      }

      case "constant":
        this.stepAndMaybeSpend(STEP_CONSTANT);
        return {
          tag: "return",
          ctx,
          value: { tag: "constant", value: term.value },
        };

      case "lambda":
        this.stepAndMaybeSpend(STEP_LAMBDA);
        return {
          tag: "return",
          ctx,
          value: {
            tag: "lambda",
            parameter: term.parameter,
            body: term.body,
            env,
          },
        };

      case "delay":
        this.stepAndMaybeSpend(STEP_DELAY);
        return {
          tag: "return",
          ctx,
          value: { tag: "delay", body: term.term, env },
        };

      case "force":
        this.stepAndMaybeSpend(STEP_FORCE);
        return {
          tag: "compute",
          ctx: { tag: "frame_force", ctx },
          env,
          term: term.term,
        };

      case "apply":
        this.stepAndMaybeSpend(STEP_APPLY);
        return {
          tag: "compute",
          ctx: {
            tag: "frame_await_fun_term",
            env,
            term: term.argument,
            ctx,
          },
          env,
          term: term.function,
        };

      case "builtin":
        this.stepAndMaybeSpend(STEP_BUILTIN);
        return {
          tag: "return",
          ctx,
          value: {
            tag: "builtin",
            func: term.function,
            forces: 0,
            args: [],
          },
        };

      case "constr": {
        this.stepAndMaybeSpend(STEP_CONSTR);
        if (term.fields.length === 0) {
          return {
            tag: "return",
            ctx,
            value: { tag: "constr", index: term.index, fields: [] },
          };
        }
        const [first, ...rest] = term.fields;
        return {
          tag: "compute",
          ctx: {
            tag: "frame_constr",
            env,
            index: term.index,
            fields: rest,
            resolved: [],
            ctx,
          },
          env,
          term: first!,
        };
      }

      case "case":
        this.stepAndMaybeSpend(STEP_CASE);
        return {
          tag: "compute",
          ctx: {
            tag: "frame_cases",
            env,
            branches: term.branches,
            ctx,
          },
          env,
          term: term.constr,
        };

      case "error":
        throw new EvaluationError("ExplicitErrorTerm");
    }
  }

  private returnCompute(ctx: Context, value: Value): MachineState {
    switch (ctx.tag) {
      case "no_frame":
        return { tag: "done", term: dischargeValue(value) };

      case "frame_await_fun_term":
        return {
          tag: "compute",
          ctx: { tag: "frame_await_arg", value, ctx: ctx.ctx },
          env: ctx.env,
          term: ctx.term,
        };

      case "frame_await_arg":
        return this.applyEvaluate(ctx.ctx, ctx.value, value);

      case "frame_await_fun_value":
        return this.applyEvaluate(ctx.ctx, value, ctx.value);

      case "frame_force":
        return this.forceEvaluate(ctx.ctx, value);

      case "frame_constr": {
        const resolved = [...ctx.resolved, value];
        if (ctx.fields.length === 0) {
          return {
            tag: "return",
            ctx: ctx.ctx,
            value: { tag: "constr", index: ctx.index, fields: resolved },
          };
        }
        const [next, ...rest] = ctx.fields;
        return {
          tag: "compute",
          ctx: {
            tag: "frame_constr",
            env: ctx.env,
            index: ctx.index,
            fields: rest,
            resolved,
            ctx: ctx.ctx,
          },
          env: ctx.env,
          term: next!,
        };
      }

      case "frame_cases": {
        let tag: number;
        let fields: Value[];
        if (value.tag === "constr") {
          tag = value.index;
          fields = value.fields;
        } else if (value.tag === "constant") {
          ({ tag, fields } = constantToConstr(
            value.value,
            ctx.branches.length,
          ));
        } else {
          throw new EvaluationError(
            `case: expected constr or constant value, got ${value.tag}`,
          );
        }
        if (tag < 0 || tag >= ctx.branches.length) {
          throw new EvaluationError(
            `case: constructor tag ${tag} out of range (${ctx.branches.length} branches)`,
          );
        }
        const newCtx = transferArgStack(fields, ctx.ctx);
        return {
          tag: "compute",
          ctx: newCtx,
          env: ctx.env,
          term: ctx.branches[tag]!,
        };
      }
    }
  }

  private applyEvaluate(ctx: Context, fun: Value, arg: Value): MachineState {
    switch (fun.tag) {
      case "lambda":
        return {
          tag: "compute",
          ctx,
          env: extendEnv(fun.env, arg),
          term: fun.body,
        };

      case "builtin": {
        const expectedForces = defaultFunctionForceCount(fun.func);
        const expectedArity = defaultFunctionArity(fun.func);
        if (fun.forces < expectedForces) {
          throw new EvaluationError(
            `builtin ${fun.func}: expected ${expectedForces} force(s), got ${fun.forces}`,
          );
        }
        const newArgs = [...fun.args, arg];
        if (newArgs.length === expectedArity) {
          const result = this.callBuiltin(fun.func, newArgs);
          return { tag: "return", ctx, value: result };
        }
        return {
          tag: "return",
          ctx,
          value: {
            tag: "builtin",
            func: fun.func,
            forces: fun.forces,
            args: newArgs,
          },
        };
      }

      default:
        throw new EvaluationError(
          `NonFunctionalApplication: cannot apply ${fun.tag}`,
        );
    }
  }

  private forceEvaluate(ctx: Context, value: Value): MachineState {
    switch (value.tag) {
      case "delay":
        return {
          tag: "compute",
          ctx,
          env: value.env,
          term: value.body,
        };

      case "builtin": {
        const expectedForces = defaultFunctionForceCount(value.func);
        if (value.forces >= expectedForces) {
          throw new EvaluationError(
            `builtin ${value.func}: too many forces (expected ${expectedForces})`,
          );
        }
        const newForces = value.forces + 1;
        const expectedArity = defaultFunctionArity(value.func);
        if (newForces === expectedForces && expectedArity === 0) {
          const result = this.callBuiltin(value.func, []);
          return { tag: "return", ctx, value: result };
        }
        return {
          tag: "return",
          ctx,
          value: {
            tag: "builtin",
            func: value.func,
            forces: newForces,
            args: value.args,
          },
        };
      }

      default:
        throw new EvaluationError(
          `NonPolymorphicInstantiation: cannot force ${value.tag}`,
        );
    }
  }

  private callBuiltin(func: DefaultFunction, args: Value[]): Value {
    const sizes = computeArgSizes(func, args);
    const model = this.builtinCosts[func];
    const cost = evalBuiltinCost(model, sizes);
    this.spendBudget(cost);
    return callBuiltinImpl(func, args);
  }
}

// --- Machine state (internal) ---

type MachineState =
  | { tag: "compute"; ctx: Context; env: Env; term: Term<DeBruijn> }
  | { tag: "return"; ctx: Context; value: Value }
  | { tag: "done"; term: Term<DeBruijn> };

// --- Constant case decomposition (UPLC 1.1.0) ---

function constantToConstr(
  c: Constant,
  numBranches: number,
): { tag: number; fields: Value[] } {
  switch (c.type) {
    case "integer": {
      const n = c.value;
      if (n < 0n) {
        throw new EvaluationError("case: negative integer tag");
      }
      if (n > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new EvaluationError("case: integer tag too large");
      }
      return { tag: Number(n), fields: [] };
    }
    case "bool":
      if (numBranches > 2) {
        throw new EvaluationError(
          `case: bool expects at most 2 branches, got ${numBranches}`,
        );
      }
      return { tag: c.value ? 1 : 0, fields: [] };
    case "unit":
      if (numBranches > 1) {
        throw new EvaluationError(
          `case: unit expects at most 1 branch, got ${numBranches}`,
        );
      }
      return { tag: 0, fields: [] };
    case "pair":
      if (numBranches > 1) {
        throw new EvaluationError(
          `case: pair expects at most 1 branch, got ${numBranches}`,
        );
      }
      return {
        tag: 0,
        fields: [
          { tag: "constant", value: c.first },
          { tag: "constant", value: c.second },
        ],
      };
    case "list":
      if (numBranches > 2) {
        throw new EvaluationError(
          `case: list expects at most 2 branches, got ${numBranches}`,
        );
      }
      if (c.values.length === 0) {
        return { tag: 1, fields: [] };
      }
      return {
        tag: 0,
        fields: [
          { tag: "constant", value: c.values[0]! },
          {
            tag: "constant",
            value: {
              type: "list",
              itemType: c.itemType,
              values: c.values.slice(1),
            },
          },
        ],
      };
    default:
      throw new EvaluationError(
        `case: cannot case on constant of type ${c.type}`,
      );
  }
}
