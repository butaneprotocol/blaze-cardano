import {
  Address,
  HexBlob,
  NetworkId,
  RewardAddress,
  TransactionId,
  TransactionUnspentOutput,
  TransactionWitnessSet,
  Value,
} from "../translucent-core";
import { Cip30DataSignature, WalletInterface } from "./types";

/**
 * Wallet class that interacts with the WalletInterface.
 */
export class Wallet {
  private webWallet: WalletInterface;

  /**
   * Constructs a new instance of the Wallet class.
   * @param {WalletInterface} webWallet - The WalletInterface to be used.
   */
  constructor(webWallet: WalletInterface) {
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
        return NetworkId.Mainnet;
      case 1:
        return NetworkId.Testnet;
      default:
        return NetworkId.Other;
    }
  }

  /**
   * Retrieves the UTxO(s) controlled by the wallet.
   * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
   */
  async getUtxos(): Promise<TransactionUnspentOutput[]> {
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
  async signTx(
    tx: string,
    partialSign: boolean,
  ): Promise<TransactionWitnessSet> {
    const witnessSet = await this.webWallet.signTx(tx, partialSign);
    return TransactionWitnessSet.fromCbor(HexBlob(witnessSet));
  }

  /**
   * Requests signed data from the wallet.
   * @param {string} address - The address to sign the data with.
   * @param {string} payload - The data to sign.
   * @returns {Promise<Cip30DataSignature>} - The signed data.
   */
  async signData(
    address: string,
    payload: string,
  ): Promise<Cip30DataSignature> {
    const { signature, key } = await this.webWallet.signData(address, payload);
    return {
      key: HexBlob(key),
      signature: HexBlob(signature),
    };
  }

  /**
   * Submits a transaction through the wallet.
   * @param {string} tx - The transaction to submit.
   * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
   */
  async submitTx(tx: string): Promise<TransactionId> {
    const transactionId = await this.webWallet.submitTx(tx);
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
