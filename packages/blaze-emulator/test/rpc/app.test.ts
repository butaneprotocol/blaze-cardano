import crypto from "node:crypto";
import {
  Hash28ByteBase16,
  Transaction,
  TxCBOR,
  TransactionUnspentOutput,
  HexBlob,
} from "@blaze-cardano/core";
import app from "../../src/rpc/app";
import { alwaysTrueScript } from "../util";

const jsonHeaders = {
  "content-type": "application/json",
};

// Pre-built transaction CBOR generated with deterministic wallet seeds.
// It spends the first genesis UTxO created for `payer`, sends 1.5 ADA
// (1_500_000 lovelace) to `receiver`, and returns the remaining 3,331,859
// lovelace to `payer`.
const SIMPLE_PAYMENT_CBOR =
  "84a300d901028182582000000000000000000000000000000000000000000000000000000000000000000001828258390099d9534eb11dafebd7ee3a8f7a764846f29959aa4f85080179d0b3a17567290f5c83ef19b2b342b2b36326e6330b513e090669aaa6fd7fd31a0016e360825839001acd4518ee339d87b84c995134aafa9fc7abcc831b74facd97a10f236106524858359a6791726c545d1d24b060ad097ed7735ad3e5b803031a0032d713021a000290cda100d9010281825820687b9d927e93be3094f4b8daa1087e40fe7f334a1994a9dfa0fab06cef59443a58403952017604e3fb9493c91a7f47d938b67dd277dca9ad350609c4d242dc0c2ae6398976b514b8c076e10c1885e5368f6e1e661b070efac12296244a3eb50f5b0ff5f6";

const SIMPLE_PAYMENT_TX = Transaction.fromCbor(TxCBOR(SIMPLE_PAYMENT_CBOR));
const SIMPLE_PAYMENT_OUTPUT = SIMPLE_PAYMENT_TX.body().outputs()[0]!;
const SIMPLE_PAYMENT_CHANGE = SIMPLE_PAYMENT_TX.body().outputs()[1]!;
const SIMPLE_PAYMENT_ADDRESS = SIMPLE_PAYMENT_OUTPUT.address().toBech32();
const SIMPLE_PAYMENT_AMOUNT = SIMPLE_PAYMENT_OUTPUT.amount().coin().toString();
const SIMPLE_CHANGE_ADDRESS = SIMPLE_PAYMENT_CHANGE.address().toBech32();
const SIMPLE_CHANGE_AMOUNT = SIMPLE_PAYMENT_CHANGE.amount()
  .coin()
  .toString();

describe("emulator RPC app", () => {
  it("resets and advances the emulator", async () => {
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
    const advancePayload = (await advanceResponse.json()) as { slot: number };
    const { slot } = advancePayload;
    expect(slot).toBeGreaterThanOrEqual(2);
  });

  it("registers a wallet and exposes its address", async () => {
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
    const seeds = [Buffer.alloc(96, 1), Buffer.alloc(96, 2)];
    const originalRandomBytes = crypto.randomBytes;
    let calls = 0;
    const randomSpy = jest
      .spyOn(crypto, "randomBytes")
      .mockImplementation((size) => {
        const next = seeds[calls];
        calls += 1;
        return next ?? originalRandomBytes(size);
      });

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

      const registerReceiver = await app.request("/emulator/register", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ label: "receiver", lovelace: "0" }),
      });
      expect(registerReceiver.status).toBe(200);

      const submitResponse = await app.request("/emulator/transactions", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ cbor: SIMPLE_PAYMENT_CBOR }),
      });
      expect(submitResponse.status).toBe(200);
      const submitPayload = (await submitResponse.json()) as { txId: string };
      expect(submitPayload.txId).toBe(
        "951f0d42c24eb957a65ecb31056d7c5b98674c236def2a92f5d9dd132c8964f0",
      );

      const advanceResponse = await app.request("/emulator/advance", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ blocks: 1 }),
      });
      expect(advanceResponse.status).toBe(200);

      const stateResponse = await app.request(
        "/emulator/state?include=utxos",
      );
      expect(stateResponse.status).toBe(200);
      const state = (await stateResponse.json()) as {
        utxos?: Array<string>;
      };
      const utxos = (state.utxos ?? []).map((hex) =>
        TransactionUnspentOutput.fromCbor(
          HexBlob(hex.startsWith("0x") ? hex.slice(2) : hex),
        ),
      );
      const receiverUtxo = utxos.find(
        (utxo) => utxo.output().address().toBech32() === SIMPLE_PAYMENT_ADDRESS,
      );
      expect(receiverUtxo).toBeDefined();
      expect(receiverUtxo?.output().amount().coin().toString()).toBe(
        SIMPLE_PAYMENT_AMOUNT,
      );

      const payerChangeUtxo = utxos.find(
        (utxo) =>
          utxo.output().address().toBech32() === SIMPLE_CHANGE_ADDRESS &&
          utxo.output().amount().coin().toString() === SIMPLE_CHANGE_AMOUNT,
      );
      expect(payerChangeUtxo).toBeDefined();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("exposes health and time endpoints", async () => {
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

    const committeeState = await app.request(
      "/emulator/governance/committee",
    );
    const committee = (await committeeState.json()) as {
      members: Array<{ coldCredentialHash: string }>;
      hotCredentials: Array<{ hotCredentialHash: string | null }>;
    };
    expect(committee.members).toHaveLength(1);
    expect(committee.hotCredentials[0]?.hotCredentialHash).toBeDefined();
  });

  it("handles governance proposal lookups", async () => {
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
