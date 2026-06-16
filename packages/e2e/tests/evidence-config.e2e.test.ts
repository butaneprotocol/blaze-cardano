import { describe, expect, it } from "vitest";

const requiredForFullProviderEvidence = [
  "SEED_MNEMONIC",
  "BLOCKFROST_KEY",
  "KUPO_URL",
  "OGMIOS_URL",
  "MAESTRO_KEY",
] as const;

describe("e2e evidence configuration", () => {
  it("requires every provider credential for full Catalyst provider evidence", () => {
    if (process.env["BLAZE_FULL_PROVIDER_E2E"] !== "true") {
      expect(true).toBe(true);
      return;
    }

    const missing = requiredForFullProviderEvidence.filter(
      (name) => !process.env[name],
    );

    expect(missing).toEqual([]);
  });
});
