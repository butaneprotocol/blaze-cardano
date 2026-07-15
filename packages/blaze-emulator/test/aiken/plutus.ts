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


type __GovernanceGuardVoteRedeemerData = PlutusData & { readonly __GovernanceGuardVoteRedeemer: "__GovernanceGuardVoteRedeemerData" };
const __GovernanceGuardVoteRedeemerSchema = Type.BigInt();
type __GovernanceGuardVoteRedeemerInput = Exact<typeof __GovernanceGuardVoteRedeemerSchema>;

export class GovernanceGuardVote extends TypedScript<PlutusData, __GovernanceGuardVoteRedeemerData> {
  constructor(
    expectedRedeemer: Int,
    minimumDeposit: Int,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "58d20101002229800aba2aba1aab9eaab9dab9a9bad0039bad002488888896600264646530013007375400330090039b87375a60120049112cc004cdc3a40100071598009800804456600266e1d2002300a3754601860166ea801229462941009452820128acc004cdc3a40140071323259800980180544cdc48049bad300e300d3754601c601e00514a08058dd6980680098059baa0048acc004cdc3a400c0071323322300400b375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
        Type.Tuple([
          Type.BigInt(),
          Type.BigInt(),
        ]),
        [
          expectedRedeemer,
          minimumDeposit,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "governance.guard.vote");
  }

  redeemer(value: __GovernanceGuardVoteRedeemerInput): __GovernanceGuardVoteRedeemerData {
    return serializeContractData<__GovernanceGuardVoteRedeemerData>(__GovernanceGuardVoteRedeemerSchema, value);
  }
}
type __GovernanceGuardProposeRedeemerData = PlutusData & { readonly __GovernanceGuardProposeRedeemer: "__GovernanceGuardProposeRedeemerData" };
const __GovernanceGuardProposeRedeemerSchema = Type.BigInt();
type __GovernanceGuardProposeRedeemerInput = Exact<typeof __GovernanceGuardProposeRedeemerSchema>;

export class GovernanceGuardPropose extends TypedScript<PlutusData, __GovernanceGuardProposeRedeemerData> {
  constructor(
    expectedRedeemer: Int,
    minimumDeposit: Int,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "58d20101002229800aba2aba1aab9eaab9dab9a9bad0039bad002488888896600264646530013007375400330090039b87375a60120049112cc004cdc3a40100071598009800804456600266e1d2002300a3754601860166ea801229462941009452820128acc004cdc3a40140071323259800980180544cdc48049bad300e300d3754601c601e00514a08058dd6980680098059baa0048acc004cdc3a400c0071323322300400b375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
        Type.Tuple([
          Type.BigInt(),
          Type.BigInt(),
        ]),
        [
          expectedRedeemer,
          minimumDeposit,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "governance.guard.propose");
  }

  redeemer(value: __GovernanceGuardProposeRedeemerInput): __GovernanceGuardProposeRedeemerData {
    return serializeContractData<__GovernanceGuardProposeRedeemerData>(__GovernanceGuardProposeRedeemerSchema, value);
  }
}
type __GovernanceGuardPublishRedeemerData = PlutusData & { readonly __GovernanceGuardPublishRedeemer: "__GovernanceGuardPublishRedeemerData" };
const __GovernanceGuardPublishRedeemerSchema = Type.BigInt();
type __GovernanceGuardPublishRedeemerInput = Exact<typeof __GovernanceGuardPublishRedeemerSchema>;

export class GovernanceGuardPublish extends TypedScript<PlutusData, __GovernanceGuardPublishRedeemerData> {
  constructor(
    expectedRedeemer: Int,
    minimumDeposit: Int,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "58d20101002229800aba2aba1aab9eaab9dab9a9bad0039bad002488888896600264646530013007375400330090039b87375a60120049112cc004cdc3a40100071598009800804456600266e1d2002300a3754601860166ea801229462941009452820128acc004cdc3a40140071323259800980180544cdc48049bad300e300d3754601c601e00514a08058dd6980680098059baa0048acc004cdc3a400c0071323322300400b375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
        Type.Tuple([
          Type.BigInt(),
          Type.BigInt(),
        ]),
        [
          expectedRedeemer,
          minimumDeposit,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "governance.guard.publish");
  }

  redeemer(value: __GovernanceGuardPublishRedeemerInput): __GovernanceGuardPublishRedeemerData {
    return serializeContractData<__GovernanceGuardPublishRedeemerData>(__GovernanceGuardPublishRedeemerSchema, value);
  }
}
type __GovernanceGuardElseRedeemerData = PlutusData & { readonly __GovernanceGuardElseRedeemer: "__GovernanceGuardElseRedeemerData" };
const __GovernanceGuardElseRedeemerSchema = TPlutusData;
type __GovernanceGuardElseRedeemerInput = Exact<typeof __GovernanceGuardElseRedeemerSchema>;

export class GovernanceGuardElse extends TypedScript<PlutusData, __GovernanceGuardElseRedeemerData> {
  constructor(
    expectedRedeemer: Int,
    minimumDeposit: Int,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        "58d20101002229800aba2aba1aab9eaab9dab9a9bad0039bad002488888896600264646530013007375400330090039b87375a60120049112cc004cdc3a40100071598009800804456600266e1d2002300a3754601860166ea801229462941009452820128acc004cdc3a40140071323259800980180544cdc48049bad300e300d3754601c601e00514a08058dd6980680098059baa0048acc004cdc3a400c0071323322300400b375a601a002601a601c00260166ea80122c8049009201218041804800980400098029baa0088a4d13656400c1",
        Type.Tuple([
          Type.BigInt(),
          Type.BigInt(),
        ]),
        [
          expectedRedeemer,
          minimumDeposit,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "governance.guard.else");
  }

  redeemer(value: __GovernanceGuardElseRedeemerInput): __GovernanceGuardElseRedeemerData {
    return serializeContractData<__GovernanceGuardElseRedeemerData>(__GovernanceGuardElseRedeemerSchema, value);
  }
}