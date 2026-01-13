import * as fs from "fs";
import {
  AlwaysTrueWithGenericScriptSpend,
  AlwaysTrueWithGenericScriptElse,
  NestedSometimesTrueScriptSpend,
  AlwaysTrueWithGenericScriptNoParamsSpend,
  GenericType_OutputReference,
} from "./plutus";

describe("Generated code", () => {
  it("should not contain Type.Unsafe<PlutusData> to avoid TS2742 declaration emit errors", () => {
    const generatedCode = fs.readFileSync("./plutus.ts", "utf-8");
    expect(generatedCode).not.toContain("Type.Unsafe<PlutusData>");
    expect(generatedCode).toContain("type Data = Exact<typeof TPlutusData>");
  });

  it("should generate generic types with clean underscore-separated names", () => {
    const generatedCode = fs.readFileSync("./plutus.ts", "utf-8");
    // Generic type should be named "GenericType_OutputReference" (GenericType<OutputReference>)
    expect(generatedCode).toContain("GenericType_OutputReference");
    // Should NOT contain $ in type names (old naming convention)
    expect(generatedCode).not.toMatch(/GenericType\$[a-zA-Z]/);
    // Should NOT contain full module paths in names
    expect(generatedCode).not.toContain(
      "GenericType_cardano_transaction_OutputReference",
    );
  });

  it("should handle module names with underscores correctly", () => {
    // This test documents the expected behavior for module names containing underscores
    // like "v0_3" - the underscore should NOT be treated as a type parameter separator
    // because it's followed by a digit, not a lowercase letter (module path start)
    //
    // Example: "v0_3/types/SignedRedeemer$v0_3/types/ExtraProtocolRedeemer"
    // Should produce: "SignedRedeemer_ExtraProtocolRedeemer"
    // NOT: "SignedRedeemer_v0_ExtraProtocolRedeemer" (bug if underscore in "v0_3" is split)
    //
    // The regex /_(?=[a-z])/ ensures we only split on underscore followed by lowercase
    // letter, which indicates a new module path, not part of a versioned module name
    const generatedCode = fs.readFileSync("./plutus.ts", "utf-8");
    // Verify no type names contain version numbers as separate segments
    expect(generatedCode).not.toMatch(/GenericType_v\d+_/);
  });

  it("should export the generic type", () => {
    // Verify the exported type exists and has the correct structure
    expect(GenericType_OutputReference).toBeDefined();
  });
});

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

  it("Should generate the correct generic types", async () => {
    /**
     * Checking type generation is a bit limited here, so we use workarounds.
     * Ideally, we would migrate to Bun and use their type assertions:
     * @link https://bun.com/docs/test/writing-tests#type-testing
     *
     * For now, we rely on compile errors being thrown.
     */

    // Type test: ensure the third parameter type has correct structure
    type ThirdParam = ConstructorParameters<
      typeof AlwaysTrueWithGenericScriptSpend
    >[2];

    // This should compile if types are correct
    const validParam: ThirdParam = {
      action: {
        output_index: 5n,
        transaction_id: "0".repeat(64),
      },
    };

    // Verify type structure at runtime
    expect(validParam).toHaveProperty("action");
    expect(validParam.action).toHaveProperty("output_index");
    expect(validParam.action).toHaveProperty("transaction_id");

    // Ensure the object can be used to construct the script
    const script = new AlwaysTrueWithGenericScriptSpend(1n, "test", validParam);
    expect(script).toBeDefined();
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
