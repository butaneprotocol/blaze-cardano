import {
  Address,
  NetworkId,
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
import {
  Provider,
  QueryCache,
  QueryClient,
  pollAddressEvents,
} from "@blaze-cardano/query";
import { fileURLToPath } from "node:url";

const address = Address.fromBech32(
  "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
);

class StaticProvider extends Provider {
  constructor() {
    super(NetworkId.Testnet, "cardano-preview");
  }

  async getParameters(): Promise<ProtocolParameters> {
    return {} as ProtocolParameters;
  }

  async getUnspentOutputs(
    _address: Address,
  ): Promise<TransactionUnspentOutput[]> {
    return [];
  }

  async getUnspentOutputsWithAsset(
    _address: Address,
    _unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    return [];
  }

  async getUnspentOutputByNFT(
    _unit: AssetId,
  ): Promise<TransactionUnspentOutput> {
    throw new Error("The demo provider does not contain NFT UTxOs.");
  }

  async resolveUnspentOutputs(
    _txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    return [];
  }

  async resolveDatum(_datumHash: DatumHash): Promise<PlutusData> {
    throw new Error("The demo provider does not contain datums.");
  }

  async awaitTransactionConfirmation(
    _txId: TransactionId,
    _timeout?: number,
  ): Promise<boolean> {
    return false;
  }

  async postTransactionToChain(_tx: Transaction): Promise<TransactionId> {
    throw new Error("The demo provider does not submit transactions.");
  }

  async evaluateTransaction(
    _tx: Transaction,
    _additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    throw new Error("The demo provider does not evaluate transactions.");
  }
}

export const runAdvancedQueryExample = async (
  provider: Provider,
  pollDurationMs = 30_000,
) => {
  const query = new QueryClient(provider, {
    cache: new QueryCache<string, unknown>({ ttlMs: 10_000, maxEntries: 500 }),
  });

  const result = await query.chain(async (client) => {
    const params = await client.getParameters();
    const utxos = await client.getUnspentOutputs(address);
    return { params, utxos };
  });

  console.log(`Found ${result.utxos.length} UTxOs`);

  const controller = new AbortController();
  setTimeout(() => controller.abort(), pollDurationMs);

  for await (const event of pollAddressEvents(provider, {
    address,
    intervalMs: 5_000,
    signal: controller.signal,
    types: ["utxoProduced", "utxoSpent"],
  })) {
    if (event.type === "utxoProduced" || event.type === "utxoSpent") {
      console.log(event.type, event.input.toCore());
    }
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await runAdvancedQueryExample(new StaticProvider(), 50);
}
