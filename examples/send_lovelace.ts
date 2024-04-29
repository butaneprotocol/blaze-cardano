import { HotWallet } from "../packages/blaze-wallet/hot";
import {
  Ed25519PrivateNormalKeyHex,
  addressFromBech32,
} from "../packages/blaze-core";
import { Maestro } from "../packages/blaze-query";
import { Blaze } from "../packages/blaze";

let pkhHex = "... the public key hex ...";

// $butane wallet can collect donations for us
const micahWallet = addressFromBech32(
  "addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4",
);

/**
 * In this example we:
 * - prepare the provider, wallet, blaze,
 * - build a transaction paying out 50 ada to Micah's Wallet
 * - sign & submit that transaction
 */
async function runExample() {
  // Prepare Provider
  const provider = new Maestro({
    network: "mainnet",
    apiKey: "...your maestro api key...",
  });
  // Prepare Wallet
  const wallet = new HotWallet(Ed25519PrivateNormalKeyHex(pkhHex), 0, provider);
  console.log("Your blaze address: ", wallet.address.toBech32());
  // Prepare Blaze
  const blaze = new Blaze(
    provider,
    new HotWallet(Ed25519PrivateNormalKeyHex(pkhHex), 0, provider),
  );

  // Use the awesome transaction builder
  const tx = await (await blaze.newTransaction())
    .payLovelace(micahWallet, 5n * 1_000_000n)
    .complete();

  // Attach signatures (scuffed as fuck)
  const signed = await wallet.signTransaction(tx);
  let ws = tx.witnessSet();
  ws.setVkeys(signed.vkeys()!);
  tx.setWitnessSet(ws);

  // Post transaction to the chain
  console.log(await blaze.provider.postTransactionToChain(tx));
}

runExample();
