import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  HexBlob,
  PlutusV2Script,
  Script,
  type Address,
} from "@blaze-cardano/core";
import { Emulator, EmulatorProvider } from "@blaze-cardano/emulator";
import { makeValue } from "@blaze-cardano/tx";
import {
  MemoryScriptDeploymentCache,
  defineScriptDeployment,
  deployScriptRefs,
} from "@blaze-cardano/deploy";

type AikenBlueprint = {
  validators: readonly {
    title: string;
    compiledCode: string;
  }[];
};

const loadValidator = async (
  title = "always_true.always_true.spend",
): Promise<Script> => {
  const blueprint = JSON.parse(
    await readFile(new URL("./plutus.json", import.meta.url), "utf8"),
  ) as AikenBlueprint;
  const validator = blueprint.validators.find((item) => item.title === title);
  if (!validator) {
    throw new Error(`Aiken validator "${title}" was not found in plutus.json.`);
  }
  return Script.newPlutusV2Script(
    new PlutusV2Script(HexBlob(validator.compiledCode)),
  );
};

const manifest = (address: Address, script: Script) =>
  defineScriptDeployment({
    id: "aiken-reference-script-demo",
    network: "cardano-preview",
    targets: [
      {
        name: "always-true-aiken",
        version: "1.0.0",
        script,
        address,
        metadata: {
          compiler: "aiken",
          source: "validators/always_true.ak",
        },
      },
    ],
  });

export const runAikenScriptDeploymentDemo = async () => {
  const script = await loadValidator();
  const emulator = new Emulator([]);
  const deploymentAddress = await emulator.register(
    "deployer",
    makeValue(100_000_000n),
  );
  const cache = new MemoryScriptDeploymentCache();

  await emulator.as("deployer", async (blaze) => {
    const provider = blaze.provider as EmulatorProvider;
    const result = await deployScriptRefs({
      manifest: manifest(deploymentAddress, script),
      provider,
      wallet: blaze.wallet,
      cache,
    });

    console.log("aiken deployment transactions", result.transactions);
    console.log(
      "aiken deployment cache",
      JSON.stringify(cache.snapshot(result.manifestHash), null, 2),
    );
  });
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runAikenScriptDeploymentDemo();
}
