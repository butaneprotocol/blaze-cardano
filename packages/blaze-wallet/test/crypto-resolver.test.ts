import { describe, expect, it } from "vitest";
import {
  getCryptoFunctions,
  resetCryptoFunctionsForTesting,
} from "../src/crypto";

describe("crypto resolver", () => {
  it("returns a complete function set in every environment", async () => {
    resetCryptoFunctionsForTesting();
    const cryptoFunctions = await getCryptoFunctions();

    expect(["browser", "nodejs", "fallback"]).toContain(
      cryptoFunctions.environment,
    );
    expect(cryptoFunctions.createCborWriter).toBeTypeOf("function");
    expect(cryptoFunctions.signEd25519).toBeTypeOf("function");
    expect(cryptoFunctions.randomBytes).toBeTypeOf("function");
    expect(cryptoFunctions.sha256).toBeTypeOf("function");

    expect(cryptoFunctions.randomBytes(32)).toHaveLength(32);
    await expect(
      cryptoFunctions.sha256(new Uint8Array([1, 2, 3])),
    ).resolves.toHaveLength(32);
  });
});
