import {
  Address,
  ProtocolParameters,
  TransactionUnspentOutput,
  Hash32ByteBase16,
  AssetId,
  TransactionInput,
  PlutusData,
  TransactionId,
  Transaction,
  Redeemers,
} from "@blazecardano/core";
import { Provider } from "@blazecardano/query";
import { Emulator } from "./emulator";

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
    for (const utxo of this.emulator.ledger.values()) {
      if (utxo.address() == address) {
        utxos.push(utxo);
      }
    }
    return Promise.resolve(utxos);
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    const utxos: TransactionUnspentOutput[] = [];
    for (const utxo of this.emulator.ledger.values()) {
      const output = utxo;
      if (
        output.address() == address &&
        output.amount().multiasset()?.get(unit) != undefined
      ) {
        utxos.push(utxo);
      }
    }
    return Promise.resolve(utxos);
  }

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
    for (const utxo of this.emulator.ledger.values()) {
      const output = utxo;
      if (output.amount().multiasset()?.get(unit) != undefined) {
        return Promise.resolve(utxo);
      }
    }
    return Promise.reject(
      "getUnspentOutputByNFT: emulated ledger had no UTxO with NFT",
    );
  }

  resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    const utxos = [];
    for (const utxo of this.emulator.ledger.keys()) {
      if (txIns.includes(utxo)) {
        utxos.push(utxo);
      }
    }
    return Promise.resolve(utxos);
  }

  resolveDatum(_datumHash: Hash32ByteBase16): Promise<PlutusData> {
    throw new Error("Method not implemented. (todo)");
  }

  awaitTransactionConfirmation(
    _txId: TransactionId,
    _timeout?: number | undefined,
  ): Promise<boolean> {
    throw new Error("Method not implemented. (todo)");
  }

  postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    return this.emulator.submitTransaction(tx);
  }

  evaluateTransaction(
    _tx: Transaction,
    _additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    throw new Error("Unimplemented!");
  }
}
