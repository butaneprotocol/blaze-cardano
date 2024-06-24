import type { Transaction, TransactionId } from "@blaze-cardano/core";
import {
  generateMnemonic,
  wordlist,
  mnemonicToEntropy,
  Bip32PrivateKey,
  TransactionOutput,
  AddressType,
  CredentialType,
  HexBlob,
  NetworkId,
  Address,
  Script,
  PlutusV2Script,
  PlutusData,
  Credential,
  Hash28ByteBase16,
  addressFromCredential,
} from "@blaze-cardano/core";
import type { Provider } from "@blaze-cardano/query";
import type { Blaze } from "@blaze-cardano/sdk";
import { makeValue } from "@blaze-cardano/tx";
import { HotWallet, type Wallet } from "@blaze-cardano/wallet";

export const generateSeedPhrase = () => generateMnemonic(wordlist);

export const VOID_PLUTUS_DATA = PlutusData.fromCbor(HexBlob("00"));
export const ONE_PLUTUS_DATA = PlutusData.fromCbor(HexBlob("01"));

// From https://cardano-tools.io/burn-address
export const LOCK_SCRIPT_HASH =
  "bbece14f554b0020fe2715d05801f4680ebd40d11a58f14740b9f2c5";
export const DEPLOYMENT_ADDR = addressFromCredential(
  NetworkId.Testnet,
  Credential.fromCore({
    hash: Hash28ByteBase16(LOCK_SCRIPT_HASH),
    type: CredentialType.ScriptHash,
  }),
);

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
  blaze: Blaze<Provider, Wallet>,
): Promise<TransactionId> {
  const signed = await blaze.wallet.signTransaction(tx, true);
  const ws = tx.witnessSet();
  ws.setVkeys(signed.vkeys()!);
  tx.setWitnessSet(ws);
  return await blaze.provider.postTransactionToChain(tx);
}
