import type {
  Address,
  ProtocolParameters,
  AssetId,
  TransactionInput,
  PlutusData,
  TransactionId,
  Transaction,
  Redeemers,
  DatumHash,
} from "@blaze-cardano/core";
import { TransactionUnspentOutput } from "@blaze-cardano/core";

import type { Provider } from "@blaze-cardano/query";
import type { Emulator } from "./emulator";

/**
 * The EmulatorProvider class implements the Provider interface.
 * It provides methods to interact with the Emulator.
 */
export class EmulatorProvider implements Provider {
  /**
   * The Emulator instance.
   */
  private emulator: Emulator;

  constructor(emulator: Emulator) {
    this.emulator = emulator;
  }
  getParameters(): Promise<ProtocolParameters> {
    return Promise.resolve(this.emulator.params);
  }

  getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]> {
    const utxos: TransactionUnspentOutput[] = [];
    for (const utxo of this.emulator.utxos()) {
      if (utxo.output().address() == address) {
        utxos.push(utxo);
      }
    }
    return Promise.resolve(utxos);
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId
  ): Promise<TransactionUnspentOutput[]> {
    const utxos: TransactionUnspentOutput[] = [];
    for (const utxo of this.emulator.utxos()) {
      if (
        utxo.output().address() == address &&
        utxo.output().amount().multiasset()?.get(unit) !== undefined
      ) {
        utxos.push(utxo);
      }
    }
    return Promise.resolve(utxos);
  }

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
    for (const utxo of this.emulator.utxos()) {
      if (utxo.output().amount().multiasset()?.get(unit) != undefined) {
        return Promise.resolve(utxo);
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
      if (out) utxos.push(new TransactionUnspentOutput(txIn, out));
    }
    return Promise.resolve(utxos);
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    return Promise.resolve(this.emulator.datumHashes[datumHash]!);
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
