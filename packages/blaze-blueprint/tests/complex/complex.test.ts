import { TreasuryTreasuryPublish } from "./plutus";

describe("Blueprint", () => {
  describe("TreasuryTreasuryPublish", () => {
    it("Should be able to construct script", async () => {
      const publish = new TreasuryTreasuryPublish({
        expiration: 100n,
        payout_upperbound: 100n,
        permissions: {
          disburse: {
            Signature: {
              key_hash: "",
            },
          },
          fund: {
            Signature: {
              key_hash: "",
            },
          },
          reorganize: {
            Signature: {
              key_hash: "",
            },
          },
          sweep: {
            Signature: {
              key_hash: "",
            },
          },
        },
        registry_token: "",
      });
      expect(publish).toBeDefined();
      expect(publish.Script.hash()).toBeDefined();
      expect(publish.Script.asPlutusV3()?.rawBytes()).toBeDefined();
    });
  });
});
