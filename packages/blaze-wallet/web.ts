import {
  Address,
  HexBlob,
  NetworkId,
  RewardAddress,
  Transaction,
  TransactionId,
  TransactionUnspentOutput,
  TransactionWitnessSet,
  Value,
} from "../blaze-core";
import { Wallet, CIP30DataSignature, CIP30Interface } from "./types";

/**
 * Wallet class that interacts with the WalletInterface.
 */
export class WebWallet implements Wallet {
  private webWallet: CIP30Interface;

  /**
   * Constructs a new instance of the WebWallet class.
   * @param {CIP30Interface} webWallet - The CIP30Interface to be used.
   */
  constructor(webWallet: CIP30Interface) {
    this.webWallet = webWallet;
  }

  /**
   * Retrieves the network ID of the currently connected account.
   * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
   */
  async getNetworkId(): Promise<NetworkId> {
    const id = await this.webWallet.getNetworkId();
    switch (id) {
      case 0:
        return 0;
      case 1:
        return 1;
      default:
        throw new Error("Could not resolve CIP30 network id.");
    }
  }

  /**
   * Retrieves the UTxO(s) controlled by the wallet.
   * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
   */
  async getUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    const utxos = await this.webWallet.getUtxos();
    return (utxos ?? []).map((utxo) =>
      TransactionUnspentOutput.fromCbor(HexBlob(utxo)),
    );
  }

  /**
   * Retrieves the total available balance of the wallet, encoded in CBOR.
   * @returns {Promise<Value>} - The balance of the wallet.
   */
  async getBalance(): Promise<Value> {
    const balance = await this.webWallet.getBalance();
    return Value.fromCbor(HexBlob(balance));
  }

  /**
   * Retrieves all used addresses controlled by the wallet.
   * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
   */
  async getUsedAddresses(): Promise<Address[]> {
    const addresses = await this.webWallet.getUsedAddresses();
    return addresses.map((addy) => {
      const parsedAddy = Address.fromString(addy);
      if (!parsedAddy) {
        throw new Error(
          "getUsedAddresses: Wallet API returned an invalid used address.",
        );
      }
      return parsedAddy;
    });
  }

  /**
   * Retrieves all unused addresses controlled by the wallet.
   * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
   */
  async getUnusedAddresses(): Promise<Address[]> {
    const addresses = await this.webWallet.getUnusedAddresses();
    return addresses.map((addy) => {
      const parsedAddy = Address.fromString(addy);
      if (!parsedAddy) {
        throw new Error(
          "getUnusedAddresses: Wallet API returned an invalid unused address.",
        );
      }
      return parsedAddy;
    });
  }

  /**
   * Retrieves an address owned by the wallet which should be used to return transaction change.
   * @returns {Promise<Address>} - The change address.
   */
  async getChangeAddress(): Promise<Address> {
    const addy = await this.webWallet.getChangeAddress();
    const parsedAddy = Address.fromString(addy);
    if (!parsedAddy) {
      throw new Error(
        "getChangeAddress: Wallet API returned an invalid change address.",
      );
    }
    return parsedAddy;
  }

  /**
   * Retrieves the reward addresses controlled by the wallet.
   * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
   */
  async getRewardAddresses(): Promise<RewardAddress[]> {
    const addresses = await this.webWallet.getRewardAddresses();
    return addresses.map((addy) => {
      const parsedAddy = Address.fromString(addy);
      if (!parsedAddy) {
        throw new Error(
          "getRewardAddresses: Wallet API returned an invalid address.",
        );
      }
      const parsedRewardAddy = RewardAddress.fromAddress(parsedAddy);
      if (!parsedRewardAddy) {
        throw new Error(
          "getRewardAddresses: Wallet API returned an invalid reward address.",
        );
      }
      return parsedRewardAddy;
    });
  }

  /**
   * Requests a transaction signature from the wallet.
   * @param {string} tx - The transaction to sign.
   * @param {boolean} partialSign - Whether to partially sign the transaction.
   * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
   */
  async signTransaction(
    tx: Transaction,
    partialSign: boolean,
  ): Promise<TransactionWitnessSet> {
    const witnessSet = await this.webWallet.signTx(tx.toCbor(), partialSign);
    return TransactionWitnessSet.fromCbor(HexBlob(witnessSet));
  }

  /**
   * Requests signed data from the wallet.
   * @param {Address} address - The address to sign the data with.
   * @param {string} payload - The data to sign.
   * @returns {Promise<CIP30DataSignature>} - The signed data.
   */
  async signData(
    address: Address,
    payload: string,
  ): Promise<CIP30DataSignature> {
    const { signature, key } = await this.webWallet.signData(
      address.toBech32(),
      payload,
    );
    return {
      key: HexBlob(key),
      signature: HexBlob(signature),
    };
  }

  /**
   * Submits a transaction through the wallet.
   * @param {Transaction} tx - The transaction to submit.
   * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
   */
  async postTransaction(tx: Transaction): Promise<TransactionId> {
    const transactionId = await this.webWallet.submitTx(tx.toCbor());
    return TransactionId.fromHexBlob(HexBlob(transactionId));
  }

  /**
   * Retrieves the collateral UTxO(s) for the wallet.
   * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
   */
  async getCollateral(): Promise<TransactionUnspentOutput[]> {
    const utxos = await this.webWallet.getCollateral();
    return (utxos ?? []).map((utxo) =>
      TransactionUnspentOutput.fromCbor(HexBlob(utxo)),
    );
  }
}
