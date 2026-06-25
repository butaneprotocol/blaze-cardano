import type {
  Address,
  AssetId,
  DatumHash,
  Hash28ByteBase16,
  PlutusData,
  ProtocolParameters,
  Redeemers,
  Script,
  Transaction,
  TransactionId,
  TransactionInput,
  TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { QueryCache, providerCacheKey } from "./cache";
import { Provider } from "./provider";

/** @public */
export type CachedProviderOptions = {
  cache?: QueryCache<string, unknown>;
};

/** @public */
export class CachedProvider extends Provider {
  readonly #provider: Provider;
  readonly #cache: QueryCache<string, unknown>;

  constructor(provider: Provider, options: CachedProviderOptions = {}) {
    super(provider.network, provider.networkName);
    this.#provider = provider;
    this.#cache = options.cache ?? new QueryCache<string, unknown>();
  }

  provider(): Provider {
    return this.#provider;
  }

  cache(): QueryCache<string, unknown> {
    return this.#cache;
  }

  withCache(cache: QueryCache<string, unknown>): CachedProvider {
    return new CachedProvider(this.#provider, { cache });
  }

  async chain<T>(query: (provider: CachedProvider) => Promise<T>): Promise<T> {
    return query(this);
  }

  getParameters(): Promise<ProtocolParameters> {
    return this.cached("getParameters", [], () =>
      this.#provider.getParameters(),
    );
  }

  getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]> {
    return this.cached("getUnspentOutputs", [address], () =>
      this.#provider.getUnspentOutputs(address),
    );
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    return this.cached("getUnspentOutputsWithAsset", [address, unit], () =>
      this.#provider.getUnspentOutputsWithAsset(address, unit),
    );
  }

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
    return this.cached("getUnspentOutputByNFT", [unit], () =>
      this.#provider.getUnspentOutputByNFT(unit),
    );
  }

  resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    return this.cached("resolveUnspentOutputs", [txIns], () =>
      this.#provider.resolveUnspentOutputs(txIns),
    );
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    return this.cached("resolveDatum", [datumHash], () =>
      this.#provider.resolveDatum(datumHash),
    );
  }

  override resolveScriptRef(
    script: Script | Hash28ByteBase16,
    address?: Address,
  ): Promise<TransactionUnspentOutput | undefined> {
    return this.cached("resolveScriptRef", [script, address], () =>
      this.#provider.resolveScriptRef(script, address),
    );
  }

  awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {
    return this.#provider.awaitTransactionConfirmation(txId, timeout);
  }

  postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    return this.#provider.postTransactionToChain(tx);
  }

  evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    return this.#provider.evaluateTransaction(tx, additionalUtxos);
  }

  private async cached<T>(
    operation: string,
    params: readonly unknown[],
    query: () => Promise<T>,
  ): Promise<T> {
    const key = providerCacheKey(operation, params);
    const cached = this.#cache.read(key);
    if (cached.hit) return cached.value as T;
    const result = await query();
    this.#cache.set(key, result);
    return result;
  }
}
