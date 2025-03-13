// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { type Script } from "@blaze-cardano/core";
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";


export type ByteArray = string;
export type Data = any;
export type Int = bigint;


export interface AlwaysTrueScriptSpend {
  scriptBytes: string;
  new(_param1: Int,
  _param2: ByteArray): Script;
  _datum: Array<Int>;
  _redeemer: Int;
}
export const AlwaysTrueScriptSpend = Object.assign(
  function (_param1: Int,_param2: ByteArray) {
    return cborToScript(
      applyParamsToScript(
        AlwaysTrueScriptSpend.scriptBytes, 
        [_param1, _param2],
        {"dataType":"list","items":[{"dataType":"integer"},{"dataType":"bytes"}]} as any,
      ),
      "PlutusV3",
    );
  },
  { scriptBytes: "58650101003232323232232232253330063232323232533300b3370e900118061baa0011323322324a26eb4014c03c004c03cc040004c034dd50008b1806980700198060011805801180580098041baa00114984d958dd70009bad0015734aae7555cf2ba15745" },
  { _datum: {"dataType":"list","items":{"dataType":"integer"}} },
  { _redeemer: {"dataType":"integer"} },
) as unknown as AlwaysTrueScriptSpend;


export interface AlwaysTrueScriptElse {
  scriptBytes: string;
  new(_param1: Int,
  _param2: ByteArray): Script;
  undefined: any;
}
export const AlwaysTrueScriptElse = Object.assign(
  function (_param1: Int,_param2: ByteArray) {
    return cborToScript(
      applyParamsToScript(
        AlwaysTrueScriptElse.scriptBytes, 
        [_param1, _param2],
        {"dataType":"list","items":[{"dataType":"integer"},{"dataType":"bytes"}]} as any,
      ),
      "PlutusV3",
    );
  },
  { scriptBytes: "58650101003232323232232232253330063232323232533300b3370e900118061baa0011323322324a26eb4014c03c004c03cc040004c034dd50008b1806980700198060011805801180580098041baa00114984d958dd70009bad0015734aae7555cf2ba15745" },
  { undefined: {} },
) as unknown as AlwaysTrueScriptElse;


export interface NestedSometimesTrueScriptSpend {
  scriptBytes: string;
  new(param: Int): Script;
  datum: Data;
  redeemer: Int;
}
export const NestedSometimesTrueScriptSpend = Object.assign(
  function (param: Int) {
    return cborToScript(
      applyParamsToScript(
        NestedSometimesTrueScriptSpend.scriptBytes, 
        [param],
        {"dataType":"list","items":[{"dataType":"integer"}]} as any,
      ),
      "PlutusV3",
    );
  },
  { scriptBytes: "5862010100323232323223225333004323232323253330093370e900118051baa0011323322337100146eb4014c034004c034c038004c02cdd50008b1805980600198050011804801180480098031baa00114984d958dd6800ab9a5573aaae795d0aba21" },
  { datum: {"title":"Data","description":"Any Plutus data."} },
  { redeemer: {"dataType":"integer"} },
) as unknown as NestedSometimesTrueScriptSpend;


export interface NestedSometimesTrueScriptElse {
  scriptBytes: string;
  new(param: Int): Script;
  undefined: any;
}
export const NestedSometimesTrueScriptElse = Object.assign(
  function (param: Int) {
    return cborToScript(
      applyParamsToScript(
        NestedSometimesTrueScriptElse.scriptBytes, 
        [param],
        {"dataType":"list","items":[{"dataType":"integer"}]} as any,
      ),
      "PlutusV3",
    );
  },
  { scriptBytes: "5862010100323232323223225333004323232323253330093370e900118051baa0011323322337100146eb4014c034004c034c038004c02cdd50008b1805980600198050011804801180480098031baa00114984d958dd6800ab9a5573aaae795d0aba21" },
  { undefined: {} },
) as unknown as NestedSometimesTrueScriptElse;
