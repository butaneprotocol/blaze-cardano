import {
  Address,
  hardCodedProtocolParams,
  HexBlob,
  PlutusV3Script,
  Script,
  TransactionOutput,
} from "@blaze-cardano/core";
import * as value from "../src/value";
import { calculateMinAda, calculateReferenceScriptFee } from "../src";

describe("Fee Calculation", () => {
  it("should calculate the correct min fee for reference inputs", () => {
    const largeScript = HexBlob("0".repeat(163840)); // 80KiB hex string (80 * 1024 * 2)
    expect(
      Math.ceil(
        calculateReferenceScriptFee(
          [Script.newPlutusV3Script(new PlutusV3Script(largeScript))],
          {
            ...hardCodedProtocolParams,
            minFeeReferenceScripts:
              hardCodedProtocolParams.minFeeReferenceScripts && {
                ...hardCodedProtocolParams.minFeeReferenceScripts,
                base: 44,
              },
          },
        ),
      ),
    ).toBe(4489380);
  });

  it("should calculate the correct minADA when a different coinsPerUtxoByte param is provided", () => {
    const output = new TransactionOutput(
      Address.fromBech32(
        "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      ),
      value.makeValue(100_000n)
    )

    expect(
      calculateMinAda(
        output,
      ).toString()
    ).toEqual("969750")

    expect(
      calculateMinAda(
        output,
        5000
      ).toString()
    ).toEqual("1125000")
  })
});
