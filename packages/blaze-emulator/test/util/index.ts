import {
  generateMnemonic,
  wordlist,
  mnemonicToEntropy,
  Bip32PrivateKey,
  TransactionOutput,
  Transaction,
  TransactionId,
  AddressType,
  HexBlob,
  NetworkId,
  Address,
  Script,
  PlutusV2Script,
  PlutusData,
} from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Blaze } from "@blaze-cardano/sdk";
import { makeValue } from "@blaze-cardano/tx";
import { HotWallet } from "@blaze-cardano/wallet";

export const generateSeedPhrase = () => generateMnemonic(wordlist);

export const VOID_PLUTUS_DATA = PlutusData.fromCbor(HexBlob("00"));
export const ONE_PLUTUS_DATA = PlutusData.fromCbor(HexBlob("01"));

export const SAMPLE_PLUTUS_DATA = PlutusData.fromCore(
  new Uint8Array([1, 2, 3]),
);

export async function masterkeyFromMnenomic(mnemonic: string) {
  const entropy = mnemonicToEntropy(mnemonic, wordlist);
  const masterkey = Bip32PrivateKey.fromBip39Entropy(Buffer.from(entropy), "");
  return masterkey;
  //   return new HotWallet(ed25519priv.hex(), NetworkId.Testnet, emulatorProvider);
}

export const alwaysTrueScript = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

export function generateGenesisOutputs(address: Address): TransactionOutput[] {
  return Array(10).fill(
    new TransactionOutput(address, makeValue(1_000_000_000n)),
  );
}

export async function generateAccount(
  addressType: AddressType = AddressType.BasePaymentKeyStakeKey,
) {
  const mnemonic = generateMnemonic(wordlist);
  const masterkey = await masterkeyFromMnenomic(mnemonic);

  const { address } = await HotWallet.generateAccountAddressFromMasterkey(
    masterkey,
    NetworkId.Testnet,
    addressType,
  );
  return {
    address,
    masterkeyHex: masterkey.hex(),
  };
}

export async function signAndSubmit(
  tx: Transaction,
  blaze: Blaze<Provider, HotWallet>,
  signWithStakeKey: boolean = false,
): Promise<TransactionId> {
  const signed = await blaze.wallet.signTransaction(tx, true, signWithStakeKey);
  const ws = tx.witnessSet();
  ws.setVkeys(signed.vkeys()!);
  tx.setWitnessSet(ws);
  return await blaze.provider.postTransactionToChain(tx);
}
