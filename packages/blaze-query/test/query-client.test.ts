import { describe, expect, test } from "vitest";
import {
  NetworkId,
  TransactionId,
  TransactionInput,
  type Address,
  type DatumHash,
  type PlutusData,
  type ProtocolParameters,
  type Redeemers,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { Provider, QueryCache, QueryClient } from "../src";

class CountingProvider extends Provider {
  calls = 0;

  constructor() {
    super(NetworkId.Testnet, "cardano-preview");
  }

  async getParameters(): Promise<ProtocolParameters> {
    this.calls += 1;
    return { source: this.calls } as unknown as ProtocolParameters;
  }

  async getUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    this.calls += 1;
    return [
      {
        input: () =>
          new TransactionInput(TransactionId(`${this.calls}`.repeat(64)), 0n),
      } as TransactionUnspentOutput,
    ];
  }

  async getUnspentOutputsWithAsset(): Promise<TransactionUnspentOutput[]> {
    return this.getUnspentOutputs();
  }

  async getUnspentOutputByNFT(): Promise<TransactionUnspentOutput> {
    const [utxo] = await this.getUnspentOutputs();
    return utxo!;
  }

  async resolveUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    return this.getUnspentOutputs();
  }

  async resolveDatum(): Promise<PlutusData> {
    this.calls += 1;
    return { source: this.calls } as unknown as PlutusData;
  }

  async awaitTransactionConfirmation(): Promise<boolean> {
    return true;
  }

  async postTransactionToChain(): Promise<TransactionId> {
    return TransactionId("1".repeat(64));
  }

  async evaluateTransaction(): Promise<Redeemers> {
    return {} as Redeemers;
  }
}

describe("QueryClient", () => {
  test("caches provider calls by operation and arguments", async () => {
    const provider = new CountingProvider();
    const client = new QueryClient(provider);
    const address = "addr" as unknown as Address;

    const first = await client.getUnspentOutputs(address);
    const second = await client.getUnspentOutputs(address);

    expect(second).toBe(first);
    expect(provider.calls).toBe(1);
  });

  test("supports explicit cache expiry", async () => {
    let now = 1_000;
    const provider = new CountingProvider();
    const client = new QueryClient(provider, {
      cache: new QueryCache<string, unknown>({ ttlMs: 10, now: () => now }),
    });

    await client.getParameters();
    await client.getParameters();
    now += 11;
    await client.getParameters();

    expect(provider.calls).toBe(2);
  });

  test("chains cached async queries through one client", async () => {
    const provider = new CountingProvider();
    const client = new QueryClient(provider);

    const result = await client.chain(async (query) => {
      const params = await query.getParameters();
      const datum = await query.resolveDatum("datum" as unknown as DatumHash);
      await query.resolveDatum("datum" as unknown as DatumHash);
      return { params, datum };
    });

    expect(result).toMatchObject({
      params: { source: 1 },
      datum: { source: 2 },
    });
    expect(provider.calls).toBe(2);
  });
});
