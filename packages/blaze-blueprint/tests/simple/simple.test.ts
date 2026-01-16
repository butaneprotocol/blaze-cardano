import * as fs from "fs";
import {
  AlwaysTrueScriptSpend,
  AlwaysTrueScriptElse,
  NestedSometimesTrueScriptSpend,
  AlwaysTrueScriptNoParamsSpend,
} from "./plutus";

describe("Generated code", () => {
  it("should not contain Type.Unsafe<PlutusData> to avoid TS2742 declaration emit errors", () => {
    const generatedCode = fs.readFileSync("./plutus.ts", "utf-8");
    expect(generatedCode).not.toContain("Type.Unsafe<PlutusData>");
    expect(generatedCode).toContain("type Data = Exact<typeof TPlutusData>");
  });
});

describe("Blueprint", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueSpend = new AlwaysTrueScriptSpend(1n, "test");
    expect(alwaysTrueSpend).toBeDefined();
    expect(alwaysTrueSpend.Script.hash()).toBeDefined();
    expect(alwaysTrueSpend.Script.asPlutusV3()?.rawBytes()).toBeDefined();
  });
  it("Should have a valid else validator without a redeemer", async () => {
    const alwaysTrueElse = new AlwaysTrueScriptElse(1n, "test");
    expect(alwaysTrueElse).toBeDefined();
    expect(alwaysTrueElse.Script.hash()).toBeDefined();
    expect(alwaysTrueElse.Script.asPlutusV3()?.rawBytes()).toBeDefined();
  });
});

describe("Blueprint no params", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueNoParamsSpend = new AlwaysTrueScriptNoParamsSpend();
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
