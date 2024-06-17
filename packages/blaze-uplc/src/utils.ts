import { type PlutusData } from "@blaze-cardano/core";
import { UPLCDecoder } from "./decoder";
import { TermNames } from "./types";

export function applyParams(hex: string, ...params: PlutusData[]) {
  // todo: cbor decoder
  const ast = UPLCDecoder.fromHex(hex).decode();
  for (const param of params) {
    const newBody = {
      type: TermNames["apply"],
      function: ast.body,
      argument: { type: TermNames["const"], value: param.toCore() },
    };
    ast.body = newBody;
  }
  // todo: encode back
}
