import type { DeBruijn, Term } from "../types";
import type { Env, Value } from "./value";

// --- Context / Continuation frames ---

export type Context =
  | NoFrame
  | FrameAwaitArg
  | FrameAwaitFunTerm
  | FrameAwaitFunValue
  | FrameForce
  | FrameConstr
  | FrameCases;

export interface NoFrame {
  readonly tag: "no_frame";
}

export interface FrameAwaitArg {
  readonly tag: "frame_await_arg";
  readonly value: Value;
  readonly ctx: Context;
}

export interface FrameAwaitFunTerm {
  readonly tag: "frame_await_fun_term";
  readonly env: Env;
  readonly term: Term<DeBruijn>;
  readonly ctx: Context;
}

export interface FrameAwaitFunValue {
  readonly tag: "frame_await_fun_value";
  readonly value: Value;
  readonly ctx: Context;
}

export interface FrameForce {
  readonly tag: "frame_force";
  readonly ctx: Context;
}

export interface FrameConstr {
  readonly tag: "frame_constr";
  readonly env: Env;
  readonly index: number;
  readonly fields: ReadonlyArray<Term<DeBruijn>>;
  readonly resolved: Value[];
  readonly ctx: Context;
}

export interface FrameCases {
  readonly tag: "frame_cases";
  readonly env: Env;
  readonly branches: ReadonlyArray<Term<DeBruijn>>;
  readonly ctx: Context;
}

export function transferArgStack(fields: Value[], ctx: Context): Context {
  let c = ctx;
  for (let i = fields.length - 1; i >= 0; i--) {
    c = { tag: "frame_await_fun_value", value: fields[i]!, ctx: c };
  }
  return c;
}
