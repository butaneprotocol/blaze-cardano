import { afterEach, describe, expect, test, vi } from "vitest";
import {
  Address,
  ExUnits,
  HexBlob,
  PlutusData,
  Redeemer,
  RedeemerPurpose,
  Redeemers,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  Value,
  type Transaction,
} from "@blaze-cardano/core";
import { Maestro } from "../src";

const address = Address.fromBech32(
  "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
);
const txHash = TransactionId("1".repeat(64));
const txOutput = new TransactionOutput(
  address,
  Value.fromCore({ coins: 5_000_000n }),
);
const txOutputCbor = txOutput.toCbor();
const lastUpdated = {
  timestamp: "now",
  block_hash: "2".repeat(64),
  block_slot: 1,
};

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

const maestro = () => new Maestro({ network: "preview", apiKey: "test-key" });

const protocolParametersResponse = () => ({
  data: {
    collateral_percentage: 150,
    constitutional_committee_max_term_length: 10,
    constitutional_committee_min_size: 3,
    delegate_representative_deposit: { ada: { lovelace: 2_000_000 } },
    delegate_representative_max_idle_time: 20,
    delegate_representative_voting_thresholds: {
      constitution: "1/2",
      constitutional_committee: {
        default: "1/2",
        state_of_no_confidence: "1/2",
      },
      hard_fork_initiation: "1/2",
      no_confidence: "1/2",
      protocol_parameters_update: {
        economic: "1/2",
        governance: "1/2",
        network: "1/2",
        technical: "1/2",
      },
      treasury_withdrawals: "1/2",
    },
    desired_number_of_stake_pools: 500,
    governance_action_deposit: { ada: { lovelace: 100_000_000 } },
    governance_action_lifetime: 10,
    max_block_body_size: { bytes: 90_112 },
    max_block_header_size: { bytes: 1_100 },
    max_collateral_inputs: 3,
    max_execution_units_per_block: { cpu: 10_000, memory: 20_000 },
    max_execution_units_per_transaction: { cpu: 5_000, memory: 10_000 },
    max_reference_scripts_size: { bytes: 200_000 },
    max_transaction_size: { bytes: 16_384 },
    max_value_size: { bytes: 5_000 },
    min_fee_coefficient: 44,
    min_fee_constant: { ada: { lovelace: 155_381 } },
    min_fee_reference_scripts: { base: 1, multiplier: 1, range: 1 },
    min_stake_pool_cost: { ada: { lovelace: 340_000_000 } },
    min_utxo_deposit_coefficient: 4_310,
    min_utxo_deposit_constant: { ada: { lovelace: 1_000_000 } },
    monetary_expansion: "3/1000",
    plutus_cost_models: {
      plutus_v1: [1, 2, 3],
      plutus_v2: [4, 5, 6],
      plutus_v3: [7, 8, 9],
    },
    script_execution_prices: { cpu: "721/10000000", memory: "577/10000" },
    stake_credential_deposit: { ada: { lovelace: 2_000_000 } },
    stake_pool_deposit: { ada: { lovelace: 500_000_000 } },
    stake_pool_pledge_influence: "3/10",
    stake_pool_retirement_epoch_bound: 18,
    stake_pool_voting_thresholds: {
      constitutional_committee: {
        default: "1/2",
        state_of_no_confidence: "1/2",
      },
      hard_fork_initiation: "1/2",
      no_confidence: "1/2",
      protocol_parameters_update: { security: "1/2" },
    },
    treasury_expansion: "1/5",
    version: { major: 10, minor: 0 },
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Maestro", () => {
  test("maps protocol parameters and includes API-key headers", async () => {
    const fetchMock = mockFetch(jsonResponse(protocolParametersResponse()));

    const params = await maestro().getParameters();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://preview.gomaestro-api.org/v1/protocol-parameters",
      { headers: { "api-key": "test-key" } },
    );
    expect(params.minFeeCoefficient).toBe(44);
    expect(params.protocolVersion).toEqual({ major: 10, minor: 0 });
    expect(params.costModels.get(0)).toEqual([1, 2, 3]);
    expect(params.costModels.get(1)).toEqual([4, 5, 6]);
    expect(params.costModels.get(2)).toEqual([7, 8, 9]);
    expect(params.prices).toEqual({
      memory: 577 / 10000,
      steps: 721 / 10000000,
    });
  });

  test("parses address UTxO responses from transaction-output CBOR", async () => {
    const fetchMock = mockFetch(
      jsonResponse({
        data: [
          {
            tx_hash: txHash,
            index: 1,
            slot: 10,
            txout_cbor: txOutputCbor,
          },
        ],
        last_updated: lastUpdated,
        next_cursor: null,
      }),
    );

    const [utxo] = await maestro().getUnspentOutputs(address);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://preview.gomaestro-api.org/v1/addresses/${address.toBech32()}/utxos?with_cbor=true&count=100`,
      { headers: { "api-key": "test-key" } },
    );
    expect(utxo?.input().transactionId()).toBe(txHash);
    expect(utxo?.input().index()).toBe(1n);
    expect(utxo?.output().toCbor()).toBe(txOutputCbor);
  });

  test("resolves explicit transaction inputs by POST body", async () => {
    const txIn = new TransactionInput(txHash, 2n);
    const fetchMock = mockFetch(
      jsonResponse({
        data: [
          {
            tx_hash: txHash,
            index: 2,
            assets: [],
            address: address.toBech32(),
            txout_cbor: txOutputCbor,
          },
        ],
        last_updated: lastUpdated,
        next_cursor: null,
      }),
    );

    const [utxo] = await maestro().resolveUnspentOutputs([txIn]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://preview.gomaestro-api.org/v1/transactions/outputs?with_cbor=true",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify([`${txHash}#2`]),
      }),
    );
    expect(utxo?.input().transactionId()).toBe(txHash);
    expect(utxo?.output().toCbor()).toBe(txOutputCbor);
  });

  test("resolves datum CBOR bytes", async () => {
    mockFetch(
      jsonResponse({
        data: { json: null, bytes: "d87980" },
        last_updated: lastUpdated,
      }),
    );

    const datum = await maestro().resolveDatum("3".repeat(64));

    expect(datum.toCbor()).toBe("d87980");
  });

  test("submits transaction CBOR and returns the transaction id", async () => {
    const submittedTxHash = "4".repeat(64);
    const tx = { toCbor: () => "00" } as unknown as Transaction;
    const fetchMock = mockFetch(textResponse(submittedTxHash));

    await expect(maestro().postTransactionToChain(tx)).resolves.toBe(
      submittedTxHash,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://preview.gomaestro-api.org/v1/txmanager",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/cbor",
          "api-key": "test-key",
        }),
      }),
    );
  });

  test("updates redeemer execution units from evaluation responses", async () => {
    const redeemer = Redeemer.fromCore({
      index: 0,
      purpose: RedeemerPurpose.spend,
      data: PlutusData.fromCbor(HexBlob("d87980")).toCore(),
      executionUnits: ExUnits.fromCore({ memory: 0, steps: 0 }).toCore(),
    });
    const redeemers = Redeemers.fromCore([redeemer.toCore()]);
    const tx = {
      toCbor: () => "00",
      witnessSet: () => ({ redeemers: () => redeemers }),
    } as unknown as Transaction;
    mockFetch(
      jsonResponse([
        {
          redeemer_tag: "spend",
          redeemer_index: 0,
          ex_units: { mem: 123, steps: 456 },
        },
      ]),
    );

    const evaluated = await maestro().evaluateTransaction(tx, []);
    const [evaluatedRedeemer] = evaluated.values();

    expect(evaluatedRedeemer?.exUnits().toCore()).toEqual({
      memory: 123,
      steps: 456,
    });
  });

  test("propagates Maestro API error messages", async () => {
    mockFetch(jsonResponse({ message: "bad key" }));

    await expect(maestro().getParameters()).rejects.toThrow(
      'getParameters: Maestro threw "bad key"',
    );
  });

  test("propagates resolveUnspentOutputs HTTP status failures", async () => {
    mockFetch(jsonResponse({ message: "not found" }, { status: 404 }));

    await expect(
      maestro().resolveUnspentOutputs([new TransactionInput(txHash, 0n)]),
    ).rejects.toThrow(
      "resolveUnspentOutputs: Failed to resolve unspent outputs from Maestro endpoint. Status code 404",
    );
  });
});
