import { describe, expect, test } from "vitest";
import {
  Provider,
  RoutedProvider,
  type NetworkName,
  type ProviderDebugEvent,
} from "../src";
import {
  NetworkId,
  type Address,
  type AssetId,
  type DatumHash,
  type PlutusData,
  type ProtocolParameters,
  type Redeemers,
  type Transaction,
  type TransactionId,
  type TransactionInput,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";

class StubProvider extends Provider {
  calls: string[] = [];

  constructor(
    readonly label: string,
    networkName: NetworkName = "cardano-preview",
  ) {
    super(NetworkId.Testnet, networkName);
  }

  async getParameters(): Promise<ProtocolParameters> {
    this.calls.push("getParameters");
    return {} as ProtocolParameters;
  }

  async getUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    this.calls.push("getUnspentOutputs");
    return [];
  }

  async getUnspentOutputsWithAsset(): Promise<TransactionUnspentOutput[]> {
    this.calls.push("getUnspentOutputsWithAsset");
    return [];
  }

  async getUnspentOutputByNFT(): Promise<TransactionUnspentOutput> {
    this.calls.push("getUnspentOutputByNFT");
    return `${this.label}:nft` as unknown as TransactionUnspentOutput;
  }

  async resolveUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    this.calls.push("resolveUnspentOutputs");
    return [];
  }

  async resolveDatum(): Promise<PlutusData> {
    this.calls.push("resolveDatum");
    return `${this.label}:datum` as unknown as PlutusData;
  }

  async awaitTransactionConfirmation(): Promise<boolean> {
    this.calls.push("awaitTransactionConfirmation");
    return true;
  }

  async postTransactionToChain(): Promise<TransactionId> {
    this.calls.push("postTransactionToChain");
    return `${this.label}:txid` as unknown as TransactionId;
  }

  async evaluateTransaction(): Promise<Redeemers> {
    this.calls.push("evaluateTransaction");
    return `${this.label}:redeemers` as unknown as Redeemers;
  }

  override async resolveScriptRef(): Promise<TransactionUnspentOutput | undefined> {
    this.calls.push("resolveScriptRef");
    return `${this.label}:script-ref` as unknown as TransactionUnspentOutput;
  }
}

describe("RoutedProvider", () => {
  test("routes query, evaluation, and submission operations separately", async () => {
    const fallback = new StubProvider("fallback");
    const query = new StubProvider("query");
    const evaluation = new StubProvider("evaluation");
    const submission = new StubProvider("submission");
    const provider = new RoutedProvider({
      defaultProvider: fallback,
      queryProvider: query,
      evaluationProvider: evaluation,
      submissionProvider: submission,
    });

    await provider.getParameters();
    await provider.resolveDatum("datum" as unknown as DatumHash);
    await provider.evaluateTransaction(
      "tx" as unknown as Transaction,
      [],
    );
    await provider.postTransactionToChain("tx" as unknown as Transaction);
    await provider.awaitTransactionConfirmation(
      "txid" as unknown as TransactionId,
    );

    expect(query.calls).toEqual(["getParameters", "resolveDatum"]);
    expect(evaluation.calls).toEqual(["evaluateTransaction"]);
    expect(submission.calls).toEqual([
      "postTransactionToChain",
      "awaitTransactionConfirmation",
    ]);
    expect(fallback.calls).toEqual([]);
  });

  test("supports per-operation provider overrides", async () => {
    const fallback = new StubProvider("fallback");
    const query = new StubProvider("query");
    const override = new StubProvider("override");
    const provider = new RoutedProvider({
      defaultProvider: fallback,
      queryProvider: query,
      perOperation: {
        getUnspentOutputs: override,
      },
    });

    await provider.getUnspentOutputs("addr" as unknown as Address);
    await provider.getUnspentOutputsWithAsset(
      "addr" as unknown as Address,
      "asset" as unknown as AssetId,
    );

    expect(override.calls).toEqual(["getUnspentOutputs"]);
    expect(query.calls).toEqual(["getUnspentOutputsWithAsset"]);
    expect(fallback.calls).toEqual([]);
  });

  test("emits debug events around provider calls", async () => {
    const events: ProviderDebugEvent[] = [];
    const provider = new RoutedProvider({
      defaultProvider: new StubProvider("default"),
      debugLogger: (event) => events.push(event),
    });

    await provider.resolveUnspentOutputs([
      "input" as unknown as TransactionInput,
    ]);

    expect(events.map((event) => event.status)).toEqual(["start", "success"]);
    expect(events.map((event) => event.operation)).toEqual([
      "resolveUnspentOutputs",
      "resolveUnspentOutputs",
    ]);
    expect(events[1]).toMatchObject({
      status: "success",
      durationMs: expect.any(Number),
    });
  });
});
