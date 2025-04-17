/* eslint-disable */
// @ts-nocheck
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";
import { type Script } from "@blaze-cardano/core";
import { Type, Exact, TPlutusData } from "@blaze-cardano/data";
import { type PlutusData } from "@blaze-cardano/core";
type Data = PlutusData
type Int = bigint
type ByteArray = string

const Contracts = Type.Module({
});


export class AlwaysTrueScriptSpend {
  public Script: Script
  constructor(
    _param1: Int,
    _param2: ByteArray,
  ) {
    this.Script = cborToScript(
      applyParamsToScript(
        "58650101003232323232232232253330063232323232533300b3370e900118061baa0011323322324a26eb4014c03c004c03cc040004c034dd50008b1806980700198060011805801180580098041baa00114984d958dd70009bad0015734aae7555cf2ba15745",
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
        "58650101003232323232232232253330063232323232533300b3370e900118061baa0011323322324a26eb4014c03c004c03cc040004c034dd50008b1806980700198060011805801180580098041baa00114984d958dd70009bad0015734aae7555cf2ba15745",
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
export class NestedSometimesTrueScriptSpend {
  public Script: Script
  constructor(
    param: Int,
  ) {
    this.Script = cborToScript(
      applyParamsToScript(
        "5862010100323232323223225333004323232323253330093370e900118051baa0011323322337100146eb4014c034004c034c038004c02cdd50008b1805980600198050011804801180480098031baa00114984d958dd6800ab9a5573aaae795d0aba21",
        Type.Tuple([
          Type.BigInt(),
        ]),
        [
          param,
        ],
      ),
      "PlutusV3"
    );
  }
}
export class NestedSometimesTrueScriptElse {
  public Script: Script
  constructor(
    param: Int,
  ) {
    this.Script = cborToScript(
      applyParamsToScript(
        "5862010100323232323223225333004323232323253330093370e900118051baa0011323322337100146eb4014c034004c034c038004c02cdd50008b1805980600198050011804801180480098031baa00114984d958dd6800ab9a5573aaae795d0aba21",
        Type.Tuple([
          Type.BigInt(),
        ]),
        [
          param,
        ],
      ),
      "PlutusV3"
    );
  }
}