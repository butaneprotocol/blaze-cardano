import { describe, expect, test } from "vitest";
import {
  type Address,
  Ed25519PrivateNormalKeyHex,
  HexBlob,
  NetworkId,
  PlutusV2Script,
  Script,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  Value,
} from "@blaze-cardano/core";
import { Emulator, EmulatorProvider } from "@blaze-cardano/emulator";
import { HotSingleWallet } from "@blaze-cardano/wallet";
import {
  MemoryScriptDeploymentCache,
  defineScriptDeployment,
  deployScriptRefs,
  reconcileScriptDeployment,
  type ScriptDeploymentManifest,
} from "../src";

const signingKey = Ed25519PrivateNormalKeyHex(
  "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
);

const script = (hex: string): Script =>
  Script.newPlutusV2Script(new PlutusV2Script(HexBlob(hex)));

const validatorV1 = script("510100003222253330044a229309b2b2b9a1");
const validatorV2 = script("510100003222253330044a229309b2b2b9a2");

const setupDeployment = () => {
  const emulator = new Emulator([]);
  const provider = new EmulatorProvider(emulator);
  const wallet = new HotSingleWallet(signingKey, NetworkId.Testnet, provider);
  emulator.addUtxo(
    new TransactionUnspentOutput(
      new TransactionInput(TransactionId("1".repeat(64)), 0n),
      new TransactionOutput(wallet.address, new Value(100_000_000n)),
    ),
  );
  return { emulator, provider, wallet };
};

const manifest = (
  address: Address,
  scriptToDeploy = validatorV1,
  version = "1.0.0",
): ScriptDeploymentManifest =>
  defineScriptDeployment({
    id: "emulator-script-deployment",
    network: "cardano-preview",
    targets: [
      {
        name: "validator",
        version,
        script: scriptToDeploy,
        address,
      },
    ],
  });

describe("script deployment with emulator", () => {
  test("deploys a reference script and reconciles the next run to reuse", async () => {
    const { provider, wallet } = setupDeployment();
    const cache = new MemoryScriptDeploymentCache();
    const deployment = manifest(wallet.address);

    const result = await deployScriptRefs({
      manifest: deployment,
      provider,
      wallet,
      cache,
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.records).toMatchObject([
      {
        name: "validator",
        version: "1.0.0",
        status: "matched",
        scriptHash: validatorV1.hash(),
      },
    ]);
    expect(result.records[0]?.utxo?.output().scriptRef()?.hash()).toBe(
      validatorV1.hash(),
    );
    await expect(
      provider.resolveScriptRef(validatorV1, wallet.address),
    ).resolves.toBeDefined();

    const plan = await reconcileScriptDeployment({
      manifest: deployment,
      provider,
      cache,
    });

    expect(plan.actions).toMatchObject([{ type: "reuse" }]);
  });

  test("replaces an emulator deployment and keeps superseded cache history", async () => {
    const { provider, wallet } = setupDeployment();
    const cache = new MemoryScriptDeploymentCache();

    await deployScriptRefs({
      manifest: manifest(wallet.address, validatorV1, "1.0.0"),
      provider,
      wallet,
      cache,
    });

    const result = await deployScriptRefs({
      manifest: manifest(wallet.address, validatorV2, "1.0.1"),
      provider,
      wallet,
      cache,
    });

    expect(result.transactions).toHaveLength(1);
    expect(result.records).toMatchObject([
      {
        name: "validator",
        version: "1.0.0",
        status: "superseded",
        supersededBy: validatorV2.hash(),
      },
      {
        name: "validator",
        version: "1.0.1",
        status: "matched",
        scriptHash: validatorV2.hash(),
      },
    ]);
    await expect(
      provider.resolveScriptRef(validatorV2, wallet.address),
    ).resolves.toBeDefined();
    expect(cache.records().map((record) => record.status)).toContain(
      "superseded",
    );

    const plan = await reconcileScriptDeployment({
      manifest: manifest(wallet.address, validatorV2, "1.0.1"),
      provider,
      cache,
    });

    expect(plan.actions).toMatchObject([{ type: "reuse" }]);
  });
});
