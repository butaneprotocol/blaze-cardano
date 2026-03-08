import type { DeBruijn, Name, Program, Term } from "./types";

export class ConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConvertError";
  }
}

class BiMap {
  private uniqueToLevel = new Map<number, number>();
  private levelToUnique = new Map<number, number>();

  insert(unique: number, level: number): void {
    this.uniqueToLevel.set(unique, level);
    this.levelToUnique.set(level, unique);
  }

  remove(unique: number): void {
    const level = this.uniqueToLevel.get(unique);
    if (level !== undefined) {
      this.levelToUnique.delete(level);
    }
    this.uniqueToLevel.delete(unique);
  }

  getLevel(unique: number): number | undefined {
    return this.uniqueToLevel.get(unique);
  }
}

class Converter {
  private currentLevel = 0;
  private levels: BiMap[] = [new BiMap()];

  convertProgram(program: Program<Name>): Program<DeBruijn> {
    return {
      version: program.version,
      term: this.convertTerm(program.term),
    };
  }

  private convertTerm(term: Term<Name>): Term<DeBruijn> {
    switch (term.tag) {
      case "var":
        return { tag: "var", name: { index: this.getIndex(term.name.unique) } };

      case "lambda": {
        this.declareUnique(term.parameter.unique);
        const paramIndex = this.getIndex(term.parameter.unique);
        this.startScope();
        const body = this.convertTerm(term.body);
        this.endScope();
        this.removeUnique(term.parameter.unique);
        return {
          tag: "lambda",
          parameter: { index: paramIndex },
          body,
        };
      }

      case "apply":
        return {
          tag: "apply",
          function: this.convertTerm(term.function),
          argument: this.convertTerm(term.argument),
        };

      case "delay":
        return { tag: "delay", term: this.convertTerm(term.term) };

      case "force":
        return { tag: "force", term: this.convertTerm(term.term) };

      case "constr":
        return {
          tag: "constr",
          index: term.index,
          fields: term.fields.map((f) => this.convertTerm(f)),
        };

      case "case":
        return {
          tag: "case",
          constr: this.convertTerm(term.constr),
          branches: term.branches.map((b) => this.convertTerm(b)),
        };

      case "constant":
        return term;

      case "builtin":
        return term;

      case "error":
        return term;
    }
  }

  private declareUnique(unique: number): void {
    this.levels[this.currentLevel]!.insert(unique, this.currentLevel);
  }

  private removeUnique(unique: number): void {
    this.levels[this.currentLevel]!.remove(unique);
  }

  private startScope(): void {
    this.currentLevel++;
    this.levels.push(new BiMap());
  }

  private endScope(): void {
    this.currentLevel--;
    this.levels.pop();
  }

  private getIndex(unique: number): number {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      const level = this.levels[i]!.getLevel(unique);
      if (level !== undefined) {
        return this.currentLevel - level;
      }
    }
    throw new ConvertError(`free unique ${unique}`);
  }
}

export function nameToDeBruijn(program: Program<Name>): Program<DeBruijn> {
  return new Converter().convertProgram(program);
}
