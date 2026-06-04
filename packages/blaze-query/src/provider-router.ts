import {
  type Address,
  type AssetId,
  type DatumHash,
  getBurnAddress,
  type Hash28ByteBase16,
  type PlutusData,
  type ProtocolParameters,
  type Redeemers,
  type Script,
  type Transaction,
  type TransactionId,
  type TransactionInput,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { Provider } from "./provider";

export type ProviderOperation =
  | "getParameters"
  | "getUnspentOutputs"
  | "getUnspentOutputsWithAsset"
  | "getUnspentOutputByNFT"
  | "resolveUnspentOutputs"
  | "resolveDatum"
  | "awaitTransactionConfirmation"
  | "postTransactionToChain"
  | "evaluateTransaction"
  | "resolveScriptRef";

export type ProviderDebugEvent =
  | {
      operation: ProviderOperation;
      provider: Provider;
      status: "start";
      params: unknown[];
    }
  | {
      operation: ProviderOperation;
      provider: Provider;
      status: "success";
      params: unknown[];
      durationMs: number;
    }
  | {
      operation: ProviderOperation;
      provider: Provider;
      status: "error";
      params: unknown[];
      durationMs: number;
      error: unknown;
    };

export type ProviderDebugLogger = (event: ProviderDebugEvent) => void;

export type ProviderRoutingConfig = {
  /**
   * Fallback provider used for any operation that is not explicitly routed.
   */
  defaultProvider: Provider;
  /**
   * Provider used for chain reads and resolution calls.
   */
  queryProvider?: Provider;
  /**
   * Provider used when evaluating transactions.
   */
  evaluationProvider?: Provider;
  /**
   * Provider used when submitting and confirming transactions.
   */
  submissionProvider?: Provider;
  /**
   * Per-operation provider overrides. These take precedence over category
   * routes such as queryProvider, evaluationProvider, and submissionProvider.
   */
  perOperation?: Partial<Record<ProviderOperation, Provider>>;
  /**
   * Optional sink for provider interaction events.
   */
  debugLogger?: ProviderDebugLogger;
};

/**
 * Provider that routes calls to separate underlying providers.
 *
 * @remarks
 * This is useful when one backend is preferred for chain queries while another
 * backend is preferred for transaction evaluation or submission. Individual
 * operations can also be overridden with `perOperation`.
 */
export class RoutedProvider extends Provider {
  private readonly defaultProvider: Provider;
  private readonly queryProvider?: Provider;
  private readonly evaluationProvider?: Provider;
  private readonly submissionProvider?: Provider;
  private readonly perOperation: Partial<Record<ProviderOperation, Provider>>;
  private readonly debugLogger?: ProviderDebugLogger;

  constructor(config: ProviderRoutingConfig) {
    super(config.defaultProvider.network, config.defaultProvider.networkName);
    this.defaultProvider = config.defaultProvider;
    this.queryProvider = config.queryProvider;
    this.evaluationProvider = config.evaluationProvider;
    this.submissionProvider = config.submissionProvider;
    this.perOperation = config.perOperation ?? {};
    this.debugLogger = config.debugLogger;
  }

  private providerFor(
    operation: ProviderOperation,
    category: "query" | "evaluation" | "submission",
  ): Provider {
    const categoryProvider =
      category === "query"
        ? this.queryProvider
        : category === "evaluation"
          ? this.evaluationProvider
          : this.submissionProvider;
    return (
      this.perOperation[operation] ?? categoryProvider ?? this.defaultProvider
    );
  }

  private async call<T>(
    operation: ProviderOperation,
    provider: Provider,
    params: unknown[],
    callback: () => Promise<T>,
  ): Promise<T> {
    if (!this.debugLogger) {
      return callback();
    }

    const start = Date.now();
    this.debugLogger({ operation, provider, status: "start", params });
    try {
      const result = await callback();
      this.debugLogger({
        operation,
        provider,
        status: "success",
        params,
        durationMs: Date.now() - start,
      });
      return result;
    } catch (error) {
      this.debugLogger({
        operation,
        provider,
        status: "error",
        params,
        durationMs: Date.now() - start,
        error,
      });
      throw error;
    }
  }

  getParameters(): Promise<ProtocolParameters> {
    const provider = this.providerFor("getParameters", "query");
    return this.call("getParameters", provider, [], () =>
      provider.getParameters(),
    );
  }

  getUnspentOutputs(
    address: Address,
  ): Promise<TransactionUnspentOutput[]> {
    const provider = this.providerFor("getUnspentOutputs", "query");
    return this.call("getUnspentOutputs", provider, [address], () =>
      provider.getUnspentOutputs(address),
    );
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    const provider = this.providerFor("getUnspentOutputsWithAsset", "query");
    return this.call(
      "getUnspentOutputsWithAsset",
      provider,
      [address, unit],
      () => provider.getUnspentOutputsWithAsset(address, unit),
    );
  }

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
    const provider = this.providerFor("getUnspentOutputByNFT", "query");
    return this.call("getUnspentOutputByNFT", provider, [unit], () =>
      provider.getUnspentOutputByNFT(unit),
    );
  }

  resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    const provider = this.providerFor("resolveUnspentOutputs", "query");
    return this.call("resolveUnspentOutputs", provider, [txIns], () =>
      provider.resolveUnspentOutputs(txIns),
    );
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    const provider = this.providerFor("resolveDatum", "query");
    return this.call("resolveDatum", provider, [datumHash], () =>
      provider.resolveDatum(datumHash),
    );
  }

  awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {
    const provider = this.providerFor(
      "awaitTransactionConfirmation",
      "submission",
    );
    return this.call(
      "awaitTransactionConfirmation",
      provider,
      [txId, timeout],
      () => provider.awaitTransactionConfirmation(txId, timeout),
    );
  }

  postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    const provider = this.providerFor("postTransactionToChain", "submission");
    return this.call("postTransactionToChain", provider, [tx], () =>
      provider.postTransactionToChain(tx),
    );
  }

  evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    const provider = this.providerFor("evaluateTransaction", "evaluation");
    return this.call(
      "evaluateTransaction",
      provider,
      [tx, additionalUtxos],
      () => provider.evaluateTransaction(tx, additionalUtxos),
    );
  }

  override resolveScriptRef(
    script: Script | Hash28ByteBase16,
    address: Address = getBurnAddress(this.network),
  ): Promise<TransactionUnspentOutput | undefined> {
    const provider = this.providerFor("resolveScriptRef", "query");
    return this.call("resolveScriptRef", provider, [script, address], () =>
      provider.resolveScriptRef(script, address),
    );
  }
}
