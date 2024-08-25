import {
  hardCodedProtocolParams,
  HexBlob,
  PlutusV3Script,
  Script,
} from "@blaze-cardano/core";
import { calculateReferenceScriptFee } from "../src";

describe("Fee Calculation", () => {
  it("should calculate the correct min fee for reference inputs", () => {
    const largeScript = HexBlob("0".repeat(163840)); // 80KiB hex string (80 * 1024 * 2)
    expect(
      Math.ceil(
        calculateReferenceScriptFee(
          [Script.newPlutusV3Script(new PlutusV3Script(largeScript))],
          hardCodedProtocolParams,
        ),
      ),
    ).toBe(4489380);
  });
});
