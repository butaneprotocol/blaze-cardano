import type { DeBruijn, Term } from "../types";
import type { Env, Value } from "./value";

/**
 * Convert a CEK runtime value back to a UPLC term.
 */
export function dischargeValue(value: Value): Term<DeBruijn> {
  switch (value.tag) {
    case "constant":
      return { tag: "constant", value: value.value };

    case "lambda":
      return {
        tag: "lambda",
        parameter: value.parameter,
        body: withEnv(1, value.env, value.body),
      };

    case "delay":
      return {
        tag: "delay",
        term: withEnv(0, value.env, value.body),
      };

    case "builtin": {
      // Start with the bare builtin term
      let term: Term<DeBruijn> = { tag: "builtin", function: value.func };
      // Apply forces
      for (let i = 0; i < value.forces; i++) {
        term = { tag: "force", term };
      }
      // Apply arguments
      for (const arg of value.args) {
        term = { tag: "apply", function: term, argument: dischargeValue(arg) };
      }
      return term;
    }

    case "constr":
      return {
        tag: "constr",
        index: value.index,
        fields: value.fields.map(dischargeValue),
      };
  }
}

/**
 * Substitute environment bindings into a term during discharge.
 *
 * lamCnt tracks how many lambdas we've descended through in the discharged
 * term. For each var: if index <= lamCnt, it's bound by an enclosing lambda
 * in the discharged output — leave it. If index > lamCnt, look up
 * (index - lamCnt) in env and discharge that value.
 */
export function withEnv(
  lamCnt: number,
  env: Env,
  term: Term<DeBruijn>,
): Term<DeBruijn> {
  switch (term.tag) {
    case "var": {
      const idx = term.name.index;
      if (idx <= lamCnt) {
        return term;
      }
      // Look up in environment
      const envIdx = idx - lamCnt;
      let current = env;
      let i = envIdx;
      while (current !== null) {
        if (i === 1) return dischargeValue(current.data);
        i--;
        current = current.next;
      }
      // Unbound — return adjusted var
      return term;
    }

    case "lambda":
      return {
        tag: "lambda",
        parameter: term.parameter,
        body: withEnv(lamCnt + 1, env, term.body),
      };

    case "apply":
      return {
        tag: "apply",
        function: withEnv(lamCnt, env, term.function),
        argument: withEnv(lamCnt, env, term.argument),
      };

    case "delay":
      return {
        tag: "delay",
        term: withEnv(lamCnt, env, term.term),
      };

    case "force":
      return {
        tag: "force",
        term: withEnv(lamCnt, env, term.term),
      };

    case "constr":
      return {
        tag: "constr",
        index: term.index,
        fields: term.fields.map((f) => withEnv(lamCnt, env, f)),
      };

    case "case":
      return {
        tag: "case",
        constr: withEnv(lamCnt, env, term.constr),
        branches: term.branches.map((b) => withEnv(lamCnt, env, b)),
      };

    case "constant":
    case "builtin":
    case "error":
      return term;
  }
}
