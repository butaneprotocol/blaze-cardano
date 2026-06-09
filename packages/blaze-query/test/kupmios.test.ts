import { afterEach, describe, expect, test, vi } from "vitest";
import {
  Address,
  AssetId,
  DatumHash,
  ExUnits,
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
import { Kupmios } from "../src/kupmios";

const address = Address.fromBech32(
  "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
);
const txHash = TransactionId("1".repeat(64));
const datumCbor = "d87980";
const alwaysTrueScript: Script = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

type OgmiosMock = {
  url: string;
  queryLedgerStateProtocolParameters: ReturnType<typeof vi.fn>;
  submitTransaction: ReturnType<typeof vi.fn>;
  evaluateTransaction: ReturnType<typeof vi.fn>;
};

const jsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const textResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

const mockFetch = (...responses: Response[]) => {
  const fetchMock = vi.fn<typeof fetch>();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const makeOgmios = (): OgmiosMock => ({
  url: "ws://preview-v6.ogmios.local",
  queryLedgerStateProtocolParameters: vi.fn(),
  submitTransaction: vi.fn(),
  evaluateTransaction: vi.fn(),
});

const provider = (ogmios: OgmiosMock) =>
  new Kupmios("https://kupo.test", ogmios as any);

const kupoUtxo = (overrides = {}) => ({
  transaction_id: txHash,
  output_index: 1,
  address: address.toBech32(),
  value: {
    coins: "5000000",
    assets: {},
  },
  ...overrides,
});

const protocolParameters = () => ({
  minUtxoDepositCoefficient: 4310,
  maxTransactionSize: { bytes: 16384 },
  minFeeCoefficient: 44,
  minFeeConstant: { ada: { lovelace: 155381n } },
  maxBlockBodySize: { bytes: 90112 },
  maxBlockHeaderSize: { bytes: 1100 },
  stakeCredentialDeposit: { ada: { lovelace: 2_000_000n } },
  stakePoolDeposit: { ada: { lovelace: 500_000_000n } },
  stakePoolRetirementEpochBound: 18,
  desiredNumberOfStakePools: 500,
  stakePoolPledgeInfluence: "3/10",
  monetaryExpansion: "3/1000",
  treasuryExpansion: "1/5",
  minStakePoolCost: { ada: { lovelace: 340_000_000n } },
  version: { major: 10, minor: 0 },
  maxValueSize: { bytes: 5000 },
  collateralPercentage: 150,
  maxCollateralInputs: 3,
  plutusCostModels: {
    "plutus:v1": [1, 2, 3],
    "plutus:v2": [4, 5, 6],
    "plutus:v3": [7, 8, 9],
  },
  scriptExecutionPrices: { cpu: "721/10000000", memory: "577/10000" },
  maxExecutionUnitsPerTransaction: { cpu: 5000, memory: 10000 },
  maxExecutionUnitsPerBlock: { cpu: 10000, memory: 20000 },
  minFeeReferenceScripts: { base: 1, range: 1, multiplier: 1 },
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

describe("Kupmios", () => {
  test("maps Ogmios protocol parameters", async () => {
    const ogmios = makeOgmios();
    ogmios.queryLedgerStateProtocolParameters.mockResolvedValue(
      protocolParameters(),
    );

    const params = await provider(ogmios).getParameters();

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

  test("parses Kupo address UTxO responses", async () => {
    const ogmios = makeOgmios();
    const fetchMock = mockFetch(textResponse([kupoUtxo()]));

    const [utxo] = await provider(ogmios).getUnspentOutputs(address);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://kupo.test/matches/${address.toBech32()}?unspent`,
    );
    expect(utxo?.input().transactionId()).toBe(txHash);
    expect(utxo?.input().index()).toBe(1n);
    expect(utxo?.output().amount().coin()).toBe(5_000_000n);
  });

  test("filters Kupo UTxOs by asset", async () => {
    const ogmios = makeOgmios();
    const unit = AssetId("2".repeat(56) + "74657374");
    const fetchMock = mockFetch(textResponse([]));

    await provider(ogmios).getUnspentOutputsWithAsset(address, unit);

    expect(fetchMock).toHaveBeenCalledWith(
      `https://kupo.test/matches/${address.toBech32()}?unspent&policy_id=${"2".repeat(56)}&asset_name=74657374`,
    );
  });

  test("resolves explicit transaction inputs", async () => {
    const ogmios = makeOgmios();
    mockFetch(textResponse([kupoUtxo({ output_index: 2 })]));

    const [utxo] = await provider(ogmios).resolveUnspentOutputs([
      new TransactionInput(txHash, 2n),
    ]);

    expect(utxo?.input().transactionId()).toBe(txHash);
    expect(utxo?.input().index()).toBe(2n);
  });

  test("resolves datum CBOR bytes", async () => {
    const ogmios = makeOgmios();
    mockFetch(jsonResponse({ datum: datumCbor }));

    const datum = await provider(ogmios).resolveDatum(
      DatumHash("3".repeat(64)),
    );

    expect(datum.toCbor()).toBe(datumCbor);
  });

  test("resolves referenced scripts while parsing UTxOs", async () => {
    const ogmios = makeOgmios();
    const scriptHash = alwaysTrueScript.hash();
    mockFetch(
      textResponse([
        kupoUtxo({
          script_hash: scriptHash,
        }),
      ]),
      jsonResponse({
        language: "plutus:v2",
        script: alwaysTrueScript.asPlutusV2()!.rawBytes(),
      }),
    );

    const [utxo] = await provider(ogmios).getUnspentOutputs(address);

    expect(utxo?.output().scriptRef()?.hash()).toBe(scriptHash);
  });

  test("submits transactions through Ogmios", async () => {
    const ogmios = makeOgmios();
    ogmios.submitTransaction.mockResolvedValue({
      transaction: { id: "4".repeat(64) },
    });
    const tx = { toCbor: () => "00" } as unknown as Transaction;

    await expect(provider(ogmios).postTransactionToChain(tx)).resolves.toBe(
      "4".repeat(64),
    );
    expect(ogmios.submitTransaction).toHaveBeenCalledWith({ cbor: "00" });
  });

  test("updates redeemer execution units from Ogmios evaluation responses", async () => {
    const ogmios = makeOgmios();
    ogmios.evaluateTransaction.mockResolvedValue([
      {
        validator: { purpose: "spend", index: 0 },
        budget: { memory: 123, cpu: 456 },
      },
    ]);
    const tx = txWithRedeemers();

    const evaluated = await provider(ogmios).evaluateTransaction(tx, []);
    const [evaluatedRedeemer] = evaluated.values();

    expect(ogmios.evaluateTransaction).toHaveBeenCalledWith({ cbor: "00" }, []);
    expect(evaluatedRedeemer?.exUnits().toCore()).toEqual({
      memory: 123,
      steps: 456,
    });
  });

  test("throws when Kupo cannot resolve every requested input", async () => {
    const ogmios = makeOgmios();
    mockFetch(textResponse([]));

    await expect(
      provider(ogmios).resolveUnspentOutputs([
        new TransactionInput(txHash, 0n),
      ]),
    ).rejects.toThrow("Inconsistent transaction inputs");
  });
});
