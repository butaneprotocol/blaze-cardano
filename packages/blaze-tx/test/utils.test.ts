import {
  Address,
  hardCodedProtocolParams,
  HexBlob,
  PlutusV3Script,
  Script,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  Value,
} from "@blaze-cardano/core";
import { calculateReferenceScriptFee } from "../src";

describe("Fee Calculation", () => {
  it("should calculate the correct min fee for reference inputs", () => {
    const largeScript = HexBlob("0".repeat(163840)); // 80KiB hex string (80 * 1024 * 2)
    const refUtxo = new TransactionOutput(
      Address.fromBech32(
        "addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4",
      ),
      new Value(0n),
    );
    refUtxo.setScriptRef(
      Script.newPlutusV3Script(new PlutusV3Script(largeScript)),
    );
    expect(
      Math.ceil(
        calculateReferenceScriptFee(
          [
            new TransactionUnspentOutput(
              new TransactionInput(TransactionId("00".repeat(32)), 0n),
              refUtxo,
            ),
          ],
          hardCodedProtocolParams,
        ),
      ),
    ).toBe(4489380);
  });
});
