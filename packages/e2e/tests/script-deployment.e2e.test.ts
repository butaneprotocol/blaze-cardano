import { describe, expect, it } from "vitest";
import { HexBlob, PlutusV2Script, Script } from "@blaze-cardano/core";
import { Core, Blockfrost } from "@blaze-cardano/sdk";
import {
  MemoryScriptDeploymentCache,
  burnDeploymentAddress,
  defineScriptDeployment,
  deployScriptRefs,
  reconcileScriptDeployment,
} from "@blaze-cardano/deploy";
import { appendEvidenceSummary, inputRef } from "./summary";
import { walletFromMnemonic } from "./wallet";

const enabled =
  process.env["BLAZE_SCRIPT_DEPLOYMENT_E2E"] === "true" &&
  process.env["SEED_MNEMONIC"] &&
  process.env["BLOCKFROST_KEY"];

const describeIf = enabled ? describe : describe.skip;

describeIf("script deployment e2e", () => {
  it("deploys a reference script and reconciles it as reusable", async () => {
    const provider = new Blockfrost({
      network: "cardano-preview",
      projectId: process.env["BLOCKFROST_KEY"]!,
    });
    const wallet = await walletFromMnemonic(
      process.env["SEED_MNEMONIC"]!,
      provider,
    );
    const script = Script.newPlutusV2Script(
      new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const cache = new MemoryScriptDeploymentCache();
    const manifest = defineScriptDeployment({
      id: "e2e-reference-scripts",
      network: "cardano-preview",
      targets: [
        {
          name: "always-true",
          version: "1.0.0",
          script,
          address: burnDeploymentAddress(Core.NetworkId.Testnet),
        },
      ],
    });

    const result = await deployScriptRefs({
      manifest,
      provider,
      wallet,
      cache,
    });
    const plan = await reconcileScriptDeployment({ manifest, provider, cache });
    const record = result.records.find(
      (candidate) => candidate.name === "always-true",
    );

    expect(result.transactions.length).toBeGreaterThan(0);
    expect(result.records[0]?.status).toBe("matched");
    expect(plan.actions.map((action) => action.type)).toEqual(["reuse"]);
    expect(record?.txInput).toBeDefined();

    appendEvidenceSummary("Script deployment live e2e", [
      ["network", manifest.network],
      ["manifest", manifest.id],
      ["manifest hash", result.manifestHash],
      ["target", "always-true@1.0.0"],
      ["script hash", script.hash()],
      ["submitted transactions", result.transactions.join(", ")],
      ["record status", record?.status ?? "missing"],
      [
        "reference input",
        record?.txInput ? inputRef(record.txInput) : "missing",
      ],
      [
        "next reconciliation actions",
        plan.actions.map((action) => action.type).join(", "),
      ],
    ]);
  }, 180000);
});
