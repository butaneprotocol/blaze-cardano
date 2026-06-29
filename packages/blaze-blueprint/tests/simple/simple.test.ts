import { describe, it, expect } from "vitest";
import * as fs from "fs";
import { HexBlob, PlutusData } from "@blaze-cardano/core";
import { TxBuilder, TypedScript, makeValue } from "@blaze-cardano/tx";
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

  it("should emit typed script classes and data serializers", () => {
    const generatedCode = fs.readFileSync("./plutus.ts", "utf-8");
    expect(generatedCode).toContain("extends TypedScript<");
    expect(generatedCode).toContain("super(Script, ");
    expect(generatedCode).toContain("datum(value:");
    expect(generatedCode).toContain("redeemer(value:");
    expect(generatedCode).not.toContain("public Script: Script");
  });
});

describe("Blueprint", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueSpend = new AlwaysTrueScriptSpend(1n, "test");
    expect(alwaysTrueSpend).toBeDefined();
    expect(alwaysTrueSpend).toBeInstanceOf(TypedScript);
    expect(alwaysTrueSpend.Script.hash()).toBeDefined();
    expect(alwaysTrueSpend.Script.asPlutusV3()?.rawBytes()).toBeDefined();

    const datum = alwaysTrueSpend.datum([1n, 2n]);
    const redeemer = alwaysTrueSpend.redeemer(1n);
    expect(datum.toCbor()).toBeDefined();
    expect(redeemer.toCbor()).toBeDefined();

    const acceptsTypedScript = (
      script: AlwaysTrueScriptSpend,
      typedDatum: ReturnType<AlwaysTrueScriptSpend["datum"]>,
    ) => {
      new TxBuilder({} as never).lockScriptAssets(
        script,
        makeValue(2_000_000n),
        typedDatum,
      );
    };
    void acceptsTypedScript;
  });

  it("Should have a valid else validator without a redeemer", async () => {
    const alwaysTrueElse = new AlwaysTrueScriptElse(1n, "test");
    expect(alwaysTrueElse).toBeDefined();
    expect(alwaysTrueElse).toBeInstanceOf(TypedScript);
    expect(alwaysTrueElse.Script.hash()).toBeDefined();
    expect(alwaysTrueElse.Script.asPlutusV3()?.rawBytes()).toBeDefined();

    const redeemer = alwaysTrueElse.redeemer(
      PlutusData.fromCbor(HexBlob("d87980")),
    );
    expect(redeemer.toCbor()).toBeDefined();
  });
});

describe("Blueprint no params", () => {
  it("Should be able to construct script", async () => {
    const alwaysTrueNoParamsSpend = new AlwaysTrueScriptNoParamsSpend();
    expect(alwaysTrueNoParamsSpend).toBeDefined();
    expect(alwaysTrueNoParamsSpend).toBeInstanceOf(TypedScript);
    expect(alwaysTrueNoParamsSpend.Script.hash()).toBeDefined();
    expect(
      alwaysTrueNoParamsSpend.Script.asPlutusV3()?.rawBytes(),
    ).toBeDefined();

    expect(alwaysTrueNoParamsSpend.datum([1n]).toCbor()).toBeDefined();
    expect(alwaysTrueNoParamsSpend.redeemer(1n).toCbor()).toBeDefined();
  });
});

describe("Nested blueprint", () => {
  it("Should be able to construct nested script", async () => {
    const sometimesTrueSpend = new NestedSometimesTrueScriptSpend(1n);
    expect(sometimesTrueSpend).toBeDefined();
    expect(sometimesTrueSpend).toBeInstanceOf(TypedScript);
    expect(sometimesTrueSpend.Script.hash()).toBeDefined();
    expect(sometimesTrueSpend.Script.asPlutusV3()?.rawBytes()).toBeDefined();

    const datum = sometimesTrueSpend.datum(
      PlutusData.fromCbor(HexBlob("d87980")),
    );
    expect(datum.toCbor()).toBeDefined();
    expect(sometimesTrueSpend.redeemer(1n).toCbor()).toBeDefined();
  });
});
