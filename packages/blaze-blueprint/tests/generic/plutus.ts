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
  GenericType_OutputReference: Type.Object({
    action: Type.Object({
      transaction_id: Type.String(),
      output_index: Type.BigInt(),
    }, { ctor: 0n }),
  }, { ctor: 0n }),
});
const ContractDefinitions = Contracts.$defs;
const serializeContractData = <T extends PlutusData>(schema, value): T => serialize(schema, value, ContractDefinitions) as T;

export const GenericType_OutputReference = Contracts.Import("GenericType_OutputReference");
export type GenericType_OutputReference = Exact<typeof GenericType_OutputReference>;

type __AlwaysTrueWithGenericScriptSpendDatumData = PlutusData & { readonly __AlwaysTrueWithGenericScriptSpendDatum: "__AlwaysTrueWithGenericScriptSpendDatumData" };
const __AlwaysTrueWithGenericScriptSpendDatumSchema = Type.Array(
  Type.BigInt()
);
type __AlwaysTrueWithGenericScriptSpendDatumInput = Exact<typeof __AlwaysTrueWithGenericScriptSpendDatumSchema>;

type __AlwaysTrueWithGenericScriptSpendRedeemerData = PlutusData & { readonly __AlwaysTrueWithGenericScriptSpendRedeemer: "__AlwaysTrueWithGenericScriptSpendRedeemerData" };
const __AlwaysTrueWithGenericScriptSpendRedeemerSchema = Type.BigInt();
type __AlwaysTrueWithGenericScriptSpendRedeemerInput = Exact<typeof __AlwaysTrueWithGenericScriptSpendRedeemerSchema>;

export class AlwaysTrueWithGenericScriptSpend extends TypedScript<__AlwaysTrueWithGenericScriptSpendDatumData, __AlwaysTrueWithGenericScriptSpendRedeemerData> {
  constructor(
    _param1: bigint,
    _param2: string,
    _param3: GenericType_OutputReference,
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        trace
          ?
          "58b301010022229800aba4aba2aba1aab9eaab9dab9cab9a9bad0049bae0034888888888c96600264653001300a00198051805800cc0280092225980099b8748008c02cdd500144c8cc896600200d009804c026264944dd6803402501218070009807180780098061baa0028b2012180500098039baa00b8a4d153300549011856616c696461746f722072657475726e65642066616c7365001365640102a6600892010e5f72656465656d65723a20496e74001601"
          :
          "586701010022229800aba2aba1aab9eaab9dab9a9bad0049bae003488888896600264646644b30013370e900118041baa0028994c004c02c00660166018003375a601600891125118049baa0028b200e300830090013008002300800130053754011149a26cac80181",
        Type.Tuple([
          Type.BigInt(),
          Type.String(),
          GenericType_OutputReference,
        ]),
        [
          _param1,
          _param2,
          _param3,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "always_true_with_generic.script.spend");
  }

  datum(value: __AlwaysTrueWithGenericScriptSpendDatumInput): __AlwaysTrueWithGenericScriptSpendDatumData {
    return serializeContractData<__AlwaysTrueWithGenericScriptSpendDatumData>(__AlwaysTrueWithGenericScriptSpendDatumSchema, value);
  }

  redeemer(value: __AlwaysTrueWithGenericScriptSpendRedeemerInput): __AlwaysTrueWithGenericScriptSpendRedeemerData {
    return serializeContractData<__AlwaysTrueWithGenericScriptSpendRedeemerData>(__AlwaysTrueWithGenericScriptSpendRedeemerSchema, value);
  }
}
type __AlwaysTrueWithGenericScriptElseRedeemerData = PlutusData & { readonly __AlwaysTrueWithGenericScriptElseRedeemer: "__AlwaysTrueWithGenericScriptElseRedeemerData" };
const __AlwaysTrueWithGenericScriptElseRedeemerSchema = TPlutusData;
type __AlwaysTrueWithGenericScriptElseRedeemerInput = Exact<typeof __AlwaysTrueWithGenericScriptElseRedeemerSchema>;

export class AlwaysTrueWithGenericScriptElse extends TypedScript<PlutusData, __AlwaysTrueWithGenericScriptElseRedeemerData> {
  constructor(
    _param1: bigint,
    _param2: string,
    _param3: GenericType_OutputReference,
    trace?: boolean = false,
  ) {
    const Script = cborToScript(
      applyParamsToScript(
        trace
          ?
          "58b301010022229800aba4aba2aba1aab9eaab9dab9cab9a9bad0049bae0034888888888c96600264653001300a00198051805800cc0280092225980099b8748008c02cdd500144c8cc896600200d009804c026264944dd6803402501218070009807180780098061baa0028b2012180500098039baa00b8a4d153300549011856616c696461746f722072657475726e65642066616c7365001365640102a6600892010e5f72656465656d65723a20496e74001601"
          :
          "586701010022229800aba2aba1aab9eaab9dab9a9bad0049bae003488888896600264646644b30013370e900118041baa0028994c004c02c00660166018003375a601600891125118049baa0028b200e300830090013008002300800130053754011149a26cac80181",
        Type.Tuple([
          Type.BigInt(),
          Type.String(),
          GenericType_OutputReference,
        ]),
        [
          _param1,
          _param2,
          _param3,
        ],
      ),
      "PlutusV3"
    );
    super(Script, "always_true_with_generic.script.else");
  }

  redeemer(value: __AlwaysTrueWithGenericScriptElseRedeemerInput): __AlwaysTrueWithGenericScriptElseRedeemerData {
    return serializeContractData<__AlwaysTrueWithGenericScriptElseRedeemerData>(__AlwaysTrueWithGenericScriptElseRedeemerSchema, value);
  }
}
type __AlwaysTrueWithGenericScriptNoParamsSpendDatumData = PlutusData & { readonly __AlwaysTrueWithGenericScriptNoParamsSpendDatum: "__AlwaysTrueWithGenericScriptNoParamsSpendDatumData" };
const __AlwaysTrueWithGenericScriptNoParamsSpendDatumSchema = Type.Array(
  Type.BigInt()
);
type __AlwaysTrueWithGenericScriptNoParamsSpendDatumInput = Exact<typeof __AlwaysTrueWithGenericScriptNoParamsSpendDatumSchema>;

type __AlwaysTrueWithGenericScriptNoParamsSpendRedeemerData = PlutusData & { readonly __AlwaysTrueWithGenericScriptNoParamsSpendRedeemer: "__AlwaysTrueWithGenericScriptNoParamsSpendRedeemerData" };
const __AlwaysTrueWithGenericScriptNoParamsSpendRedeemerSchema = Type.BigInt();
type __AlwaysTrueWithGenericScriptNoParamsSpendRedeemerInput = Exact<typeof __AlwaysTrueWithGenericScriptNoParamsSpendRedeemerSchema>;

export class AlwaysTrueWithGenericScriptNoParamsSpend extends TypedScript<__AlwaysTrueWithGenericScriptNoParamsSpendDatumData, __AlwaysTrueWithGenericScriptNoParamsSpendRedeemerData> {
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
    super(Script, "always_true_with_generic.script_no_params.spend");
  }

  datum(value: __AlwaysTrueWithGenericScriptNoParamsSpendDatumInput): __AlwaysTrueWithGenericScriptNoParamsSpendDatumData {
    return serializeContractData<__AlwaysTrueWithGenericScriptNoParamsSpendDatumData>(__AlwaysTrueWithGenericScriptNoParamsSpendDatumSchema, value);
  }

  redeemer(value: __AlwaysTrueWithGenericScriptNoParamsSpendRedeemerInput): __AlwaysTrueWithGenericScriptNoParamsSpendRedeemerData {
    return serializeContractData<__AlwaysTrueWithGenericScriptNoParamsSpendRedeemerData>(__AlwaysTrueWithGenericScriptNoParamsSpendRedeemerSchema, value);
  }
}
type __AlwaysTrueWithGenericScriptNoParamsElseRedeemerData = PlutusData & { readonly __AlwaysTrueWithGenericScriptNoParamsElseRedeemer: "__AlwaysTrueWithGenericScriptNoParamsElseRedeemerData" };
const __AlwaysTrueWithGenericScriptNoParamsElseRedeemerSchema = TPlutusData;
type __AlwaysTrueWithGenericScriptNoParamsElseRedeemerInput = Exact<typeof __AlwaysTrueWithGenericScriptNoParamsElseRedeemerSchema>;

export class AlwaysTrueWithGenericScriptNoParamsElse extends TypedScript<PlutusData, __AlwaysTrueWithGenericScriptNoParamsElseRedeemerData> {
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
    super(Script, "always_true_with_generic.script_no_params.else");
  }

  redeemer(value: __AlwaysTrueWithGenericScriptNoParamsElseRedeemerInput): __AlwaysTrueWithGenericScriptNoParamsElseRedeemerData {
    return serializeContractData<__AlwaysTrueWithGenericScriptNoParamsElseRedeemerData>(__AlwaysTrueWithGenericScriptNoParamsElseRedeemerSchema, value);
  }
}
type __NestedSometimesTrueScriptSpendDatumData = PlutusData & { readonly __NestedSometimesTrueScriptSpendDatum: "__NestedSometimesTrueScriptSpendDatumData" };
const __NestedSometimesTrueScriptSpendDatumSchema = TPlutusData;
type __NestedSometimesTrueScriptSpendDatumInput = Exact<typeof __NestedSometimesTrueScriptSpendDatumSchema>;

type __NestedSometimesTrueScriptSpendRedeemerData = PlutusData & { readonly __NestedSometimesTrueScriptSpendRedeemer: "__NestedSometimesTrueScriptSpendRedeemerData" };
const __NestedSometimesTrueScriptSpendRedeemerSchema = Type.BigInt();
type __NestedSometimesTrueScriptSpendRedeemerInput = Exact<typeof __NestedSometimesTrueScriptSpendRedeemerSchema>;

export class NestedSometimesTrueScriptSpend extends TypedScript<__NestedSometimesTrueScriptSpendDatumData, __NestedSometimesTrueScriptSpendRedeemerData> {
  constructor(
    param: bigint,
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

  datum(value: __NestedSometimesTrueScriptSpendDatumInput): __NestedSometimesTrueScriptSpendDatumData {
    return serializeContractData<__NestedSometimesTrueScriptSpendDatumData>(__NestedSometimesTrueScriptSpendDatumSchema, value);
  }

  redeemer(value: __NestedSometimesTrueScriptSpendRedeemerInput): __NestedSometimesTrueScriptSpendRedeemerData {
    return serializeContractData<__NestedSometimesTrueScriptSpendRedeemerData>(__NestedSometimesTrueScriptSpendRedeemerSchema, value);
  }
}
type __NestedSometimesTrueScriptElseRedeemerData = PlutusData & { readonly __NestedSometimesTrueScriptElseRedeemer: "__NestedSometimesTrueScriptElseRedeemerData" };
const __NestedSometimesTrueScriptElseRedeemerSchema = TPlutusData;
type __NestedSometimesTrueScriptElseRedeemerInput = Exact<typeof __NestedSometimesTrueScriptElseRedeemerSchema>;

export class NestedSometimesTrueScriptElse extends TypedScript<PlutusData, __NestedSometimesTrueScriptElseRedeemerData> {
  constructor(
    param: bigint,
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

  redeemer(value: __NestedSometimesTrueScriptElseRedeemerInput): __NestedSometimesTrueScriptElseRedeemerData {
    return serializeContractData<__NestedSometimesTrueScriptElseRedeemerData>(__NestedSometimesTrueScriptElseRedeemerSchema, value);
  }
}