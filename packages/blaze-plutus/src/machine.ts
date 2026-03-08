import type { DeBruijn, ExBudget, Program, Term } from "./types";
import { zeroBudget } from "./types";

export class EvaluationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvaluationError";
  }
}

export class CekMachine {
  private _consumedBudget: ExBudget = zeroBudget();

  get consumedBudget(): ExBudget {
    return this._consumedBudget;
  }

  run(_program: Program<DeBruijn>): Term<DeBruijn> {
    throw new EvaluationError("CekMachine.run: not implemented");
  }
}
