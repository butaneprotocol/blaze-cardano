import { describe, expect, it } from "vitest";
import { NetworkId } from "@blaze-cardano/core";
import { Unwrapped } from "@blaze-cardano/ogmios";
import { Kupmios } from "@blaze-cardano/sdk";
import { appendEvidenceSummary } from "./summary";

const fullProviderEvidence = process.env["BLAZE_FULL_PROVIDER_E2E"] === "true";

const enabled =
  (fullProviderEvidence || process.env["BLAZE_KUPMIOS_E2E"] !== "false") &&
  process.env["KUPO_URL"] &&
  process.env["OGMIOS_URL"];

const describeIf = enabled ? describe : describe.skip;

describeIf("kupmios provider e2e", () => {
  it("loads live protocol parameters through Ogmios", async () => {
    const ogmios = await Unwrapped.Ogmios.new(process.env["OGMIOS_URL"]!);

    try {
      const provider = new Kupmios(process.env["KUPO_URL"]!, ogmios);
      const params = await provider.getParameters();

      expect(provider.network).toBe(NetworkId.Testnet);
      expect(params.coinsPerUtxoByte).toBeGreaterThan(0);
      expect(params.minFeeCoefficient).toBeGreaterThan(0);
      expect(params.protocolVersion.major).toBeGreaterThan(0);

      appendEvidenceSummary("Kupmios live e2e", [
        ["network", "preview"],
        ["coinsPerUtxoByte", params.coinsPerUtxoByte],
        ["minFeeCoefficient", params.minFeeCoefficient],
        [
          "protocol version",
          `${params.protocolVersion.major}.${params.protocolVersion.minor}`,
        ],
      ]);
    } finally {
      ogmios.connect().close();
    }
  }, 60000);
});
