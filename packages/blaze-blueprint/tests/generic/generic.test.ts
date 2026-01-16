import * as fs from "fs";
import {
  AlwaysTrueWithGenericScriptSpend,
  AlwaysTrueWithGenericScriptElse,
  NestedSometimesTrueScriptSpend,
  AlwaysTrueWithGenericScriptNoParamsSpend,
  GenericType_OutputReference,
} from "./plutus";
import { Generator } from "../../src/blueprint";

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

describe("Generator.normalizeTypeName", () => {
  let generator: Generator;

  beforeEach(() => {
    generator = new Generator();
  });

  describe("with schema metadata (preferred approach)", () => {
    it("should extract type params from Tuple schema items array", () => {
      const definitionName =
        "Tuple$aiken/crypto/VerificationKey_lib_b/types/SignedMessage";
      const schema = {
        title: "Tuple",
        dataType: "list" as const,
        items: [
          { $ref: "#/definitions/aiken~1crypto~1VerificationKey" },
          { $ref: "#/definitions/lib_b~1types~1SignedMessage" },
        ],
      };

      const result = generator.normalizeTypeName(definitionName, schema);
      expect(result).toBe("Tuple_VerificationKey_SignedMessage");
    });

    it("should extract type params from Map/Pairs schema keys and values", () => {
      const definitionName = "Pairs$Int_Int";
      const schema = {
        title: "Pairs<Int, Int>",
        dataType: "map" as const,
        keys: { $ref: "#/definitions/Int" },
        values: { $ref: "#/definitions/Int" },
      };

      const result = generator.normalizeTypeName(definitionName, schema);
      expect(result).toBe("Pairs_Int_Int");
    });

    it("should extract type params from List schema items", () => {
      const definitionName = "List$v0_3/types/Request";
      const schema = {
        dataType: "list" as const,
        items: { $ref: "#/definitions/v0_3~1types~1Request" },
      };

      const result = generator.normalizeTypeName(definitionName, schema);
      expect(result).toBe("List_Request");
    });

    it("should handle Tuple with module paths containing underscores", () => {
      // This is the key test case - module_name has an underscore followed by lowercase
      // Without schema metadata, the old regex approach would incorrectly split at _n
      const definitionName =
        "Tuple$module_name/types/TypeA_other_module/types/TypeB";
      const schema = {
        title: "Tuple",
        dataType: "list" as const,
        items: [
          { $ref: "#/definitions/module_name~1types~1TypeA" },
          { $ref: "#/definitions/other_module~1types~1TypeB" },
        ],
      };

      const result = generator.normalizeTypeName(definitionName, schema);
      expect(result).toBe("Tuple_TypeA_TypeB");
    });
  });

  describe("without schema metadata (fallback to string parsing)", () => {
    it("should handle simple generic types without schema", () => {
      const result = generator.normalizeTypeName("Option$ByteArray");
      expect(result).toBe("Option_ByteArray");
    });

    it("should handle versioned module names (v0_3) correctly", () => {
      // The underscore in v0_3 is followed by a digit, not a lowercase letter
      // So it should NOT be split as a type parameter separator
      const result = generator.normalizeTypeName(
        "v0_3/types/SignedPayload$v0_3/types/ProtocolRedeemer",
      );
      expect(result).toBe("SignedPayload_ProtocolRedeemer");
    });
  });

  describe("regular (non-generic) types", () => {
    it("should return the last segment for simple types", () => {
      const result = generator.normalizeTypeName("Int");
      expect(result).toBe("Int");
    });

    it("should return the last segment for module path types", () => {
      const result = generator.normalizeTypeName("v0_3/types/ProtocolRedeemer");
      expect(result).toBe("ProtocolRedeemer");
    });

    it("should return the last segment for nested module paths", () => {
      const result = generator.normalizeTypeName(
        "cardano/transaction/OutputReference",
      );
      expect(result).toBe("OutputReference");
    });
  });
});
