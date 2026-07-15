import { describe, expect, it } from "vitest";
import { HexBlob, PlutusV2Script, Script } from "@blaze-cardano/core";
import {
  MemoryScriptDeploymentCache,
  defineScriptDeployment,
  deployScriptRefs,
  reconcileScriptDeployment,
} from "@blaze-cardano/deploy";
import { Emulator, EmulatorProvider } from "@blaze-cardano/emulator";
import { makeValue } from "@blaze-cardano/tx";

describe("script deployment emulator e2e", () => {
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
      expect(result.records[0]?.utxo?.output().scriptRef()?.hash()).toBe(
        script.hash(),
      );
      expect(cache.findByName("always-true")).toMatchObject({
        status: "matched",
        scriptHash: script.hash(),
      });
      expect(nextPlan.actions).toMatchObject([{ type: "reuse" }]);
    });
  });
});
