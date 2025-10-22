/* eslint-disable */
// @ts-nocheck
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";
import { type Script } from "@blaze-cardano/core";
import { Type, Exact, TPlutusData } from "@blaze-cardano/data";
import { type PlutusData } from "@blaze-cardano/core";
type Data = PlutusData;
type Int = bigint;
type ByteArray = string;
type OutputReference = { output_index: bigint; transaction_id: string };

const Contracts = Type.Module({
});


export class AlwaysTrueScriptVote {
  public Script: Script
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    this.Script = cborToScript(
      applyParamsToScript(
        "587f0101002229800aba2aba1aab9eaab9dab9a9bad0039bae0024888888966002646465300130073754003300900398048012444b30013370e9004001c4c928980618059baa0048acc004cdc3a401400713233224a26eb4c034004c034c038004c02cdd5002459009201218041804800980400098029baa0088a4d13656400c01",
        Type.Tuple([
          Type.BigInt(),
          Type.String(),
        ]),
        [
          _param1,
          _param2,
        ],
      ),
      "PlutusV3"
    );
  }
}
export class AlwaysTrueScriptPropose {
  public Script: Script
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    this.Script = cborToScript(
      applyParamsToScript(
        "587f0101002229800aba2aba1aab9eaab9dab9a9bad0039bae0024888888966002646465300130073754003300900398048012444b30013370e9004001c4c928980618059baa0048acc004cdc3a401400713233224a26eb4c034004c034c038004c02cdd5002459009201218041804800980400098029baa0088a4d13656400c01",
        Type.Tuple([
          Type.BigInt(),
          Type.String(),
        ]),
        [
          _param1,
          _param2,
        ],
      ),
      "PlutusV3"
    );
  }
}
export class AlwaysTrueScriptElse {
  public Script: Script
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    this.Script = cborToScript(
      applyParamsToScript(
        "587f0101002229800aba2aba1aab9eaab9dab9a9bad0039bae0024888888966002646465300130073754003300900398048012444b30013370e9004001c4c928980618059baa0048acc004cdc3a401400713233224a26eb4c034004c034c038004c02cdd5002459009201218041804800980400098029baa0088a4d13656400c01",
        Type.Tuple([
          Type.BigInt(),
          Type.String(),
        ]),
        [
          _param1,
          _param2,
        ],
      ),
      "PlutusV3"
    );
  }
}