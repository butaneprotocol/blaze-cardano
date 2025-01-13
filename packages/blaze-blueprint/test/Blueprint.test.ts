import {
  AlwaysTrueScriptSpend,
  AlwaysTrueScriptElse,
  NestedSometimesTrueScriptSpend,
} from "./plutus";

describe("Blueprint", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueSpend = new AlwaysTrueScriptSpend(1n, "test");
    expect(alwaysTrueSpend).toBeDefined();
    expect(alwaysTrueSpend.hash()).toBeDefined();
    expect(alwaysTrueSpend.asPlutusV3()?.rawBytes()).toBeDefined();
    expect(AlwaysTrueScriptSpend).toHaveProperty("_redeemer");
  });
  it("Should have a valid else validator without a redeemer", async () => {
    const alwaysTrueElse = new AlwaysTrueScriptElse(1n, "test");
    expect(alwaysTrueElse).toBeDefined();
    expect(alwaysTrueElse.hash()).toBeDefined();
    expect(alwaysTrueElse.asPlutusV3()?.rawBytes()).toBeDefined();
    expect(AlwaysTrueScriptElse).not.toHaveProperty("_redeemer");
  });
});

describe("Nested blueprint", () => {
  it("Should be able to construct nested script", async () => {
    const sometimesTrueSpend = new NestedSometimesTrueScriptSpend(1n);
    expect(sometimesTrueSpend).toBeDefined();
    expect(sometimesTrueSpend.hash()).toBeDefined();
    expect(sometimesTrueSpend.asPlutusV3()?.rawBytes()).toBeDefined();
  });
});
