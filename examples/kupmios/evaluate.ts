import { Unwrapped } from "../../packages/blaze-ogmios/dist/";
//import { Ogmios as OgmiosV1 } from '../../packages/blaze-ogmios/dist/';
import {
  Bip32PrivateKey,
  mnemonicToEntropy,
  wordlist,
  addressFromValidator,
  Script,
  HexBlob,
  NetworkId,
  PlutusV2Script,
  PlutusData,
} from "../../packages/blaze-core/dist/index.mjs";
import { Kupmios } from "../../packages/blaze-query/dist/index.mjs";
import { Blaze } from "../../packages/blaze-sdk/dist/index.mjs";
import { HotWallet } from "../../packages/blaze-wallet/dist/index.mjs";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Set the timeout to 5 seconds for each transaction
const sleeptime = 5000;

// Tested with Kupo v2.8.0
const kupoUrl = "http://localhost:1442";

// Tested with Ogmios v6.3.0
const ogmiosUrl = "ws://localhost:1337";
const ogmios = await Unwrapped.Ogmios.new(ogmiosUrl);

const provider = new Kupmios(kupoUrl, ogmios as any);

const mnemonic =
  "test test test test test test test test test test test test test test test test test test test test test test test sauce";

const entropy: Uint8Array = mnemonicToEntropy(mnemonic, wordlist);
const masterkey: Bip32PrivateKey = Bip32PrivateKey.fromBip39Entropy(
  Buffer.from(entropy),
  "",
);

const wallet = await HotWallet.fromMasterkey(masterkey.hex(), provider);
const blaze = await Blaze.from(provider, wallet);

const alwaysTrueScript: Script = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

const scriptAddress = addressFromValidator(NetworkId.Testnet, alwaysTrueScript);

const tx = await blaze
  .newTransaction()
  .lockLovelace(scriptAddress, 50_000_000n, PlutusData.fromCbor(HexBlob("01")))
  .complete();

const signed = await blaze.signTransaction(tx);
const txId = await blaze.provider.postTransactionToChain(signed);

console.log(
  `Transaction with ID ${txId} has been successfully submitted to the blockchain.`,
);

const confirmed = await blaze.provider.awaitTransactionConfirmation(txId);

console.log(
  `Transaction ${
    confirmed ? "is confirmed and" : "was not"
  } accepted on the blockchain.`,
);

await sleep(sleeptime);

const scriptUtxos = await blaze.provider.getUnspentOutputs(scriptAddress);

const tx1 = await blaze
  .newTransaction()
  .addInput(scriptUtxos[0], PlutusData.fromCbor(HexBlob("00")))
  .provideScript(alwaysTrueScript)
  .complete();

const signed1 = await blaze.signTransaction(tx1);
const txId1 = await blaze.provider.postTransactionToChain(signed1);

const confirmed1 = await blaze.provider.awaitTransactionConfirmation(txId1);

console.log(
  `Transaction ${
    confirmed1 ? "is confirmed and" : "was not"
  } accepted on the blockchain.`,
);
