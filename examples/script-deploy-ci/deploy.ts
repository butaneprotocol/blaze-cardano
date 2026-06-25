import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  MemoryScriptDeploymentCache,
  defineScriptDeployment,
  deployScriptRefs,
  parseScriptDeploymentCache,
  reconcileScriptDeployment,
  stringifyScriptDeploymentCache,
} from "@blaze-cardano/deploy";
import {
  Ed25519PrivateKey,
  HexBlob,
  NetworkId,
  PlutusV2Script,
  Script,
  addressFromBech32,
  mnemonicToEntropy,
  wordlist,
} from "@blaze-cardano/core";
import { Blockfrost, type Provider } from "@blaze-cardano/query";
import { HotSingleWallet } from "@blaze-cardano/wallet";

const env = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
};

const walletFromMnemonic = async (mnemonic: string, provider: Provider) => {
  const entropy = mnemonicToEntropy(mnemonic, wordlist);
  return new HotSingleWallet(
    Ed25519PrivateKey.fromNormalBytes(entropy).hex(),
    NetworkId.Testnet,
    provider,
  );
};

const script = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

const cachePath =
  process.env["SCRIPT_DEPLOYMENT_CACHE"] ??
  fileURLToPath(new URL("./deployment-cache.json", import.meta.url));
const provider = new Blockfrost({
  network: "cardano-preview",
  projectId: env("BLOCKFROST_KEY"),
});
const wallet = await walletFromMnemonic(env("SEED_MNEMONIC"), provider);
const deploymentAddress = addressFromBech32(env("SCRIPT_DEPLOYMENT_ADDRESS"));
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
      address: deploymentAddress,
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

console.log(
  "deployment result",
  result.records.map((record) => ({
    name: record.name,
    version: record.version,
    status: record.status,
    txId: record.utxo?.input().transactionId().toString(),
    index: record.utxo?.input().index().toString(),
  })),
);
