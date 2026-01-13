import * as fs from "fs";
import {
  OneshotOneshotSpend,
  TreasuryTreasuryPublish,
  TreasuryTreasurySpend,
  TreasuryTreasuryVote,
  TreasuryTreasuryWithdraw,
  type TreasuryConfiguration,
} from "./plutus";

const mockPermissions: TreasuryConfiguration["permissions"] = {
  disburse: {
    Signature: {
      key_hash:
        "78b0eff557a5468f74ca5cc03a55ad3f9310568a037f9b295360b9e9316c953d",
    },
  },
  fund: {
    Signature: {
      key_hash:
        "78b0eff557a5468f74ca5cc03a55ad3f9310568a037f9b295360b9e9316c953d",
    },
  },
  reorganize: {
    Signature: {
      key_hash:
        "78b0eff557a5468f74ca5cc03a55ad3f9310568a037f9b295360b9e9316c953d",
    },
  },
  sweep: {
    Signature: {
      key_hash:
        "78b0eff557a5468f74ca5cc03a55ad3f9310568a037f9b295360b9e9316c953d",
    },
  },
};

describe("Generated code", () => {
  it("should not contain Type.Unsafe<PlutusData> to avoid TS2742 declaration emit errors", () => {
    const generatedCode = fs.readFileSync("./plutus.ts", "utf-8");
    expect(generatedCode).not.toContain("Type.Unsafe<PlutusData>");
    expect(generatedCode).toContain("type Data = Exact<typeof TPlutusData>");
  });
});

describe("Blueprint", () => {
  describe("TreasuryTreasuryPublish", () => {
    it("Should be able to construct a treasury publish script", () => {
      const publish = new TreasuryTreasuryPublish({
        expiration: 100n,
        payout_upperbound: 100n,
        permissions: mockPermissions,
        registry_token: "",
      });
      expect(publish).toBeDefined();
      expect(publish.Script.hash()).toBeDefined();
      expect(publish.Script.asPlutusV3()?.rawBytes()).toBeDefined();

      const allof = {
        After: {
          time: 100n,
        },
        Before: {
          time: 200n,
        },
        AllOf: {
          scripts: [
            {
              Signature: {
                key_hash: "",
              },
            },
            {
              Signature: {
                key_hash: "",
              },
            },
            {
              Signature: {
                key_hash: "",
              },
            },
          ],
        },
      };
      const publish2 = new TreasuryTreasuryPublish({
        expiration: 100n,
        payout_upperbound: 100n,
        permissions: {
          disburse: allof,
          fund: allof,
          reorganize: allof,
          sweep: allof,
        },
        registry_token: "12345678910123456789",
      });
      expect(publish2).toBeDefined();
      expect(publish2.Script.hash()).toBeDefined();
      expect(publish2.Script.asPlutusV3()?.rawBytes()).toBeDefined();

      expect(publish2.Script.asPlutusV3()?.toCbor()).toContain(
        "12345678910123456789",
      );
    });
  });

  describe("TreasuryTreasurySpend", () => {
    it("Should be able to construct a TreasuryTreasurySpend script", () => {
      const spend = new TreasuryTreasurySpend({
        expiration: 100n,
        payout_upperbound: 100n,
        permissions: mockPermissions,
        registry_token: "",
      });
      expect(spend).toBeDefined();
      expect(spend.Script.hash()).toBeDefined();
      expect(spend.Script.asPlutusV3()?.rawBytes()).toBeDefined();
    });
  });

  describe("TreasuryTreasuryVote", () => {
    it("should be able to construct a treasury vote script", () => {
      const spend = new TreasuryTreasuryVote({
        expiration: 100n,
        payout_upperbound: 100n,
        permissions: mockPermissions,
        registry_token: "",
      });
      expect(spend).toBeDefined();
      expect(spend.Script.hash()).toBeDefined();
      expect(spend.Script.asPlutusV3()?.rawBytes()).toBeDefined();
    });
  });

  describe("TreasuryTreasuryWithdraw", () => {
    it("should be able to construct a treasury withdraw script", () => {
      const spend = new TreasuryTreasuryWithdraw({
        expiration: 100n,
        payout_upperbound: 100n,
        permissions: mockPermissions,
        registry_token: "",
      });
      expect(spend).toBeDefined();
      expect(spend.Script.hash()).toBeDefined();
      expect(spend.Script.asPlutusV3()?.rawBytes()).toBeDefined();
    });
  });

  describe("OneshotOneshotSpend", () => {
    it("should be able to construct a oneshot spend script", () => {
      const spend = new OneshotOneshotSpend({
        output_index: 0n,
        transaction_id: "00".repeat(32),
      });
      expect(spend).toBeDefined();
      expect(spend.Script.hash()).toBeDefined();
      expect(spend.Script.asPlutusV3()?.rawBytes()).toBeDefined();
    });
  });
});
