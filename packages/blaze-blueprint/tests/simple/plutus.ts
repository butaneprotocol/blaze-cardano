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


type __AlwaysTrueScriptSpendDatumData = PlutusData & { readonly __AlwaysTrueScriptSpendDatum: "__AlwaysTrueScriptSpendDatumData" };
const __AlwaysTrueScriptSpendDatumSchema = Type.Array(
  Type.BigInt()
);
type __AlwaysTrueScriptSpendDatumInput = Exact<typeof __AlwaysTrueScriptSpendDatumSchema>;

type __AlwaysTrueScriptSpendRedeemerData = PlutusData & { readonly __AlwaysTrueScriptSpendRedeemer: "__AlwaysTrueScriptSpendRedeemerData" };
const __AlwaysTrueScriptSpendRedeemerSchema = Type.BigInt();
type __AlwaysTrueScriptSpendRedeemerInput = Exact<typeof __AlwaysTrueScriptSpendRedeemerSchema>;

export class AlwaysTrueScriptSpend extends TypedScript<__AlwaysTrueScriptSpendDatumData, __AlwaysTrueScriptSpendRedeemerData> {
  constructor(
    _param1: bigint,
    _param2: string,
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

  datum(value: __AlwaysTrueScriptSpendDatumInput): __AlwaysTrueScriptSpendDatumData {
    return serializeContractData<__AlwaysTrueScriptSpendDatumData>(__AlwaysTrueScriptSpendDatumSchema, value);
  }

  redeemer(value: __AlwaysTrueScriptSpendRedeemerInput): __AlwaysTrueScriptSpendRedeemerData {
    return serializeContractData<__AlwaysTrueScriptSpendRedeemerData>(__AlwaysTrueScriptSpendRedeemerSchema, value);
  }
}
type __AlwaysTrueScriptElseRedeemerData = PlutusData & { readonly __AlwaysTrueScriptElseRedeemer: "__AlwaysTrueScriptElseRedeemerData" };
const __AlwaysTrueScriptElseRedeemerSchema = TPlutusData;
type __AlwaysTrueScriptElseRedeemerInput = Exact<typeof __AlwaysTrueScriptElseRedeemerSchema>;

export class AlwaysTrueScriptElse extends TypedScript<PlutusData, __AlwaysTrueScriptElseRedeemerData> {
  constructor(
    _param1: bigint,
    _param2: string,
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

  redeemer(value: __AlwaysTrueScriptElseRedeemerInput): __AlwaysTrueScriptElseRedeemerData {
    return serializeContractData<__AlwaysTrueScriptElseRedeemerData>(__AlwaysTrueScriptElseRedeemerSchema, value);
  }
}
type __AlwaysTrueScriptNoParamsSpendDatumData = PlutusData & { readonly __AlwaysTrueScriptNoParamsSpendDatum: "__AlwaysTrueScriptNoParamsSpendDatumData" };
const __AlwaysTrueScriptNoParamsSpendDatumSchema = Type.Array(
  Type.BigInt()
);
type __AlwaysTrueScriptNoParamsSpendDatumInput = Exact<typeof __AlwaysTrueScriptNoParamsSpendDatumSchema>;

type __AlwaysTrueScriptNoParamsSpendRedeemerData = PlutusData & { readonly __AlwaysTrueScriptNoParamsSpendRedeemer: "__AlwaysTrueScriptNoParamsSpendRedeemerData" };
const __AlwaysTrueScriptNoParamsSpendRedeemerSchema = Type.BigInt();
type __AlwaysTrueScriptNoParamsSpendRedeemerInput = Exact<typeof __AlwaysTrueScriptNoParamsSpendRedeemerSchema>;

export class AlwaysTrueScriptNoParamsSpend extends TypedScript<__AlwaysTrueScriptNoParamsSpendDatumData, __AlwaysTrueScriptNoParamsSpendRedeemerData> {
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

  datum(value: __AlwaysTrueScriptNoParamsSpendDatumInput): __AlwaysTrueScriptNoParamsSpendDatumData {
    return serializeContractData<__AlwaysTrueScriptNoParamsSpendDatumData>(__AlwaysTrueScriptNoParamsSpendDatumSchema, value);
  }

  redeemer(value: __AlwaysTrueScriptNoParamsSpendRedeemerInput): __AlwaysTrueScriptNoParamsSpendRedeemerData {
    return serializeContractData<__AlwaysTrueScriptNoParamsSpendRedeemerData>(__AlwaysTrueScriptNoParamsSpendRedeemerSchema, value);
  }
}
type __AlwaysTrueScriptNoParamsElseRedeemerData = PlutusData & { readonly __AlwaysTrueScriptNoParamsElseRedeemer: "__AlwaysTrueScriptNoParamsElseRedeemerData" };
const __AlwaysTrueScriptNoParamsElseRedeemerSchema = TPlutusData;
type __AlwaysTrueScriptNoParamsElseRedeemerInput = Exact<typeof __AlwaysTrueScriptNoParamsElseRedeemerSchema>;

export class AlwaysTrueScriptNoParamsElse extends TypedScript<PlutusData, __AlwaysTrueScriptNoParamsElseRedeemerData> {
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

  redeemer(value: __AlwaysTrueScriptNoParamsElseRedeemerInput): __AlwaysTrueScriptNoParamsElseRedeemerData {
    return serializeContractData<__AlwaysTrueScriptNoParamsElseRedeemerData>(__AlwaysTrueScriptNoParamsElseRedeemerSchema, value);
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