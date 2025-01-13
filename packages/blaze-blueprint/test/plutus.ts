// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { type Script } from "@blaze-cardano/core";
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";
import { type PlutusData } from "@blaze-cardano/core";

export interface AlwaysTrueScriptSpend {
  new (_param1: bigint, _param2: string): Script;
  _datum: Array<bigint>;
  _redeemer: bigint;
}

export const AlwaysTrueScriptSpend = Object.assign(
  function (_param1: bigint, _param2: string) {
    return cborToScript(
      applyParamsToScript(
        "58650101003232323232232232253330063232323232533300b3370e900118061baa0011323322324a26eb4014c03c004c03cc040004c034dd50008b1806980700198060011805801180580098041baa00114984d958dd70009bad0015734aae7555cf2ba15745",
        [_param1, _param2],
        {
          dataType: "list",
          items: [{ dataType: "integer" }, { dataType: "bytes" }],
        } as any,
      ),
      "PlutusV3",
    );
  },
  { _datum: { dataType: "list", items: { dataType: "integer" } } },
  { _redeemer: { dataType: "integer" } },
) as unknown as AlwaysTrueScriptSpend;

export interface AlwaysTrueScriptElse {
  new (_param1: bigint, _param2: string): Script;
}

export const AlwaysTrueScriptElse = Object.assign(function (
  _param1: bigint,
  _param2: string,
) {
  return cborToScript(
    applyParamsToScript(
      "58650101003232323232232232253330063232323232533300b3370e900118061baa0011323322324a26eb4014c03c004c03cc040004c034dd50008b1806980700198060011805801180580098041baa00114984d958dd70009bad0015734aae7555cf2ba15745",
      [_param1, _param2],
      {
        dataType: "list",
        items: [{ dataType: "integer" }, { dataType: "bytes" }],
      } as any,
    ),
    "PlutusV3",
  );
}) as unknown as AlwaysTrueScriptElse;

export interface NestedSometimesTrueScriptSpend {
  new (param: bigint): Script;
  datum: PlutusData;
  redeemer: bigint;
}

export const NestedSometimesTrueScriptSpend = Object.assign(
  function (param: bigint) {
    return cborToScript(
      applyParamsToScript(
        "5862010100323232323223225333004323232323253330093370e900118051baa0011323322337100146eb4014c034004c034c038004c02cdd50008b1805980600198050011804801180480098031baa00114984d958dd6800ab9a5573aaae795d0aba21",
        [param],
        { dataType: "list", items: [{ dataType: "integer" }] } as any,
      ),
      "PlutusV3",
    );
  },
  { datum: { title: "Data", description: "Any Plutus data." } },
  { redeemer: { dataType: "integer" } },
) as unknown as NestedSometimesTrueScriptSpend;

export interface NestedSometimesTrueScriptElse {
  new (param: bigint): Script;
}

export const NestedSometimesTrueScriptElse = Object.assign(function (
  param: bigint,
) {
  return cborToScript(
    applyParamsToScript(
      "5862010100323232323223225333004323232323253330093370e900118051baa0011323322337100146eb4014c034004c034c038004c02cdd50008b1805980600198050011804801180480098031baa00114984d958dd6800ab9a5573aaae795d0aba21",
      [param],
      { dataType: "list", items: [{ dataType: "integer" }] } as any,
    ),
    "PlutusV3",
  );
}) as unknown as NestedSometimesTrueScriptElse;
