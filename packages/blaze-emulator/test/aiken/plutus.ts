/* eslint-disable */
// @ts-nocheck
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";
import { type PlutusData, type Script } from "@blaze-cardano/core";
import { Type, Exact, TPlutusData, serialize } from "@blaze-cardano/data";
import { TypedScript } from "@blaze-cardano/tx";
type Data = Exact<typeof TPlutusData>;
type Int = bigint;
type ByteArray = string;
const PolicyId = Type.String();
type OutputReference = { output_index: bigint; transaction_id: string };

const Contracts = Type.Module({
});
const ContractDefinitions = Contracts.$defs;
const serializeContractData = <T extends PlutusData>(schema, value): T => serialize(schema, value, ContractDefinitions) as T;


type __AlwaysTrueScriptVoteRedeemerData = PlutusData & { readonly __AlwaysTrueScriptVoteRedeemer: "__AlwaysTrueScriptVoteRedeemerData" };
const __AlwaysTrueScriptVoteRedeemerSchema = TPlutusData;
type __AlwaysTrueScriptVoteRedeemerInput = Exact<typeof __AlwaysTrueScriptVoteRedeemerSchema>;

export class AlwaysTrueScriptVote extends TypedScript<PlutusData, __AlwaysTrueScriptVoteRedeemerData> {
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "589f0101002229800aba2aba1aab9eaab9dab9a9bad0039bae0024888888966002646465300130073754003300900398048012444b30013370e9004001c4c928980618059baa0048acc004cdc3a401400713233224a26eb4c034004c034c038004c02cdd5002456600266e1d20060038991991251375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
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
    super(Script, "always_true.script.vote");
  }

  redeemer(value: __AlwaysTrueScriptVoteRedeemerInput): __AlwaysTrueScriptVoteRedeemerData {
    return serializeContractData<__AlwaysTrueScriptVoteRedeemerData>(__AlwaysTrueScriptVoteRedeemerSchema, value);
  }
}
type __AlwaysTrueScriptProposeRedeemerData = PlutusData & { readonly __AlwaysTrueScriptProposeRedeemer: "__AlwaysTrueScriptProposeRedeemerData" };
const __AlwaysTrueScriptProposeRedeemerSchema = TPlutusData;
type __AlwaysTrueScriptProposeRedeemerInput = Exact<typeof __AlwaysTrueScriptProposeRedeemerSchema>;

export class AlwaysTrueScriptPropose extends TypedScript<PlutusData, __AlwaysTrueScriptProposeRedeemerData> {
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "589f0101002229800aba2aba1aab9eaab9dab9a9bad0039bae0024888888966002646465300130073754003300900398048012444b30013370e9004001c4c928980618059baa0048acc004cdc3a401400713233224a26eb4c034004c034c038004c02cdd5002456600266e1d20060038991991251375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
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
    super(Script, "always_true.script.propose");
  }

  redeemer(value: __AlwaysTrueScriptProposeRedeemerInput): __AlwaysTrueScriptProposeRedeemerData {
    return serializeContractData<__AlwaysTrueScriptProposeRedeemerData>(__AlwaysTrueScriptProposeRedeemerSchema, value);
  }
}
type __AlwaysTrueScriptPublishRedeemerData = PlutusData & { readonly __AlwaysTrueScriptPublishRedeemer: "__AlwaysTrueScriptPublishRedeemerData" };
const __AlwaysTrueScriptPublishRedeemerSchema = TPlutusData;
type __AlwaysTrueScriptPublishRedeemerInput = Exact<typeof __AlwaysTrueScriptPublishRedeemerSchema>;

export class AlwaysTrueScriptPublish extends TypedScript<PlutusData, __AlwaysTrueScriptPublishRedeemerData> {
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "589f0101002229800aba2aba1aab9eaab9dab9a9bad0039bae0024888888966002646465300130073754003300900398048012444b30013370e9004001c4c928980618059baa0048acc004cdc3a401400713233224a26eb4c034004c034c038004c02cdd5002456600266e1d20060038991991251375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
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
    super(Script, "always_true.script.publish");
  }

  redeemer(value: __AlwaysTrueScriptPublishRedeemerInput): __AlwaysTrueScriptPublishRedeemerData {
    return serializeContractData<__AlwaysTrueScriptPublishRedeemerData>(__AlwaysTrueScriptPublishRedeemerSchema, value);
  }
}
type __AlwaysTrueScriptElseRedeemerData = PlutusData & { readonly __AlwaysTrueScriptElseRedeemer: "__AlwaysTrueScriptElseRedeemerData" };
const __AlwaysTrueScriptElseRedeemerSchema = TPlutusData;
type __AlwaysTrueScriptElseRedeemerInput = Exact<typeof __AlwaysTrueScriptElseRedeemerSchema>;

export class AlwaysTrueScriptElse extends TypedScript<PlutusData, __AlwaysTrueScriptElseRedeemerData> {
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "589f0101002229800aba2aba1aab9eaab9dab9a9bad0039bae0024888888966002646465300130073754003300900398048012444b30013370e9004001c4c928980618059baa0048acc004cdc3a401400713233224a26eb4c034004c034c038004c02cdd5002456600266e1d20060038991991251375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
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
    super(Script, "always_true.script.else");
  }

  redeemer(value: __AlwaysTrueScriptElseRedeemerInput): __AlwaysTrueScriptElseRedeemerData {
    return serializeContractData<__AlwaysTrueScriptElseRedeemerData>(__AlwaysTrueScriptElseRedeemerSchema, value);
  }
}