import type { DeBruijn, Name, Program } from "./types";

export class ConvertError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConvertError";
  }
}

export function nameToDeBruijn(_program: Program<Name>): Program<DeBruijn> {
  throw new ConvertError("nameToDeBruijn: not implemented");
}
