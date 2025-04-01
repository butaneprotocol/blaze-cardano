import {
  Address,
  AuxiliaryData,
  hardCodedProtocolParams,
  HexBlob,
  PlutusV3Script,
  Script,
  TransactionOutput,
} from "@blaze-cardano/core";
import * as value from "../src/value";
import {
  assertLockAddress,
  assertPaymentsAddress,
  bigintMax,
  calculateMinAda,
  calculateReferenceScriptFee,
  getAuxiliaryDataHash,
  insertSorted,
} from "../src";

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
      value.makeValue(100_000n),
    );

    expect(
      calculateMinAda(
        output,
        hardCodedProtocolParams.coinsPerUtxoByte,
      ).toString(),
    ).toEqual("969750");

    expect(calculateMinAda(output, 5000).toString()).toEqual("1125000");
  });
});

describe("insertSorted", () => {
  it("should correctly insert and sort an array", () => {
    expect(insertSorted([], "abc")).toEqual(0);
    expect(insertSorted(["abc"], "aac")).toEqual(0);
    expect(insertSorted(["abc"], "acc")).toEqual(1);
    expect(insertSorted(["abc", "def"], "abcc")).toEqual(1);
    expect(insertSorted(["123", "abc"], "45")).toEqual(1);
  });
});

describe("getAuxiliaryDataHash", () => {
  it("should generate a hash from AuxiliaryData", () => {
    const metadata = new Map([[1n, "testString"]]);
    const auxiliaryData = AuxiliaryData.fromCore({
      blob: metadata,
    });
    const hash = getAuxiliaryDataHash(auxiliaryData);
    expect(hash).toEqual(
      "a89276fe701c8b7252df20ca28f52ba75f1f09c9c02f443ecd13267aa8b5d63b",
    );
    expect(hash.length).toEqual(64);
  });
});

describe("assertPaymentAddress", () => {
  it("should not throw if we're using a payment address", () => {
    const address = Address.fromBech32(
      "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
    );
    expect(() => assertPaymentsAddress(address)).not.toThrow();
  });

  it("should throw if we're using a script address", () => {
    const script = Address.fromBech32(
      "addr_test1xpz2r6ednav2m48tryet6qzgu6segl59u0ly7v54dggsg9xvy7vq4p2hl6wm9jdvpgn80ax3xpkm7yrgnxphtrct3klq005j2r",
    );
    expect(() => assertPaymentsAddress(script)).toThrow();
  });
});

describe("assertLockAddress", () => {
  it("should not throw if we're using a script address", () => {
    const script = Address.fromBech32(
      "addr_test1xpz2r6ednav2m48tryet6qzgu6segl59u0ly7v54dggsg9xvy7vq4p2hl6wm9jdvpgn80ax3xpkm7yrgnxphtrct3klq005j2r",
    );
    expect(() => assertLockAddress(script)).not.toThrow();
  });

  it("should throw if we're using a payment address", () => {
    const address = Address.fromBech32(
      "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
    );
    expect(() => assertLockAddress(address)).toThrow();
  });
});

describe("bigintMax", () => {
  it("should work correctly", () => {
    expect(bigintMax(1n, 2n)).toEqual(2n);
    expect(bigintMax(-1n, 0n)).toEqual(0n);
    expect(bigintMax(100n, 100n)).toEqual(100n);
  });
});
