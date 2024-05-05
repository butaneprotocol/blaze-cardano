import type {
  Address} from "@blaze-cardano/core";
import {
  generateMnemonic,
  wordlist,
  mnemonicToEntropy,
  Bip32PrivateKey,
  TransactionOutput
} from "@blaze-cardano/core";
import { makeValue } from "@blaze-cardano/tx";

export const generateSeedPhrase = () => generateMnemonic(wordlist);

export async function privateKeyFromMnenomic(mnemonic: string) {
  const entropy = mnemonicToEntropy(mnemonic, wordlist);
  const bip32priv = await Bip32PrivateKey.fromBip39Entropy(
    Buffer.from(entropy),
    ""
  );
  return bip32priv.toRawKey();
  //   return new HotWallet(ed25519priv.hex(), NetworkId.Testnet, emulatorProvider);
}

export function generateGenesisUtxos(address: Address): TransactionOutput[] {
  return Array(10).fill(
    new TransactionOutput(address, makeValue(1_000_000_000n))
  );
}
