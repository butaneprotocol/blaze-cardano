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
  type Transaction,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { CachedProvider, Provider, QueryCache } from "../src";

class CountingProvider extends Provider {
  calls = 0;
  confirmations = 0;
  submissions = 0;
  evaluations = 0;

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

  async resolveScriptRef(): Promise<TransactionUnspentOutput | undefined> {
    return undefined;
  }

  async awaitTransactionConfirmation(): Promise<boolean> {
    this.confirmations += 1;
    return true;
  }

  async postTransactionToChain(): Promise<TransactionId> {
    this.submissions += 1;
    return TransactionId("1".repeat(64));
  }

  async evaluateTransaction(): Promise<Redeemers> {
    this.evaluations += 1;
    return {} as Redeemers;
  }
}

describe("CachedProvider", () => {
  test("is a provider-compatible cached wrapper", async () => {
    const provider = new CountingProvider();
    const cached = new CachedProvider(provider);

    expect(cached).toBeInstanceOf(Provider);
    expect(cached.network).toBe(provider.network);
    expect(cached.networkName).toBe(provider.networkName);
    expect(cached.provider()).toBe(provider);
  });

  test("caches provider calls by operation and arguments", async () => {
    const provider = new CountingProvider();
    const cached = new CachedProvider(provider);
    const address = "addr" as unknown as Address;

    const first = await cached.getUnspentOutputs(address);
    const second = await cached.getUnspentOutputs(address);

    expect(second).toBe(first);
    expect(provider.calls).toBe(1);
  });

  test("supports explicit cache expiry", async () => {
    let now = 1_000;
    const provider = new CountingProvider();
    const cached = new CachedProvider(provider, {
      cache: new QueryCache<string, unknown>({ ttlMs: 10, now: () => now }),
    });

    await cached.getParameters();
    await cached.getParameters();
    now += 11;
    await cached.getParameters();

    expect(provider.calls).toBe(2);
  });

  test("chains cached async queries through one provider", async () => {
    const provider = new CountingProvider();
    const cached = new CachedProvider(provider);

    const result = await cached.chain(async (query) => {
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

  test("delegates side-effecting provider operations without caching", async () => {
    const provider = new CountingProvider();
    const cached = new CachedProvider(provider);

    await cached.awaitTransactionConfirmation(TransactionId("1".repeat(64)));
    await cached.awaitTransactionConfirmation(TransactionId("1".repeat(64)));
    await cached.postTransactionToChain({} as Transaction);
    await cached.postTransactionToChain({} as Transaction);
    await cached.evaluateTransaction({} as Transaction, []);
    await cached.evaluateTransaction({} as Transaction, []);

    expect(provider.confirmations).toBe(2);
    expect(provider.submissions).toBe(2);
    expect(provider.evaluations).toBe(2);
  });
});
