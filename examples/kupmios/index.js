import {
  Bip32PrivateKey,
  mnemonicToEntropy,
  wordlist,
} from "../../packages/blaze-core/dist/index.js";
import { Kupmios } from "../../packages/blaze-query/dist/index.js";
import { Unwrapped } from "../../packages/blaze-ogmios/dist/index.js";
import { Blaze } from "../../packages/blaze-sdk/dist/index.js";
import { HotWallet } from "../../packages/blaze-wallet/dist/index.js";

// Tested with Kupo v2.8.0
const kupoUrl = "http://localhost:1442";

// Tested with Ogmios v6.3.0
const ogmiosUrl = "http://localhost:1337";
const ogmios = await Unwrapped.Ogmios.new(ogmiosUrl);

const provider = new Kupmios(kupoUrl, ogmios);

const mnemonic =
  "test test test test test test test test test test test test test test test test test test test test test test test sauce";
const entropy = mnemonicToEntropy(mnemonic, wordlist);
const masterkey = Bip32PrivateKey.fromBip39Entropy(Buffer.from(entropy), "");

const wallet = await HotWallet.fromMasterkey(masterkey.hex(), provider);
const blaze = await Blaze.from(provider, wallet);

const address = wallet.address;
const tx = await blaze
  .newTransaction()
  .payLovelace(address, 5_000_000n)
  .complete();

const signed = await blaze.signTransaction(tx);
const txId = await blaze.provider.postTransactionToChain(signed);

console.log(
  `Transaction with ID ${txId} has been successfully submitted to the blockchain.`,
);

const confirmed = await blaze.provider.awaitTransactionConfirmation(txId);

console.log(
  `Transaction ${confirmed ? "is confirmed and" : "was not"} accepted on the blockchain.`,
);
