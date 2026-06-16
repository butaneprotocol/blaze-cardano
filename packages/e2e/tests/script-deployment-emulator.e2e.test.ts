import { describe, expect, it } from "vitest";
import { HexBlob, PlutusV2Script, Script } from "@blaze-cardano/core";
import { Emulator, EmulatorProvider } from "@blaze-cardano/emulator";
import { makeValue } from "@blaze-cardano/tx";
import {
  MemoryScriptDeploymentCache,
  defineScriptDeployment,
  deployScriptRefs,
  reconcileScriptDeployment,
} from "@blaze-cardano/deploy";
import { appendEvidenceSummary, inputRef } from "./summary";

describe("script deployment emulator integration", () => {
  it("deploys a reference script and reconciles the next run as reuse", async () => {
    const emulator = new Emulator([]);
    const deploymentAddress = await emulator.register(
      "deployer",
      makeValue(100_000_000n),
    );
    const provider = new EmulatorProvider(emulator);
    const script = Script.newPlutusV2Script(
      new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const cache = new MemoryScriptDeploymentCache();
    const manifest = defineScriptDeployment({
      id: "emulator-e2e-reference-scripts",
      network: "cardano-preview",
      targets: [
        {
          name: "always-true",
          version: "1.0.0",
          script,
          address: deploymentAddress,
        },
      ],
    });

    await emulator.as("deployer", async (blaze) => {
      const result = await deployScriptRefs({
        manifest,
        provider,
        wallet: blaze.wallet,
        cache,
      });
      const nextPlan = await reconcileScriptDeployment({
        manifest,
        provider,
        cache,
      });

      expect(result.transactions).toHaveLength(1);
      expect(result.records).toMatchObject([
        {
          name: "always-true",
          version: "1.0.0",
          status: "matched",
          scriptHash: script.hash(),
        },
      ]);
      expect(cache.findByName("always-true")).toMatchObject({
        status: "matched",
        scriptHash: script.hash(),
      });
      expect(nextPlan.actions).toMatchObject([{ type: "reuse" }]);

      const record = result.records[0];
      appendEvidenceSummary("Script deployment emulator e2e", [
        ["network", manifest.network],
        ["manifest", manifest.id],
        ["manifest hash", result.manifestHash],
        ["target", "always-true@1.0.0"],
        ["script hash", script.hash()],
        ["transactions", result.transactions.join(", ")],
        ["record status", record?.status ?? "missing"],
        [
          "reference input",
          record?.txInput ? inputRef(record.txInput) : "missing",
        ],
        [
          "next reconciliation actions",
          nextPlan.actions.map((action) => action.type).join(", "),
        ],
      ]);
    });
  });
});
