import { describe, expect, test } from "vitest";
import {
  Address,
  Hash28ByteBase16,
  HexBlob,
  NetworkId,
  PlutusData,
  PlutusV2Script,
  Redeemers,
  Script,
  TransactionOutput,
  TransactionId,
  TransactionInput,
  TransactionUnspentOutput,
  Value,
  getBurnAddress,
  hardCodedProtocolParams,
  Ed25519PrivateNormalKeyHex,
  type ProtocolParameters,
  type Transaction,
} from "@blaze-cardano/core";
import { Provider } from "@blaze-cardano/query";
import type { NetworkName } from "@blaze-cardano/query";
import { HotSingleWallet } from "@blaze-cardano/wallet";
import {
  MemoryScriptDeploymentCache,
  compareDeploymentVersions,
  defineScriptDeployment,
  deployScriptRefs,
  nextPatchVersion,
  parseScriptDeploymentCache,
  reconcileScriptDeployment,
  scriptDeploymentManifestHash,
  stringifyScriptDeploymentCache,
  supersedeRecord,
  type ScriptDeploymentRecord,
  type ScriptDeploymentTarget,
} from "../src";

const address = getBurnAddress(NetworkId.Testnet);
const mainnetAddress = getBurnAddress(NetworkId.Mainnet);

const script = (hex: string): Script =>
  Script.newPlutusV2Script(new PlutusV2Script(HexBlob(hex)));

const validatorScript = script("510100003222253330044a229309b2b2b9a1");
const policyScript = script("510100003222253330044a229309b2b2b9a2");

const target = (
  overrides: Partial<ScriptDeploymentTarget> = {},
): ScriptDeploymentTarget => ({
  name: "validator",
  version: "1.0.0",
  script: validatorScript,
  address,
  ...overrides,
});

const manifest = (targets: readonly ScriptDeploymentTarget[]) =>
  defineScriptDeployment({
    id: "sample-app",
    network: "cardano-preview",
    targets,
  });

const txInput = (index = 0n): TransactionInput =>
  new TransactionInput(TransactionId("1".repeat(64)), index);

const scriptReferenceUtxo = (
  targetScript: Script = validatorScript,
  targetAddress: Address = address,
  input: TransactionInput = txInput(),
): TransactionUnspentOutput => {
  const output = new TransactionOutput(targetAddress, new Value(2_000_000n));
  output.setScriptRef(targetScript);
  return new TransactionUnspentOutput(input, output);
};

const record = (
  overrides: Partial<ScriptDeploymentRecord> = {},
): ScriptDeploymentRecord => ({
  name: "validator",
  version: "1.0.0",
  scriptHash: validatorScript.hash(),
  address,
  utxo: scriptReferenceUtxo(),
  status: "matched",
  ...overrides,
});

class FakeProvider extends Provider {
  readonly live = new Map<string, TransactionUnspentOutput>();
  readonly funding: TransactionUnspentOutput[] = [];
  readonly submittedTransactions: Transaction[] = [];
  confirmations = true;
  submitted = 0;

  constructor(networkName: NetworkName = "cardano-preview") {
    super(NetworkId.Testnet, networkName);
  }

  setLive(target: ScriptDeploymentTarget, input = txInput()): void {
    this.live.set(
      this.key(target.script.hash(), target.address),
      this.scriptReferenceUtxo(target.script, target.address, input),
    );
  }

  private key(hash: Hash28ByteBase16, targetAddress: Address): string {
    return `${hash}:${targetAddress.toBech32()}`;
  }

  private scriptReferenceUtxo(
    targetScript: Script,
    targetAddress: Address,
    input: TransactionInput,
  ): TransactionUnspentOutput {
    return scriptReferenceUtxo(targetScript, targetAddress, input);
  }

  async getParameters(): Promise<ProtocolParameters> {
    return hardCodedProtocolParams;
  }

  async getUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    return this.funding;
  }

  async getUnspentOutputsWithAsset(): Promise<TransactionUnspentOutput[]> {
    return [];
  }

  async getUnspentOutputByNFT(): Promise<TransactionUnspentOutput> {
    throw new Error("FakeProvider does not implement NFT lookup");
  }

  async resolveUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    return [];
  }

  async resolveDatum(): Promise<PlutusData> {
    throw new Error("FakeProvider does not implement datum resolution");
  }

  async awaitTransactionConfirmation(): Promise<boolean> {
    return this.confirmations;
  }

  async postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    this.submittedTransactions.push(tx);
    this.submitted += 1;
    return TransactionId("2".repeat(64));
  }

  async evaluateTransaction(
    _tx: Transaction,
    _additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    return Redeemers.fromCore([]);
  }

  override async resolveScriptRef(
    targetScript: Script | Hash28ByteBase16,
    targetAddress = getBurnAddress(this.network),
  ): Promise<TransactionUnspentOutput | undefined> {
    const hash =
      targetScript instanceof Script ? targetScript.hash() : targetScript;
    const key = this.key(hash, targetAddress);
    const live = this.live.get(key);
    if (live) return live;
    if (!(targetScript instanceof Script) || this.submitted === 0) {
      return undefined;
    }
    const input = new TransactionInput(
      TransactionId("4".repeat(64)),
      BigInt(this.submitted - 1),
    );
    const utxo = this.scriptReferenceUtxo(targetScript, targetAddress, input);
    this.live.set(key, utxo);
    return utxo;
  }
}

describe("script deployment manifests", () => {
  test("hashes canonical manifest content independent of target order", () => {
    const validator = target({
      name: "validator",
      metadata: { b: "2", a: "1" },
    });
    const policy = target({
      name: "policy",
      script: policyScript,
    });

    const left = manifest([validator, policy]);
    const right = manifest([policy, validator]);

    expect(scriptDeploymentManifestHash(left)).toBe(
      scriptDeploymentManifestHash(right),
    );
  });

  test("rejects duplicate targets, network mismatches, and malformed versions", () => {
    expect(() => manifest([target(), target()])).toThrow(/Duplicate/);
    expect(() => manifest([target({ address: mainnetAddress })])).toThrow(
      /address network/,
    );
    expect(() => manifest([target({ version: "1.0" })])).toThrow(/x.y.z/);
  });
});

describe("script deployment execution", () => {
  test("deploys and then reuses a reference script through provider and cache", async () => {
    const provider = new FakeProvider();
    const signingKey = Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );
    const wallet = new HotSingleWallet(signingKey, NetworkId.Testnet, provider);
    provider.funding.push(
      new TransactionUnspentOutput(
        txInput(9n),
        new TransactionOutput(wallet.address, new Value(100_000_000n)),
      ),
    );
    const cache = new MemoryScriptDeploymentCache();
    const deployment = manifest([
      target({
        script: validatorScript,
      }),
    ]);

    const result = await deployScriptRefs({
      manifest: deployment,
      provider,
      wallet,
      cache,
    });

    expect(provider.submitted).toBe(1);
    const deploymentOutput = Array.from(
      provider.submittedTransactions[0]!.body().outputs().values(),
    ).find((output) => output.scriptRef()?.hash() === validatorScript.hash());
    expect(deploymentOutput).toBeDefined();
    expect(result.transactions).toHaveLength(1);
    expect(result.records).toMatchObject([
      {
        name: "validator",
        status: "matched",
        scriptHash: validatorScript.hash(),
      },
    ]);
    expect(result.records[0]?.utxo?.output().scriptRef()?.hash()).toBe(
      validatorScript.hash(),
    );
    await expect(
      provider.resolveScriptRef(validatorScript),
    ).resolves.toBeDefined();

    const plan = await reconcileScriptDeployment({
      manifest: deployment,
      provider,
      cache,
    });

    expect(plan.actions).toMatchObject([{ type: "reuse" }]);
  });

  test("executes multiple deployments in manifest order", async () => {
    const provider = new FakeProvider();
    const signingKey = Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );
    const wallet = new HotSingleWallet(signingKey, NetworkId.Testnet, provider);
    provider.funding.push(
      new TransactionUnspentOutput(
        txInput(12n),
        new TransactionOutput(wallet.address, new Value(200_000_000n)),
      ),
    );
    const cache = new MemoryScriptDeploymentCache();
    const policy = target({
      name: "policy",
      version: "1.0.0",
      script: policyScript,
    });
    const deployment = manifest([target(), policy]);

    const result = await deployScriptRefs({
      manifest: deployment,
      provider,
      wallet,
      cache,
    });
    const nextPlan = await reconcileScriptDeployment({
      manifest: deployment,
      provider,
      cache,
    });

    expect(provider.submitted).toBe(2);
    expect(result.transactions).toHaveLength(2);
    expect(
      result.records.map((deploymentRecord) => deploymentRecord.name),
    ).toEqual(["validator", "policy"]);
    expect(cache.findByName("validator")).toMatchObject({
      scriptHash: validatorScript.hash(),
      status: "matched",
    });
    expect(cache.findByName("policy")).toMatchObject({
      scriptHash: policyScript.hash(),
      status: "matched",
    });
    expect(nextPlan.actions.map((action) => action.type)).toEqual([
      "reuse",
      "reuse",
    ]);
  });

  test("deploys replacements and keeps the previous record as superseded history", async () => {
    const provider = new FakeProvider();
    const signingKey = Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );
    const wallet = new HotSingleWallet(signingKey, NetworkId.Testnet, provider);
    provider.funding.push(
      new TransactionUnspentOutput(
        txInput(10n),
        new TransactionOutput(wallet.address, new Value(100_000_000n)),
      ),
    );
    const cache = new MemoryScriptDeploymentCache([record()]);
    const deployment = manifest([
      target({
        version: "1.0.1",
        script: policyScript,
      }),
    ]);

    const result = await deployScriptRefs({
      manifest: deployment,
      provider,
      wallet,
      cache,
    });

    expect(result.records).toMatchObject([
      {
        name: "validator",
        version: "1.0.0",
        scriptHash: validatorScript.hash(),
        status: "superseded",
        supersededBy: policyScript.hash(),
      },
      {
        name: "validator",
        version: "1.0.1",
        scriptHash: policyScript.hash(),
        status: "matched",
      },
    ]);
    expect(cache.records()).toHaveLength(2);
    expect(cache.findByName("validator")).toMatchObject({
      version: "1.0.1",
      scriptHash: policyScript.hash(),
      status: "matched",
    });
    expect(cache.findByScriptHash(validatorScript.hash())).toMatchObject({
      status: "superseded",
    });
  });

  test("fails when a submitted deployment transaction is not confirmed", async () => {
    const provider = new FakeProvider();
    provider.confirmations = false;
    const signingKey = Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );
    const wallet = new HotSingleWallet(signingKey, NetworkId.Testnet, provider);
    provider.funding.push(
      new TransactionUnspentOutput(
        txInput(11n),
        new TransactionOutput(wallet.address, new Value(100_000_000n)),
      ),
    );

    await expect(
      deployScriptRefs({
        manifest: manifest([target()]),
        provider,
        wallet,
      }),
    ).rejects.toThrow(/not confirmed/);
  });

  test("rejects wallets whose network does not match the deployment manifest", async () => {
    const provider = new FakeProvider();
    const signingKey = Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );
    const wallet = new HotSingleWallet(signingKey, NetworkId.Mainnet, provider);

    await expect(
      deployScriptRefs({
        manifest: manifest([target()]),
        provider,
        wallet,
      }),
    ).rejects.toThrow(/Wallet network/);
  });
});

describe("script deployment cache", () => {
  test("round-trips serializable records", () => {
    const cache = new MemoryScriptDeploymentCache([record()]);
    const manifestHash = scriptDeploymentManifestHash(manifest([target()]));
    const restored = parseScriptDeploymentCache(
      JSON.parse(stringifyScriptDeploymentCache(cache, manifestHash)),
    );

    expect(restored.findByName("validator")).toMatchObject({
      name: "validator",
      version: "1.0.0",
      scriptHash: validatorScript.hash(),
      status: "matched",
    });
    expect(restored.snapshot(manifestHash).manifestHash).toBe(manifestHash);
  });

  test("removes all history for a retired target name", () => {
    const cache = new MemoryScriptDeploymentCache([
      record({ status: "superseded" }),
      record({ version: "1.0.1", scriptHash: policyScript.hash() }),
    ]);

    expect(cache.remove("validator")).toBe(true);
    expect(cache.records()).toHaveLength(0);
  });

  test("returns the highest active version for a deployment name", () => {
    const cache = new MemoryScriptDeploymentCache([
      record({ version: "1.0.0" }),
      record({ version: "1.0.2", scriptHash: policyScript.hash() }),
      record({
        version: "1.0.1",
        scriptHash: validatorScript.hash(),
        status: "superseded",
      }),
    ]);

    expect(cache.findByName("validator")).toMatchObject({
      version: "1.0.2",
      scriptHash: policyScript.hash(),
      status: "matched",
    });
  });

  test("rejects invalid UTxO CBOR", () => {
    const invalidRecord = (utxoCbor: string) => ({
      name: "validator",
      version: "1.0.0",
      scriptHash: validatorScript.hash(),
      address: address.toBech32(),
      utxoCbor,
      status: "matched" as const,
    });

    expect(() =>
      parseScriptDeploymentCache({
        records: [invalidRecord("not-cbor")],
      }),
    ).toThrow(/Invalid deployment cache UTxO CBOR/);
  });

  test("rejects invalid status and version values", () => {
    expect(() =>
      parseScriptDeploymentCache({
        records: [
          {
            name: "validator",
            version: "1.0",
            scriptHash: validatorScript.hash(),
            address: address.toBech32(),
            status: "matched",
          },
        ],
      }),
    ).toThrow(/Invalid deployment cache version/);
    expect(() =>
      parseScriptDeploymentCache({
        records: [
          {
            name: "validator",
            version: "1.0.0",
            scriptHash: validatorScript.hash(),
            address: address.toBech32(),
            status: "retired" as never,
          },
        ],
      }),
    ).toThrow(/Invalid deployment cache status/);
  });

  test("rejects invalid hash values and malformed snapshots", () => {
    const validRecord = {
      name: "validator",
      version: "1.0.0",
      scriptHash: validatorScript.hash(),
      address: address.toBech32(),
      status: "matched" as const,
    };

    expect(() =>
      parseScriptDeploymentCache({
        records: [
          {
            ...validRecord,
            scriptHash: "not-a-script-hash" as never,
          },
        ],
      }),
    ).toThrow(/expected length '56'/);
    expect(() =>
      parseScriptDeploymentCache({
        manifestHash: "not-a-manifest-hash" as never,
        records: [validRecord],
      }),
    ).toThrow(/expected length '64'/);
    expect(() =>
      parseScriptDeploymentCache({ records: undefined as never }),
    ).toThrow(/records/);
  });
});

describe("script deployment management helpers", () => {
  test("compares and increments semantic deployment versions", () => {
    expect(compareDeploymentVersions("1.0.0", "1.0.1")).toBe(-1);
    expect(compareDeploymentVersions("1.2.0", "1.1.9")).toBe(1);
    expect(compareDeploymentVersions("1.2.3", "1.2.3")).toBe(0);
    expect(nextPatchVersion("1.2.3")).toBe("1.2.4");
    expect(() => compareDeploymentVersions("1.0", "1.0.0")).toThrow(/x.y.z/);
  });

  test("marks old records as superseded by replacement scripts", () => {
    const replacement = record({
      scriptHash: policyScript.hash(),
      version: "1.0.1",
    });

    expect(supersedeRecord(record(), replacement)).toMatchObject({
      status: "superseded",
      supersededBy: policyScript.hash(),
    });
  });
});

describe("script deployment planning", () => {
  test("deploys missing targets", async () => {
    const plan = await reconcileScriptDeployment({
      manifest: manifest([target()]),
      provider: new FakeProvider(),
    });

    expect(plan.actions).toMatchObject([{ type: "deploy" }]);
  });

  test("rejects a known provider network that differs from the manifest network", async () => {
    await expect(
      reconcileScriptDeployment({
        manifest: manifest([target()]),
        provider: new FakeProvider("cardano-preprod"),
      }),
    ).rejects.toThrow(/does not match deployment manifest network/);
  });

  test("reuses live script references and records the live UTxO", async () => {
    const provider = new FakeProvider();
    const deployment = target();
    provider.setLive(deployment, txInput(7n));

    const plan = await reconcileScriptDeployment({
      manifest: manifest([deployment]),
      provider,
      cache: new MemoryScriptDeploymentCache([record()]),
    });

    expect(plan.actions).toMatchObject([
      {
        type: "reuse",
        record: { name: "validator" },
      },
    ]);
    const action = plan.actions[0];
    expect(action?.type).toBe("reuse");
    if (action?.type === "reuse") {
      expect(action.record.utxo?.input().toCbor()).toBe(txInput(7n).toCbor());
    }
  });

  test("marks live reused scripts as matched even when old cache history is superseded", async () => {
    const provider = new FakeProvider();
    const deployment = target();
    provider.setLive(deployment, txInput(8n));

    const plan = await reconcileScriptDeployment({
      manifest: manifest([deployment]),
      provider,
      cache: new MemoryScriptDeploymentCache([
        record({
          status: "superseded",
          supersededBy: policyScript.hash(),
        }),
      ]),
    });

    expect(plan.actions).toMatchObject([
      {
        type: "reuse",
        record: { name: "validator", status: "matched" },
      },
    ]);
    const action = plan.actions[0];
    expect(action?.type).toBe("reuse");
    if (action?.type === "reuse") {
      expect(action.record.utxo?.input().toCbor()).toBe(txInput(8n).toCbor());
    }
  });

  test("replaces stale cache records when no live matching script exists", async () => {
    const plan = await reconcileScriptDeployment({
      manifest: manifest([target({ script: policyScript })]),
      provider: new FakeProvider(),
      cache: new MemoryScriptDeploymentCache([record()]),
    });

    expect(plan.actions).toMatchObject([
      { type: "replace", previous: { scriptHash: validatorScript.hash() } },
    ]);
  });

  test("retires cached records removed from the manifest", async () => {
    const plan = await reconcileScriptDeployment({
      manifest: manifest([]),
      provider: new FakeProvider(),
      cache: new MemoryScriptDeploymentCache([record()]),
    });

    expect(plan.actions).toMatchObject([
      { type: "retire", record: { name: "validator" } },
    ]);
  });
});
