import { AlwaysTrueSpend } from "./plutus";

describe("Blueprint", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueSpend = new AlwaysTrueSpend(1n, "test");
    expect(alwaysTrueSpend).toBeDefined();
    expect(alwaysTrueSpend.hash()).toBeDefined();
    expect(alwaysTrueSpend.asPlutusV2()?.rawBytes()).toBeDefined();
  });
});
