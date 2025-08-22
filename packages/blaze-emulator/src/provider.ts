import type {
  Address,
  ProtocolParameters,
  AssetId,
  TransactionId,
  Transaction,
  Redeemers,
  DatumHash,
  SlotConfig,
} from "@blaze-cardano/core";
import {
  TransactionInput,
  PlutusData,
  TransactionOutput,
  NetworkId,
} from "@blaze-cardano/core";
import { TransactionUnspentOutput } from "@blaze-cardano/core";
import { Provider } from "@blaze-cardano/query";
import type { Emulator } from "./emulator";

/**
 * The EmulatorProvider class implements the Provider interface.
 * It provides methods to interact with the Emulator.
 */
export class EmulatorProvider extends Provider {
  /**
   * The Emulator instance.
   */
  private emulator: Emulator;

  constructor(emulator: Emulator) {
    // TODO: dedicated emulator environment?
    super(NetworkId.Testnet);
    this.emulator = emulator;
  }
  getParameters(): Promise<ProtocolParameters> {
    return Promise.resolve(this.emulator.params);
  }

  getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]> {
    const utxos: TransactionUnspentOutput[] = [];
    const addressBytes = address.toBytes();
    for (const utxo of this.emulator.utxos()) {
      if (utxo.output().address().toBytes() == addressBytes) {
        utxos.push(TransactionUnspentOutput.fromCore(utxo.toCore()));
      }
    }
    return Promise.resolve(utxos);
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId
  ): Promise<TransactionUnspentOutput[]> {
    const utxos: TransactionUnspentOutput[] = [];
    const addressBytes = address.toBytes();
    for (const utxo of this.emulator.utxos()) {
      if (
        utxo.output().address().toBytes() == addressBytes &&
        utxo.output().amount().multiasset()?.get(unit) !== undefined
      ) {
        utxos.push(TransactionUnspentOutput.fromCore(utxo.toCore()));
      }
    }
    return Promise.resolve(utxos);
  }

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
    for (const utxo of this.emulator.utxos()) {
      if (utxo.output().amount().multiasset()?.get(unit) != undefined) {
        return Promise.resolve(
          TransactionUnspentOutput.fromCore(utxo.toCore())
        );
      }
    }
    return Promise.reject(
      "getUnspentOutputByNFT: emulated ledger had no UTxO with NFT"
    );
  }

  resolveUnspentOutputs(
    txIns: TransactionInput[]
  ): Promise<TransactionUnspentOutput[]> {
    const utxos = [];
    for (const txIn of txIns) {
      const out = this.emulator.getOutput(txIn);
      if (out)
        utxos.push(
          new TransactionUnspentOutput(
            TransactionInput.fromCore(txIn.toCore()),
            TransactionOutput.fromCore(out.toCore())
          )
        );
    }
    return Promise.resolve(utxos);
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    return Promise.resolve(
      PlutusData.fromCore(this.emulator.datumHashes[datumHash]!.toCore())
    );
  }

  awaitTransactionConfirmation(
    txId: TransactionId,
    _timeout?: number | undefined
  ): Promise<boolean> {
    this.emulator.awaitTransactionConfirmation(txId);
    return Promise.resolve(true);
  }

  postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    return this.emulator.submitTransaction(tx);
  }

  evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[]
  ): Promise<Redeemers> {
    return this.emulator.evaluator(tx, additionalUtxos);
  }
}
