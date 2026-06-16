import {
  HexBlob,
  PlutusV2Script,
  Script,
  type Address,
} from "@blaze-cardano/core";
import { fileURLToPath } from "node:url";
import { Emulator, EmulatorProvider } from "@blaze-cardano/emulator";
import { makeValue } from "@blaze-cardano/tx";
import {
  MemoryScriptDeploymentCache,
  defineScriptDeployment,
  deployScriptRefs,
  reconcileScriptDeployment,
} from "@blaze-cardano/deploy";

const alwaysTrue = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

const manifest = (address: Address) =>
  defineScriptDeployment({
    id: "basic-script-demo",
    network: "cardano-preview",
    targets: [
      {
        name: "always-true",
        version: "1.0.0",
        script: alwaysTrue,
        address,
        metadata: {
          purpose: "reference-script-demo",
        },
      },
    ],
  });

export const runBasicScriptDeploymentDemo = async () => {
  const emulator = new Emulator([]);
  const deploymentAddress = await emulator.register(
    "deployer",
    makeValue(100_000_000n),
  );
  const cache = new MemoryScriptDeploymentCache();

  await emulator.as("deployer", async (blaze) => {
    const provider = blaze.provider as EmulatorProvider;
    const deployment = manifest(deploymentAddress);
    const result = await deployScriptRefs({
      manifest: deployment,
      provider,
      wallet: blaze.wallet,
      cache,
    });
    const plan = await reconcileScriptDeployment({
      manifest: deployment,
      provider,
      cache,
    });

    console.log("deployment transactions", result.transactions);
    console.log(
      "deployment cache",
      JSON.stringify(cache.snapshot(result.manifestHash), null, 2),
    );
    console.log(
      "next plan",
      plan.actions.map((action) => action.type),
    );
  });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runBasicScriptDeploymentDemo();
}
