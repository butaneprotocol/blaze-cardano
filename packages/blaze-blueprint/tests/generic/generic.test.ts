import {
  AlwaysTrueWithGenericScriptSpend,
  AlwaysTrueWithGenericScriptElse,
  NestedSometimesTrueScriptSpend,
  AlwaysTrueWithGenericScriptNoParamsSpend,
} from "./plutus";

describe("Blueprint", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueSpend = new AlwaysTrueWithGenericScriptSpend(1n, "test", {
      action: {
        output_index: 5n,
        transaction_id: "0".repeat(64),
      },
    });
    expect(alwaysTrueSpend).toBeDefined();
    expect(alwaysTrueSpend.Script.hash()).toBeDefined();
    expect(alwaysTrueSpend.Script.asPlutusV3()?.rawBytes()).toBeDefined();
  });
  it("Should have a valid else validator without a redeemer", async () => {
    const alwaysTrueElse = new AlwaysTrueWithGenericScriptElse(1n, "test", {
      action: {
        output_index: 5n,
        transaction_id: "",
      },
    });
    expect(alwaysTrueElse).toBeDefined();
    expect(alwaysTrueElse.Script.hash()).toBeDefined();
    expect(alwaysTrueElse.Script.asPlutusV3()?.rawBytes()).toBeDefined();
  });
});

describe("Blueprint no params", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueNoParamsSpend =
      new AlwaysTrueWithGenericScriptNoParamsSpend();
    expect(alwaysTrueNoParamsSpend).toBeDefined();
    expect(alwaysTrueNoParamsSpend.Script.hash()).toBeDefined();
    expect(
      alwaysTrueNoParamsSpend.Script.asPlutusV3()?.rawBytes(),
    ).toBeDefined();
  });
});

describe("Nested blueprint", () => {
  it("Should be able to construct nested script", async () => {
    const sometimesTrueSpend = new NestedSometimesTrueScriptSpend(1n);
    expect(sometimesTrueSpend).toBeDefined();
    expect(sometimesTrueSpend.Script.hash()).toBeDefined();
    expect(sometimesTrueSpend.Script.asPlutusV3()?.rawBytes()).toBeDefined();
  });
});
