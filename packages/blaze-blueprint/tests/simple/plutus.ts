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


export const AlwaysTrueScriptSpendDatumSchema = Type.Array(
  Type.BigInt()
);
export type AlwaysTrueScriptSpendDatumInput = Exact<typeof AlwaysTrueScriptSpendDatumSchema>;
export type AlwaysTrueScriptSpendDatum = PlutusData & { readonly __AlwaysTrueScriptSpendDatum: "AlwaysTrueScriptSpendDatum" };

export const AlwaysTrueScriptSpendRedeemerSchema = Type.BigInt();
export type AlwaysTrueScriptSpendRedeemerInput = Exact<typeof AlwaysTrueScriptSpendRedeemerSchema>;
export type AlwaysTrueScriptSpendRedeemer = PlutusData & { readonly __AlwaysTrueScriptSpendRedeemer: "AlwaysTrueScriptSpendRedeemer" };

export class AlwaysTrueScriptSpend extends TypedScript<AlwaysTrueScriptSpendDatum, AlwaysTrueScriptSpendRedeemer> {
  constructor(
    _param1: Int,
    _param2: ByteArray,
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        trace
          ?
          "58b20101002229800aba4aba2aba1aab9eaab9dab9cab9a9bad0039bae0024888888888c96600264653001300a00198051805800cc0280092225980099b8748008c02cdd500144c8cc896600200d009804c026264944dd6803402501218070009807180780098061baa0028b2012180500098039baa00b8a4d15330054911856616c696461746f722072657475726e65642066616c7365001365640102a6600892010e5f72656465656d65723a20496e74001601"
          :
          "58660101002229800aba2aba1aab9eaab9dab9a9bad0039bae002488888896600264646644b30013370e900118041baa0028994c004c02c00660166018003375a601600891125118049baa0028b200e300830090013008002300800130053754011149a26cac8019",
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
    super(Script, "always_true.script.spend");
  }

  datum(value: AlwaysTrueScriptSpendDatumInput): AlwaysTrueScriptSpendDatum {
    return serializeContractData<AlwaysTrueScriptSpendDatum>(AlwaysTrueScriptSpendDatumSchema, value);
  }

  redeemer(value: AlwaysTrueScriptSpendRedeemerInput): AlwaysTrueScriptSpendRedeemer {
    return serializeContractData<AlwaysTrueScriptSpendRedeemer>(AlwaysTrueScriptSpendRedeemerSchema, value);
  }
}
export const AlwaysTrueScriptElseRedeemerSchema = TPlutusData;
export type AlwaysTrueScriptElseRedeemerInput = Exact<typeof AlwaysTrueScriptElseRedeemerSchema>;
export type AlwaysTrueScriptElseRedeemer = PlutusData & { readonly __AlwaysTrueScriptElseRedeemer: "AlwaysTrueScriptElseRedeemer" };

export class AlwaysTrueScriptElse extends TypedScript<PlutusData, AlwaysTrueScriptElseRedeemer> {
  constructor(
    _param1: Int,
    _param2: ByteArray,
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        trace
          ?
          "58b20101002229800aba4aba2aba1aab9eaab9dab9cab9a9bad0039bae0024888888888c96600264653001300a00198051805800cc0280092225980099b8748008c02cdd500144c8cc896600200d009804c026264944dd6803402501218070009807180780098061baa0028b2012180500098039baa00b8a4d15330054911856616c696461746f722072657475726e65642066616c7365001365640102a6600892010e5f72656465656d65723a20496e74001601"
          :
          "58660101002229800aba2aba1aab9eaab9dab9a9bad0039bae002488888896600264646644b30013370e900118041baa0028994c004c02c00660166018003375a601600891125118049baa0028b200e300830090013008002300800130053754011149a26cac8019",
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
export const AlwaysTrueScriptNoParamsSpendDatumSchema = Type.Array(
  Type.BigInt()
);
export type AlwaysTrueScriptNoParamsSpendDatumInput = Exact<typeof AlwaysTrueScriptNoParamsSpendDatumSchema>;
export type AlwaysTrueScriptNoParamsSpendDatum = PlutusData & { readonly __AlwaysTrueScriptNoParamsSpendDatum: "AlwaysTrueScriptNoParamsSpendDatum" };

export const AlwaysTrueScriptNoParamsSpendRedeemerSchema = Type.BigInt();
export type AlwaysTrueScriptNoParamsSpendRedeemerInput = Exact<typeof AlwaysTrueScriptNoParamsSpendRedeemerSchema>;
export type AlwaysTrueScriptNoParamsSpendRedeemer = PlutusData & { readonly __AlwaysTrueScriptNoParamsSpendRedeemer: "AlwaysTrueScriptNoParamsSpendRedeemer" };

export class AlwaysTrueScriptNoParamsSpend extends TypedScript<AlwaysTrueScriptNoParamsSpendDatum, AlwaysTrueScriptNoParamsSpendRedeemer> {
  constructor(
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      trace
        ?
        "58a901010029800aba4aba2aba1aab9eaab9dab9cab9a48888888c96600264653001300800198041804800cc0200092225980099b8748008c024dd500144c8cc896600200d009804c026264944dd6803402501018060009806180680098051baa0028b200e180400098029baa0098a4d15330034911856616c696461746f722072657475726e65642066616c7365001365640082a6600492010e5f72656465656d65723a20496e74001601"
        :
        "585d01010029800aba2aba1aab9eaab9dab9a4888896600264646644b30013370e900118031baa0028994c004c02400660126014003375a601200891125118039baa0028b200a30063007001300600230060013003375400d149a26cac8009",
      "PlutusV3"
    );
    super(Script, "always_true.script_no_params.spend");
  }

  datum(value: AlwaysTrueScriptNoParamsSpendDatumInput): AlwaysTrueScriptNoParamsSpendDatum {
    return serializeContractData<AlwaysTrueScriptNoParamsSpendDatum>(AlwaysTrueScriptNoParamsSpendDatumSchema, value);
  }

  redeemer(value: AlwaysTrueScriptNoParamsSpendRedeemerInput): AlwaysTrueScriptNoParamsSpendRedeemer {
    return serializeContractData<AlwaysTrueScriptNoParamsSpendRedeemer>(AlwaysTrueScriptNoParamsSpendRedeemerSchema, value);
  }
}
export const AlwaysTrueScriptNoParamsElseRedeemerSchema = TPlutusData;
export type AlwaysTrueScriptNoParamsElseRedeemerInput = Exact<typeof AlwaysTrueScriptNoParamsElseRedeemerSchema>;
export type AlwaysTrueScriptNoParamsElseRedeemer = PlutusData & { readonly __AlwaysTrueScriptNoParamsElseRedeemer: "AlwaysTrueScriptNoParamsElseRedeemer" };

export class AlwaysTrueScriptNoParamsElse extends TypedScript<PlutusData, AlwaysTrueScriptNoParamsElseRedeemer> {
  constructor(
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      trace
        ?
        "58a901010029800aba4aba2aba1aab9eaab9dab9cab9a48888888c96600264653001300800198041804800cc0200092225980099b8748008c024dd500144c8cc896600200d009804c026264944dd6803402501018060009806180680098051baa0028b200e180400098029baa0098a4d15330034911856616c696461746f722072657475726e65642066616c7365001365640082a6600492010e5f72656465656d65723a20496e74001601"
        :
        "585d01010029800aba2aba1aab9eaab9dab9a4888896600264646644b30013370e900118031baa0028994c004c02400660126014003375a601200891125118039baa0028b200a30063007001300600230060013003375400d149a26cac8009",
      "PlutusV3"
    );
    super(Script, "always_true.script_no_params.else");
  }

  redeemer(value: AlwaysTrueScriptNoParamsElseRedeemerInput): AlwaysTrueScriptNoParamsElseRedeemer {
    return serializeContractData<AlwaysTrueScriptNoParamsElseRedeemer>(AlwaysTrueScriptNoParamsElseRedeemerSchema, value);
  }
}
export const NestedSometimesTrueScriptSpendDatumSchema = TPlutusData;
export type NestedSometimesTrueScriptSpendDatumInput = Exact<typeof NestedSometimesTrueScriptSpendDatumSchema>;
export type NestedSometimesTrueScriptSpendDatum = PlutusData & { readonly __NestedSometimesTrueScriptSpendDatum: "NestedSometimesTrueScriptSpendDatum" };

export const NestedSometimesTrueScriptSpendRedeemerSchema = Type.BigInt();
export type NestedSometimesTrueScriptSpendRedeemerInput = Exact<typeof NestedSometimesTrueScriptSpendRedeemerSchema>;
export type NestedSometimesTrueScriptSpendRedeemer = PlutusData & { readonly __NestedSometimesTrueScriptSpendRedeemer: "NestedSometimesTrueScriptSpendRedeemer" };

export class NestedSometimesTrueScriptSpend extends TypedScript<NestedSometimesTrueScriptSpendDatum, NestedSometimesTrueScriptSpendRedeemer> {
  constructor(
    param: Int,
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        trace
          ?
          "58ae010100229800aba4aba2aba1aab9eaab9dab9cab9a9bad002488888888c96600264653001300900198049805000cc0240092225980099b8748008c028dd500144c8cc896600200d009804c026266e20028dd6803402501118068009806980700098059baa0028b2010180480098031baa00a8a4d15330044911856616c696461746f722072657475726e65642066616c73650013656400c2a6600692010d72656465656d65723a20496e74001601"
          :
          "5862010100229800aba2aba1aab9eaab9dab9a9bad00248888896600264646644b30013370e900118039baa002899199119b88008375a601800c60140026014601600260106ea800a2c8030c01cc020004c01c008c01c004c010dd5003c52689b2b20041",
        Type.Tuple([
          Type.BigInt(),
        ]),
        [
          param,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "nested/sometimes_true.script.spend");
  }

  datum(value: NestedSometimesTrueScriptSpendDatumInput): NestedSometimesTrueScriptSpendDatum {
    return serializeContractData<NestedSometimesTrueScriptSpendDatum>(NestedSometimesTrueScriptSpendDatumSchema, value);
  }

  redeemer(value: NestedSometimesTrueScriptSpendRedeemerInput): NestedSometimesTrueScriptSpendRedeemer {
    return serializeContractData<NestedSometimesTrueScriptSpendRedeemer>(NestedSometimesTrueScriptSpendRedeemerSchema, value);
  }
}
export const NestedSometimesTrueScriptElseRedeemerSchema = TPlutusData;
export type NestedSometimesTrueScriptElseRedeemerInput = Exact<typeof NestedSometimesTrueScriptElseRedeemerSchema>;
export type NestedSometimesTrueScriptElseRedeemer = PlutusData & { readonly __NestedSometimesTrueScriptElseRedeemer: "NestedSometimesTrueScriptElseRedeemer" };

export class NestedSometimesTrueScriptElse extends TypedScript<PlutusData, NestedSometimesTrueScriptElseRedeemer> {
  constructor(
    param: Int,
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        trace
          ?
          "58ae010100229800aba4aba2aba1aab9eaab9dab9cab9a9bad002488888888c96600264653001300900198049805000cc0240092225980099b8748008c028dd500144c8cc896600200d009804c026266e20028dd6803402501118068009806980700098059baa0028b2010180480098031baa00a8a4d15330044911856616c696461746f722072657475726e65642066616c73650013656400c2a6600692010d72656465656d65723a20496e74001601"
          :
          "5862010100229800aba2aba1aab9eaab9dab9a9bad00248888896600264646644b30013370e900118039baa002899199119b88008375a601800c60140026014601600260106ea800a2c8030c01cc020004c01c008c01c004c010dd5003c52689b2b20041",
        Type.Tuple([
          Type.BigInt(),
        ]),
        [
          param,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "nested/sometimes_true.script.else");
  }

  redeemer(value: NestedSometimesTrueScriptElseRedeemerInput): NestedSometimesTrueScriptElseRedeemer {
    return serializeContractData<NestedSometimesTrueScriptElseRedeemer>(NestedSometimesTrueScriptElseRedeemerSchema, value);
  }
}