import { AlwaysTrueSpend, NestedSometimesTrueSpend } from "./plutus";

describe("Blueprint", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueSpend = new AlwaysTrueSpend(1n, "test");
    expect(alwaysTrueSpend).toBeDefined();
    expect(alwaysTrueSpend.hash()).toBeDefined();
    expect(alwaysTrueSpend.asPlutusV2()?.rawBytes()).toBeDefined();
  });
});

describe("Nested blueprint", () => {
  it("Should be able to construct nested script", async () => {
    const sometimesTrueSpend = new NestedSometimesTrueSpend(1n);
    expect(sometimesTrueSpend).toBeDefined();
    expect(sometimesTrueSpend.hash()).toBeDefined();
    expect(sometimesTrueSpend.asPlutusV2()?.rawBytes()).toBeDefined();
  });
});
