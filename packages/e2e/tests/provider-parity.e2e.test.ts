import { describe, expect, it } from "vitest";
import { Address, NetworkId } from "@blaze-cardano/core";
import { Blockfrost, Maestro } from "@blaze-cardano/sdk";
import { appendEvidenceSummary } from "./summary";
import { walletFromMnemonic } from "./wallet";

const fullProviderEvidence = process.env["BLAZE_FULL_PROVIDER_E2E"] === "true";

const enabled =
  (fullProviderEvidence ||
    process.env["BLAZE_PROVIDER_PARITY_E2E"] !== "false") &&
  (process.env["E2E_QUERY_ADDRESS"] || process.env["SEED_MNEMONIC"]) &&
  process.env["BLOCKFROST_KEY"] &&
  process.env["MAESTRO_KEY"];

const describeIf = enabled ? describe : describe.skip;

describeIf("provider parity e2e", () => {
  it("returns protocol parameters and UTxOs through Blockfrost and Maestro", async () => {
    const blockfrost = new Blockfrost({
      network: "cardano-preview",
      projectId: process.env["BLOCKFROST_KEY"]!,
    });
    const maestro = new Maestro({
      network: "preview",
      apiKey: process.env["MAESTRO_KEY"]!,
    });
    const address = process.env["E2E_QUERY_ADDRESS"]
      ? Address.fromBech32(process.env["E2E_QUERY_ADDRESS"])
      : (await walletFromMnemonic(process.env["SEED_MNEMONIC"]!, blockfrost))
          .address;

    const [blockfrostParams, maestroParams] = await Promise.all([
      blockfrost.getParameters(),
      maestro.getParameters(),
    ]);
    const [blockfrostUtxos, maestroUtxos] = await Promise.all([
      blockfrost.getUnspentOutputs(address),
      maestro.getUnspentOutputs(address),
    ]);

    expect(blockfrostParams.coinsPerUtxoByte).toBeGreaterThan(0);
    expect(maestroParams.coinsPerUtxoByte).toBeGreaterThan(0);
    expect(blockfrost.network).toBe(NetworkId.Testnet);
    expect(maestro.network).toBe(NetworkId.Testnet);
    expect(Array.isArray(blockfrostUtxos)).toBe(true);
    expect(Array.isArray(maestroUtxos)).toBe(true);

    appendEvidenceSummary("Provider parity live e2e", [
      ["network", "preview"],
      ["query address", address.toBech32()],
      ["Blockfrost coinsPerUtxoByte", blockfrostParams.coinsPerUtxoByte],
      ["Maestro coinsPerUtxoByte", maestroParams.coinsPerUtxoByte],
      ["Blockfrost UTxO count", blockfrostUtxos.length],
      ["Maestro UTxO count", maestroUtxos.length],
    ]);
  });
});
