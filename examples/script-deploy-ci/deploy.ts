import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  Core,
  Blockfrost,
  HotSingleWallet,
  MemoryScriptDeploymentCache,
  burnDeploymentAddress,
  defineScriptDeployment,
  deployScriptRefs,
  parseScriptDeploymentCache,
  reconcileScriptDeployment,
  stringifyScriptDeploymentCache,
  type Provider,
} from "@blaze-cardano/sdk";

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const walletFromMnemonic = async (mnemonic: string, provider: Provider) => {
  const entropy = Core.mnemonicToEntropy(mnemonic, Core.wordlist);
  return new HotSingleWallet(
    Core.Ed25519PrivateKey.fromNormalBytes(entropy).hex(),
    Core.NetworkId.Testnet,
    provider,
  );
};

const script = Core.Script.newPlutusV2Script(
  new Core.PlutusV2Script(Core.HexBlob("510100003222253330044a229309b2b2b9a1")),
);

const cachePath =
  process.env["SCRIPT_DEPLOYMENT_CACHE"] ??
  fileURLToPath(new URL("./deployment-cache.json", import.meta.url));
const provider = new Blockfrost({
  network: "cardano-preview",
  projectId: env("BLOCKFROST_KEY"),
});
const wallet = await walletFromMnemonic(env("SEED_MNEMONIC"), provider);
const cache = existsSync(cachePath)
  ? parseScriptDeploymentCache(JSON.parse(await readFile(cachePath, "utf8")))
  : new MemoryScriptDeploymentCache();
const manifest = defineScriptDeployment({
  id: "ci-reference-scripts",
  network: "cardano-preview",
  targets: [
    {
      name: "always-true",
      version: "1.0.0",
      script,
      address: burnDeploymentAddress(Core.NetworkId.Testnet),
      metadata: {
        source: "examples/script-deploy-ci/deploy.ts",
      },
    },
  ],
});

const plan = await reconcileScriptDeployment({ manifest, provider, cache });
console.log(
  "deployment plan",
  plan.actions.map((action) => ({
    type: action.type,
    name: action.type === "retire" ? action.record.name : action.target.name,
  })),
);

const result = await deployScriptRefs({ manifest, provider, wallet, cache });
await writeFile(
  cachePath,
  stringifyScriptDeploymentCache(cache, result.manifestHash),
);

console.log(JSON.stringify(result, null, 2));
