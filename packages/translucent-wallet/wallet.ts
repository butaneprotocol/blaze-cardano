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

export class Wallet {
  private webWallet: WalletInterface;

  constructor(webWallet: WalletInterface) {
    this.webWallet = webWallet;
  }

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

  async getUtxos(): Promise<TransactionUnspentOutput[]> {
    const utxos = await this.webWallet.getUtxos();
    return (utxos ?? []).map((utxo) =>
      TransactionUnspentOutput.fromCbor(HexBlob(utxo))
    );
  }

  async getBalance(): Promise<Value> {
    const balance = await this.webWallet.getBalance();
    return Value.fromCbor(HexBlob(balance));
  }

  async getUsedAddresses(): Promise<Address[]> {
    const addresses = await this.webWallet.getUsedAddresses();
    return addresses.map((addy) => {
      const parsedAddy = Address.fromString(addy);
      if (!parsedAddy) {
        throw "Wallet API returned an invalid used address.";
      }
      return parsedAddy;
    });
  }

  async getUnusedAddresses(): Promise<Address[]> {
    const addresses = await this.webWallet.getUnusedAddresses();
    return addresses.map((addy) => {
      const parsedAddy = Address.fromString(addy);
      if (!parsedAddy) {
        throw "Wallet API returned an invalid unused address.";
      }
      return parsedAddy;
    });
  }

  async getChangeAddress(): Promise<Address> {
    const addy = await this.webWallet.getChangeAddress();
    const parsedAddy = Address.fromString(addy);
    if (!parsedAddy) {
      throw "Wallet API returned an invalid change address.";
    }
    return parsedAddy;
  }

  async getRewardAddresses(): Promise<RewardAddress[]> {
    const addresses = await this.webWallet.getRewardAddresses();
    return addresses.map((addy) => {
      const parsedAddy = Address.fromString(addy);
      if (!parsedAddy) {
        throw "Wallet API returned an invalid address.";
      }
      const parsedRewardAddy = RewardAddress.fromAddress(parsedAddy);
      if (!parsedRewardAddy) {
        throw "Wallet API returned an invalid reward address.";
      }
      return parsedRewardAddy;
    });
  }

  async signTx(
    tx: string,
    partialSign: boolean
  ): Promise<TransactionWitnessSet> {
    const witnessSet = await this.webWallet.signTx(tx, partialSign);
    return TransactionWitnessSet.fromCbor(HexBlob(witnessSet));
  }

  async signData(
    address: string,
    payload: string
  ): Promise<Cip30DataSignature> {
    const { signature, key } = await this.webWallet.signData(address, payload);
    return {
      key: HexBlob(key),
      signature: HexBlob(signature),
    };
  }

  async submitTx(tx: string): Promise<TransactionId> {
    const transactionId = await this.webWallet.submitTx(tx);
    return TransactionId.fromHexBlob(HexBlob(transactionId));
  }

  async getCollateral(): Promise<TransactionUnspentOutput[]> {
    const utxos = await this.webWallet.getCollateral();
    return (utxos ?? []).map((utxo) =>
      TransactionUnspentOutput.fromCbor(HexBlob(utxo))
    );
  }
}
