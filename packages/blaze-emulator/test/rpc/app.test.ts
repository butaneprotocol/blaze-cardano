import { describe, expect, it, vi } from "vitest";
import {
  Address,
  ChainIds,
  CborSet,
  derivePublicKey,
  Ed25519PrivateNormalKeyHex,
  Ed25519SignatureHex,
  Hash28ByteBase16,
  HexBlob,
  NetworkId,
  SLOT_CONFIG_NETWORK,
  signMessage,
  Transaction,
  TransactionBody,
  TransactionInput,
  TransactionOutput,
  TransactionWitnessSet,
  TransactionUnspentOutput,
  Value,
  VkeyWitness,
} from "@blaze-cardano/core";
import { alwaysTrueScript } from "../util";

const jsonHeaders = {
  "content-type": "application/json",
};

async function loadApp() {
  const module = await import("../../src/rpc/app");
  return module.default;
}

async function listUtxos(
  app: Awaited<ReturnType<typeof loadApp>>,
): Promise<TransactionUnspentOutput[]> {
  const stateResponse = await app.request("/emulator/state?include=utxos");
  expect(stateResponse.status).toBe(200);
  const state = (await stateResponse.json()) as {
    utxos?: Array<string>;
  };
  return (state.utxos ?? []).map((hex) =>
    TransactionUnspentOutput.fromCbor(
      HexBlob(hex.startsWith("0x") ? hex.slice(2) : hex),
    ),
  );
}

async function buildSignedPaymentCborWithCoreSerialization(
  app: Awaited<ReturnType<typeof loadApp>>,
  payerKey: Ed25519PrivateNormalKeyHex,
  payerAddress: Address,
  receiverAddress: Address,
): Promise<{ cbor: string; txId: string; outputCbors: string[] }> {
  const payerUtxo = (await listUtxos(app)).find(
    (utxo) => utxo.output().address().toBech32() === payerAddress.toBech32(),
  );
  expect(payerUtxo).toBeDefined();

  const payment = 1_500_000n;
  const fee = 200_000n;
  const inputLovelace = payerUtxo!.output().amount().coin();
  const change = inputLovelace - payment - fee;
  expect(change).toBeGreaterThan(0n);

  const outputs = [
    new TransactionOutput(receiverAddress, new Value(payment)),
    new TransactionOutput(payerAddress, new Value(change)),
  ];
  const body = new TransactionBody(
    CborSet.fromCore([payerUtxo!.input().toCore()], TransactionInput.fromCore),
    outputs,
    fee,
  );
  body.setNetworkId(NetworkId.Testnet);
  const tx = new Transaction(body, new TransactionWitnessSet());

  const witnessSet = tx.witnessSet();
  witnessSet.setVkeys(
    CborSet.fromCore(
      [
        new VkeyWitness(
          derivePublicKey(payerKey),
          Ed25519SignatureHex(signMessage(HexBlob(tx.getId()), payerKey)),
        ).toCore(),
      ],
      VkeyWitness.fromCore,
    ),
  );
  tx.setWitnessSet(witnessSet);

  return {
    cbor: tx.toCbor(),
    txId: tx.getId(),
    outputCbors: tx
      .body()
      .outputs()
      .map((output) => output.toCbor()),
  };
}

describe("emulator RPC app", () => {
  it("resets and advances the emulator", async () => {
    const app = await loadApp();
    const resetResponse = await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });

    expect(resetResponse.status).toBe(200);

    const advanceResponse = await app.request("/emulator/advance", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ blocks: 2 }),
    });

    expect(advanceResponse.status).toBe(200);
    const advancePayload = (await advanceResponse.json()) as {
      slot: number;
      block: number;
    };
    expect(advancePayload.slot).toBe(40);
    expect(advancePayload.block).toBe(2);
  });

  it("resets with explicit network and timing configuration", async () => {
    const app = await loadApp();
    const resetResponse = await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        networkPreset: "mainnet",
        slotConfig: {
          slotLength: 2000,
        },
        slotsPerEpoch: 10,
        slotsPerBlock: 4,
      }),
    });
    expect(resetResponse.status).toBe(200);

    const configResponse = await app.request("/emulator/config");
    expect(configResponse.status).toBe(200);
    const config = (await configResponse.json()) as {
      preset: string;
      chainId: {
        networkId: string;
        networkMagic: number;
      };
      slotConfig: {
        zeroTime: number;
        zeroSlot: number;
        slotLength: number;
      };
      slotsPerEpoch: number;
      slotsPerBlock: number;
    };
    expect(config).toEqual({
      preset: "mainnet",
      chainId: {
        networkId: "mainnet",
        networkMagic: ChainIds.Mainnet.networkMagic,
      },
      slotConfig: {
        zeroTime: SLOT_CONFIG_NETWORK.Mainnet.zeroTime,
        zeroSlot: SLOT_CONFIG_NETWORK.Mainnet.zeroSlot,
        slotLength: 2000,
      },
      slotsPerEpoch: 10,
      slotsPerBlock: 4,
    });

    const timeResponse = await app.request("/emulator/time");
    expect(timeResponse.status).toBe(200);
    const time = (await timeResponse.json()) as {
      slot: number;
      epoch: number;
      block: number;
      currentUnix: number;
      slotLength: number;
    };
    expect(time.slot).toBe(SLOT_CONFIG_NETWORK.Mainnet.zeroSlot);
    expect(time.epoch).toBe(0);
    expect(time.block).toBe(0);
    expect(time.currentUnix).toBe(SLOT_CONFIG_NETWORK.Mainnet.zeroTime);
    expect(time.slotLength).toBe(2000);

    const advanceResponse = await app.request("/emulator/advance", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ blocks: 2 }),
    });
    expect(advanceResponse.status).toBe(200);
    const advanced = (await advanceResponse.json()) as {
      slot: number;
      block: number;
    };
    expect(advanced.slot).toBe(SLOT_CONFIG_NETWORK.Mainnet.zeroSlot + 8);
    expect(advanced.block).toBe(2);

    const advancedTimeResponse = await app.request("/emulator/time");
    const advancedTime = (await advancedTimeResponse.json()) as {
      currentUnix: number;
    };
    expect(advancedTime.currentUnix).toBe(
      SLOT_CONFIG_NETWORK.Mainnet.zeroTime + 16_000,
    );

    const registerResponse = await app.request("/emulator/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ label: "mainnet" }),
    });
    const registered = (await registerResponse.json()) as { address: string };
    expect(registered.address).toMatch(/^addr1/);
  });

  it("resets with a custom chain id", async () => {
    const app = await loadApp();
    const resetResponse = await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        networkPreset: "custom",
        chainId: {
          networkId: "testnet",
          networkMagic: 42,
        },
      }),
    });
    expect(resetResponse.status).toBe(200);

    const configResponse = await app.request("/emulator/config");
    expect(configResponse.status).toBe(200);
    const config = (await configResponse.json()) as {
      preset: string;
      chainId: { networkId: string; networkMagic: number };
    };
    expect(config.preset).toBe("custom");
    expect(config.chainId).toEqual({
      networkId: "testnet",
      networkMagic: 42,
    });
  });

  it("round-trips protocol parameters through JSON", async () => {
    const app = await loadApp();
    await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });

    const initialResponse = await app.request("/emulator/parameters");
    expect(initialResponse.status).toBe(200);
    const initial = (await initialResponse.json()) as {
      minFeeCoefficient: number;
      costModels: Record<string, number[]>;
    };
    expect(initial.costModels["0"]).toBeInstanceOf(Array);

    const resetResponse = await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        protocolParams: {
          minFeeCoefficient: 99,
          costModels: initial.costModels,
        },
      }),
    });
    expect(resetResponse.status).toBe(200);

    const updatedResponse = await app.request("/emulator/parameters");
    const updated = (await updatedResponse.json()) as {
      minFeeCoefficient: number;
      costModels: Record<string, number[]>;
    };
    expect(updated.minFeeCoefficient).toBe(99);
    expect(updated.costModels).toEqual(initial.costModels);
  });

  it("rejects invalid timing configuration", async () => {
    const app = await loadApp();
    const response = await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ slotsPerBlock: 0 }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: { message: "Number must be greater than 0" },
    });

    const slotLengthResponse = await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ slotConfig: { slotLength: 0 } }),
    });
    expect(slotLengthResponse.status).toBe(400);
  });

  it("registers a wallet and exposes its address", async () => {
    const app = await loadApp();
    await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });

    const registerResponse = await app.request("/emulator/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ label: "alice", lovelace: "1000000" }),
    });
    expect(registerResponse.status).toBe(200);

    const addressResponse = await app.request("/emulator/address/alice");
    expect(addressResponse.status).toBe(200);
    const addressPayload = (await addressResponse.json()) as {
      address: string;
    };
    const { address } = addressPayload;
    expect(typeof address).toBe("string");
    expect(address.length).toBeGreaterThan(0);

    const utxoResponse = await app.request("/emulator/utxos");
    expect(utxoResponse.status).toBe(200);
    const utxos = (await utxoResponse.json()) as Array<string>;
    expect(Array.isArray(utxos)).toBe(true);
    expect(utxos.length).toBeGreaterThan(0);
    expect(utxos[0]).toEqual(expect.any(String));

    const walletsResponse = await app.request("/emulator/wallets");
    expect(walletsResponse.status).toBe(200);
    const wallets = (await walletsResponse.json()) as Array<{
      label: string;
    }>;
    expect(wallets.some((wallet) => wallet.label === "alice")).toBe(true);

    const stateResponse = await app.request(
      "/emulator/state?include=utxos,wallets,governance",
    );
    expect(stateResponse.status).toBe(200);
    const state = (await stateResponse.json()) as Record<string, unknown>;
    expect(state["utxos"]).toBeDefined();
    expect(state["wallets"]).toBeDefined();
    expect(state["governance"]).toBeDefined();
  });

  it("starts and stops the event loop", async () => {
    const app = await loadApp();
    const startResponse = await app.request("/emulator/event-loop/start", {
      method: "POST",
    });
    expect(startResponse.status).toBe(200);

    const stopResponse = await app.request("/emulator/event-loop/stop", {
      method: "POST",
    });
    expect(stopResponse.status).toBe(200);
  });

  it("accepts pre-built transaction CBOR", async () => {
    const actualCrypto =
      await vi.importActual<typeof import("crypto")>("crypto");
    const seeds = [
      Buffer.alloc(32, 1),
      Buffer.alloc(32, 2),
      Buffer.alloc(32, 3),
      Buffer.alloc(32, 4),
    ];
    let calls = 0;
    const randomBytes = ((size: number) => {
      const next = seeds[calls];
      calls += 1;
      return next ?? actualCrypto.randomBytes(size);
    }) as typeof actualCrypto.randomBytes;

    vi.resetModules();
    vi.doMock("crypto", () => ({
      ...actualCrypto,
      randomBytes,
    }));
    const app = await loadApp();

    try {
      await app.request("/emulator/reset", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });

      const registerPayer = await app.request("/emulator/register", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ label: "payer", lovelace: "5000000" }),
      });
      expect(registerPayer.status).toBe(200);
      const payerPayload = (await registerPayer.json()) as {
        address: string;
      };

      const registerReceiver = await app.request("/emulator/register", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ label: "receiver", lovelace: "0" }),
      });
      expect(registerReceiver.status).toBe(200);
      const receiverPayload = (await registerReceiver.json()) as {
        address: string;
      };

      const prebuilt = await buildSignedPaymentCborWithCoreSerialization(
        app,
        Ed25519PrivateNormalKeyHex(seeds[0]!.toString("hex")),
        Address.fromBech32(payerPayload.address),
        Address.fromBech32(receiverPayload.address),
      );

      const submitResponse = await app.request("/emulator/transactions", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ cbor: prebuilt.cbor }),
      });
      expect(submitResponse.status).toBe(200);
      const submitPayload = (await submitResponse.json()) as { txId: string };
      expect(submitPayload.txId).toBe(prebuilt.txId);

      const advanceResponse = await app.request("/emulator/advance", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ blocks: 1 }),
      });
      expect(advanceResponse.status).toBe(200);

      const outputCbors = new Set(
        (await listUtxos(app)).map((utxo) => utxo.output().toCbor()),
      );
      for (const outputCbor of prebuilt.outputCbors) {
        expect(outputCbors.has(outputCbor)).toBe(true);
      }
    } finally {
      vi.doUnmock("crypto");
      vi.resetModules();
    }
  });

  it("exposes health and time endpoints", async () => {
    const app = await loadApp();
    const healthResponse = await app.request("/health");
    expect(healthResponse.status).toBe(200);
    const health = (await healthResponse.json()) as { status: string };
    expect(health.status).toBe("ok");

    const timeResponse = await app.request("/emulator/time");
    expect(timeResponse.status).toBe(200);
    const timePayload = (await timeResponse.json()) as {
      slot: number;
      epoch: number;
      block: number;
      currentUnix: number;
      slotLength: number;
    };
    expect(timePayload.slot).toBeGreaterThanOrEqual(0);
  });

  it("funds wallets and exposes UTxOs", async () => {
    const app = await loadApp();
    await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });

    await app.request("/emulator/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ label: "carol", lovelace: "1000000" }),
    });

    const fundResponse = await app.request("/emulator/fund", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ label: "carol", lovelace: "2000000" }),
    });
    expect(fundResponse.status).toBe(200);

    const missingAddress = await app.request("/emulator/address/missing");
    expect(missingAddress.status).toBe(404);

    const addressResponse = await app.request("/emulator/address/carol");
    expect(addressResponse.status).toBe(200);
    const { address } = (await addressResponse.json()) as { address: string };
    expect(address).toContain("addr_test");

    const walletsResponse = await app.request("/emulator/wallets");
    expect(walletsResponse.status).toBe(200);
    const wallets = (await walletsResponse.json()) as Array<{ label: string }>;
    expect(wallets.some((wallet) => wallet.label === "carol")).toBe(true);

    const missingUtxos = await app.request("/emulator/wallets/missing/utxos");
    expect(missingUtxos.status).toBe(404);

    const utxosResponse = await app.request("/emulator/wallets/carol/utxos");
    expect(utxosResponse.status).toBe(200);
    const carolUtxos = (await utxosResponse.json()) as Array<string>;
    expect(carolUtxos.length).toBeGreaterThan(0);

    const allUtxosResponse = await app.request("/emulator/utxos");
    expect(allUtxosResponse.status).toBe(200);
    const allUtxos = (await allUtxosResponse.json()) as Array<string>;
    expect(allUtxos.length).toBeGreaterThan(0);
  });

  it("publishes scripts and manages committee state", async () => {
    const app = await loadApp();
    await app.request("/emulator/reset", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });

    const scriptResponse = await app.request("/emulator/scripts", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({ cbor: alwaysTrueScript.toCbor() }),
    });
    expect(scriptResponse.status).toBe(200);
    const scriptPayload = (await scriptResponse.json()) as { hash: string };

    const scriptLookup = await app.request(
      `/emulator/scripts/${scriptPayload.hash}`,
    );
    expect(scriptLookup.status).toBe(200);

    const committeeResponse = await app.request(
      "/emulator/governance/committee",
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          quorumThreshold: { numerator: 1, denominator: 1 },
          members: [
            {
              coldCredentialHash: Hash28ByteBase16("11".repeat(28)).toString(),
              epoch: 5,
            },
          ],
        }),
      },
    );
    expect(committeeResponse.status).toBe(200);

    const hotResponse = await app.request(
      "/emulator/governance/committee/hot",
      {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          coldCredentialHash: Hash28ByteBase16("11".repeat(28)).toString(),
          credentialType: "KeyHash",
          hotCredentialHash: Hash28ByteBase16("22".repeat(28)).toString(),
        }),
      },
    );
    expect(hotResponse.status).toBe(200);

    const committeeState = await app.request("/emulator/governance/committee");
    const committee = (await committeeState.json()) as {
      members: Array<{ coldCredentialHash: string }>;
      hotCredentials: Array<{ hotCredentialHash: string | null }>;
    };
    expect(committee.members).toHaveLength(1);
    expect(committee.hotCredentials[0]?.hotCredentialHash).toBeDefined();
  });

  it("handles governance proposal lookups", async () => {
    const app = await loadApp();
    const missingStatus = await app.request(
      "/emulator/governance/proposal-status/abcd",
    );
    expect(missingStatus.status).toBe(400);

    const missingTallies = await app.request(
      "/emulator/governance/tallies/0000:0",
    );
    expect(missingTallies.status).toBe(400);

    const drepsResponse = await app.request("/emulator/governance/dreps");
    expect(drepsResponse.status).toBe(200);
    const dreps = (await drepsResponse.json()) as Array<{ hash: string }>;
    expect(Array.isArray(dreps)).toBe(true);
  });
});
