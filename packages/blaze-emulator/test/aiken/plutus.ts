/* eslint-disable */
// @ts-nocheck
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";
import { type PlutusData, type Script } from "@blaze-cardano/core";
import { Type, Exact, TPlutusData, serialize, type TSchema } from "@blaze-cardano/data";
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


export const AlwaysTrueScriptVoteRedeemerSchema = TPlutusData;
export type AlwaysTrueScriptVoteRedeemerInput = Exact<typeof AlwaysTrueScriptVoteRedeemerSchema>;
export type AlwaysTrueScriptVoteRedeemer = PlutusData & { readonly __AlwaysTrueScriptVoteRedeemer: "AlwaysTrueScriptVoteRedeemer" };

export class AlwaysTrueScriptVote extends TypedScript<PlutusData, AlwaysTrueScriptVoteRedeemer> {
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

  redeemer(value: AlwaysTrueScriptVoteRedeemerInput): AlwaysTrueScriptVoteRedeemer {
    return serializeContractData<AlwaysTrueScriptVoteRedeemer>(AlwaysTrueScriptVoteRedeemerSchema, value);
  }
}
export const AlwaysTrueScriptProposeRedeemerSchema = TPlutusData;
export type AlwaysTrueScriptProposeRedeemerInput = Exact<typeof AlwaysTrueScriptProposeRedeemerSchema>;
export type AlwaysTrueScriptProposeRedeemer = PlutusData & { readonly __AlwaysTrueScriptProposeRedeemer: "AlwaysTrueScriptProposeRedeemer" };

export class AlwaysTrueScriptPropose extends TypedScript<PlutusData, AlwaysTrueScriptProposeRedeemer> {
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

  redeemer(value: AlwaysTrueScriptProposeRedeemerInput): AlwaysTrueScriptProposeRedeemer {
    return serializeContractData<AlwaysTrueScriptProposeRedeemer>(AlwaysTrueScriptProposeRedeemerSchema, value);
  }
}
export const AlwaysTrueScriptPublishRedeemerSchema = TPlutusData;
export type AlwaysTrueScriptPublishRedeemerInput = Exact<typeof AlwaysTrueScriptPublishRedeemerSchema>;
export type AlwaysTrueScriptPublishRedeemer = PlutusData & { readonly __AlwaysTrueScriptPublishRedeemer: "AlwaysTrueScriptPublishRedeemer" };

export class AlwaysTrueScriptPublish extends TypedScript<PlutusData, AlwaysTrueScriptPublishRedeemer> {
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

  redeemer(value: AlwaysTrueScriptPublishRedeemerInput): AlwaysTrueScriptPublishRedeemer {
    return serializeContractData<AlwaysTrueScriptPublishRedeemer>(AlwaysTrueScriptPublishRedeemerSchema, value);
  }
}
export const AlwaysTrueScriptElseRedeemerSchema = TPlutusData;
export type AlwaysTrueScriptElseRedeemerInput = Exact<typeof AlwaysTrueScriptElseRedeemerSchema>;
export type AlwaysTrueScriptElseRedeemer = PlutusData & { readonly __AlwaysTrueScriptElseRedeemer: "AlwaysTrueScriptElseRedeemer" };

export class AlwaysTrueScriptElse extends TypedScript<PlutusData, AlwaysTrueScriptElseRedeemer> {
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

  redeemer(value: AlwaysTrueScriptElseRedeemerInput): AlwaysTrueScriptElseRedeemer {
    return serializeContractData<AlwaysTrueScriptElseRedeemer>(AlwaysTrueScriptElseRedeemerSchema, value);
  }
}