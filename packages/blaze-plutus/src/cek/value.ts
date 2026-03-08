import type { Constant, DeBruijn, DefaultFunction, Term } from "../types";

// --- CEK Value types ---

export type Value =
  | VConstant
  | VLambda
  | VDelay
  | VBuiltin
  | VConstr;

export interface VConstant {
  readonly tag: "constant";
  readonly value: Constant;
}

export interface VLambda {
  readonly tag: "lambda";
  readonly parameter: DeBruijn;
  readonly body: Term<DeBruijn>;
  readonly env: Env;
}

export interface VDelay {
  readonly tag: "delay";
  readonly body: Term<DeBruijn>;
  readonly env: Env;
}

export interface VBuiltin {
  readonly tag: "builtin";
  readonly func: DefaultFunction;
  readonly forces: number;
  readonly args: Value[];
}

export interface VConstr {
  readonly tag: "constr";
  readonly index: number;
  readonly fields: Value[];
}

// --- Environment (linked list, 1-based DeBruijn lookup) ---

export type Env = { data: Value; next: Env } | null;

export function lookupEnv(env: Env, index: number): Value | undefined {
  let current = env;
  let i = index;
  while (current !== null) {
    if (i === 1) return current.data;
    i--;
    current = current.next;
  }
  return undefined;
}

export function extendEnv(env: Env, value: Value): Env {
  return { data: value, next: env };
}
