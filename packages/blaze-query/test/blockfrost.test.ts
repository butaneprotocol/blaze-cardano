import { afterEach, describe, expect, test, vi } from "vitest";
import {
  Address,
  DatumHash,
  ExUnits,
  Hash28ByteBase16,
  HexBlob,
  PlutusData,
  PlutusV2Script,
  Redeemer,
  RedeemerPurpose,
  Redeemers,
  Script,
  TransactionId,
  TransactionInput,
  type Transaction,
} from "@blaze-cardano/core";
import { Blockfrost } from "../src";

const address = Address.fromBech32(
  "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
);
const txHash = TransactionId("1".repeat(64));
const datumCbor = "d87980";
const alwaysTrueScript: Script = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const textResponse = (body: string, init?: ResponseInit) =>
  new Response(body, init);

const mockFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const blockfrost = () =>
  new Blockfrost({
    network: "cardano-preview",
    projectId: "project-id",
  });

const blockfrostUtxo = (overrides = {}) => ({
  address: address.toBech32(),
  tx_hash: txHash,
  output_index: 1,
  amount: [{ unit: "lovelace", quantity: "5000000" }],
  block: "block",
  ...overrides,
});

const protocolParametersResponse = () => ({
  epoch: 1,
  min_fee_a: 44,
  min_fee_b: 155381,
  max_block_size: 90112,
  max_tx_size: 16384,
  max_block_header_size: 1100,
  key_deposit: 2_000_000,
  pool_deposit: 500_000_000,
  e_max: 18,
  n_opt: 500,
  a0: "0.3",
  rho: "0.003",
  tau: "0.2",
  decentralisation_param: 0,
  extra_entropy: null,
  protocol_major_ver: 10,
  protocol_minor_ver: 0,
  min_utxo: "1000000",
  min_pool_cost: 340_000_000,
  nonce: "nonce",
  cost_models: {
    PlutusV1: {},
    PlutusV2: {},
    PlutusV3: {},
  },
  cost_models_raw: {
    PlutusV1: [1, 2, 3],
    PlutusV2: [4, 5, 6],
    PlutusV3: [7, 8, 9],
  },
  price_mem: "0.0577",
  price_step: "0.0000721",
  max_tx_ex_mem: 10_000,
  max_tx_ex_steps: 5_000,
  max_block_ex_mem: 20_000,
  max_block_ex_steps: 10_000,
  max_val_size: 5_000,
  collateral_percent: 150,
  max_collateral_inputs: 3,
  coins_per_utxo_size: 4310,
  min_fee_ref_script_cost_per_byte: 15,
});

const txWithRedeemers = () => {
  const redeemer = Redeemer.fromCore({
    index: 0,
    purpose: RedeemerPurpose.spend,
    data: PlutusData.fromCbor(HexBlob(datumCbor)).toCore(),
    executionUnits: ExUnits.fromCore({ memory: 0, steps: 0 }).toCore(),
  });
  const redeemers = Redeemers.fromCore([redeemer.toCore()]);

  return {
    toCbor: () => "00",
    witnessSet: () => ({ redeemers: () => redeemers }),
  } as unknown as Transaction;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Blockfrost", () => {
  test("maps protocol parameters and includes project headers", async () => {
    const fetchMock = mockFetch(jsonResponse(protocolParametersResponse()));

    const params = await blockfrost().getParameters();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://cardano-preview.blockfrost.io/api/v0/epochs/latest/parameters",
      { headers: { project_id: "project-id" } },
    );
    expect(params.minFeeCoefficient).toBe(44);
    expect(params.protocolVersion).toEqual({ major: 10, minor: 0 });
    expect(params.costModels.get(0)).toEqual([1, 2, 3]);
    expect(params.costModels.get(1)).toEqual([4, 5, 6]);
    expect(params.costModels.get(2)).toEqual([7, 8, 9]);
  });

  test("parses address UTxO responses", async () => {
    const fetchMock = mockFetch(jsonResponse([blockfrostUtxo()]));

    const [utxo] = await blockfrost().getUnspentOutputs(address);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://cardano-preview.blockfrost.io/api/v0//addresses/${address.toBech32()}/utxos?count=100&page=1`,
      { headers: { project_id: "project-id" } },
    );
    expect(utxo?.input().transactionId()).toBe(txHash);
    expect(utxo?.input().index()).toBe(1n);
    expect(utxo?.output().amount().coin()).toBe(5_000_000n);
  });

  test("resolves explicit transaction inputs", async () => {
    mockFetch(
      jsonResponse({
        outputs: [
          {
            ...blockfrostUtxo(),
            output_index: 0,
          },
          {
            ...blockfrostUtxo(),
            output_index: 2,
          },
        ],
      }),
    );

    const [utxo] = await blockfrost().resolveUnspentOutputs([
      new TransactionInput(txHash, 2n),
    ]);

    expect(utxo?.input().transactionId()).toBe(txHash);
    expect(utxo?.input().index()).toBe(2n);
  });

  test("resolves datum CBOR bytes", async () => {
    mockFetch(jsonResponse({ cbor: datumCbor }));

    const datum = await blockfrost().resolveDatum(DatumHash("3".repeat(64)));

    expect(datum.toCbor()).toBe(datumCbor);
  });

  test("submits transaction CBOR and returns the transaction id", async () => {
    const submittedTxHash = "4".repeat(64);
    const fetchMock = mockFetch(jsonResponse(submittedTxHash));
    const tx = { toCbor: () => "00" } as unknown as Transaction;

    await expect(blockfrost().postTransactionToChain(tx)).resolves.toBe(
      submittedTxHash,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cardano-preview.blockfrost.io/api/v0//tx/submit",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/cbor",
          project_id: "project-id",
        }),
      }),
    );
  });

  test("updates redeemer execution units from evaluation responses", async () => {
    mockFetch(
      jsonResponse({
        result: {
          EvaluationResult: {
            "spend:0": { memory: 123, steps: 456 },
          },
        },
      }),
    );

    const evaluated = await blockfrost().evaluateTransaction(txWithRedeemers());
    const [evaluatedRedeemer] = evaluated.values();

    expect(evaluatedRedeemer?.exUnits().toCore()).toEqual({
      memory: 123,
      steps: 456,
    });
  });

  test("resolves script refs from script objects or hashes", async () => {
    const provider = blockfrost();
    const spy = vi.spyOn(provider, "getUnspentOutputs").mockResolvedValue([]);

    await expect(
      provider.resolveScriptRef(Hash28ByteBase16("0".repeat(56))),
    ).resolves.not.toThrow();
    await expect(provider.resolveScriptRef(alwaysTrueScript)).resolves.not.toThrow();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  test("propagates Blockfrost API error messages", async () => {
    mockFetch(jsonResponse({ message: "bad key" }));

    await expect(blockfrost().getParameters()).rejects.toThrow(
      'getParameters: Blockfrost threw "bad key"',
    );
  });

  test("propagates submission failures with response body", async () => {
    mockFetch(textResponse("submit failed", { status: 400 }));
    const tx = { toCbor: () => "00" } as unknown as Transaction;

    await expect(blockfrost().postTransactionToChain(tx)).rejects.toThrow(
      "postTransactionToChain: failed to submit transaction to Blockfrost endpoint.\nError submit failed",
    );
  });
});
