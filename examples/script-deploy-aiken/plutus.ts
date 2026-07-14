/* eslint-disable */
// @ts-nocheck
import { applyParamsToScript, cborToScript, Core, TypedScript } from "@blaze-cardano/sdk"
import { Type, Exact, TPlutusData, serialize } from "@blaze-cardano/data";
type Script = Core.Script;
const Script = Core.Script;
type PlutusData = Core.PlutusData;
type Data = Exact<typeof TPlutusData>;
type Int = bigint;
type ByteArray = string;
const PolicyId = Type.String();
type OutputReference = Core.TransactionInput;

const Contracts = Type.Module({
});
const ContractDefinitions = Contracts.$defs;
const serializeContractData = <T extends PlutusData>(schema, value): T => serialize(schema, value, ContractDefinitions) as T;


type __AlwaysTrueAlwaysTrueSpendDatumData = PlutusData & { readonly __AlwaysTrueAlwaysTrueSpendDatum: "__AlwaysTrueAlwaysTrueSpendDatumData" };
const __AlwaysTrueAlwaysTrueSpendDatumSchema = TPlutusData;
type __AlwaysTrueAlwaysTrueSpendDatumInput = Exact<typeof __AlwaysTrueAlwaysTrueSpendDatumSchema>;

type __AlwaysTrueAlwaysTrueSpendRedeemerData = PlutusData & { readonly __AlwaysTrueAlwaysTrueSpendRedeemer: "__AlwaysTrueAlwaysTrueSpendRedeemerData" };
const __AlwaysTrueAlwaysTrueSpendRedeemerSchema = TPlutusData;
type __AlwaysTrueAlwaysTrueSpendRedeemerInput = Exact<typeof __AlwaysTrueAlwaysTrueSpendRedeemerSchema>;

export class AlwaysTrueAlwaysTrueSpend extends TypedScript<__AlwaysTrueAlwaysTrueSpendDatumData, __AlwaysTrueAlwaysTrueSpendRedeemerData> {
  constructor() {
    const Script = cborToScript(
      "585c01010029800aba2aba1aab9eaab9dab9a4888896600264653001300600198031803800cc0180092225980099b8748008c01cdd500144c8cc892898050009805180580098041baa0028b200c180300098019baa0068a4d13656400401",
      "PlutusV3"
    );
    super(Script, "always_true.always_true.spend");
  }

  datum(value: __AlwaysTrueAlwaysTrueSpendDatumInput): __AlwaysTrueAlwaysTrueSpendDatumData {
    return serializeContractData<__AlwaysTrueAlwaysTrueSpendDatumData>(__AlwaysTrueAlwaysTrueSpendDatumSchema, value);
  }

  redeemer(value: __AlwaysTrueAlwaysTrueSpendRedeemerInput): __AlwaysTrueAlwaysTrueSpendRedeemerData {
    return serializeContractData<__AlwaysTrueAlwaysTrueSpendRedeemerData>(__AlwaysTrueAlwaysTrueSpendRedeemerSchema, value);
  }
}
type __AlwaysTrueAlwaysTrueElseRedeemerData = PlutusData & { readonly __AlwaysTrueAlwaysTrueElseRedeemer: "__AlwaysTrueAlwaysTrueElseRedeemerData" };
const __AlwaysTrueAlwaysTrueElseRedeemerSchema = TPlutusData;
type __AlwaysTrueAlwaysTrueElseRedeemerInput = Exact<typeof __AlwaysTrueAlwaysTrueElseRedeemerSchema>;

export class AlwaysTrueAlwaysTrueElse extends TypedScript<PlutusData, __AlwaysTrueAlwaysTrueElseRedeemerData> {
  constructor() {
    const Script = cborToScript(
      "585c01010029800aba2aba1aab9eaab9dab9a4888896600264653001300600198031803800cc0180092225980099b8748008c01cdd500144c8cc892898050009805180580098041baa0028b200c180300098019baa0068a4d13656400401",
      "PlutusV3"
    );
    super(Script, "always_true.always_true.else");
  }

  redeemer(value: __AlwaysTrueAlwaysTrueElseRedeemerInput): __AlwaysTrueAlwaysTrueElseRedeemerData {
    return serializeContractData<__AlwaysTrueAlwaysTrueElseRedeemerData>(__AlwaysTrueAlwaysTrueElseRedeemerSchema, value);
  }
}