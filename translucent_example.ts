import { HotWallet } from "./packages/translucent-wallet/hotkey";
import { Ed25519PrivateNormalKeyHex } from "./packages/translucent-core";
import { Maestro } from "./packages/translucent-query";
import { TxBuilder } from "./packages/translucent-tx";

let pkhHex = "5e65ae406105774b96809fba19aa4af44dae3bc314f5795333f14b48427753ce";

/**
 * This function performs various operations related to a wallet.
 * It prepares the wallet, queries the network, builds a transaction, signs it, and posts it to the chain.
 */
async function manageWallet() {
  // Prepare wallet
  const wallet = new HotWallet(
    Ed25519PrivateNormalKeyHex(pkhHex),
    0,
    {} as any,
  );
  console.log("translucent address: ", wallet.address.toBech32());

  // Queries
  const provider = new Maestro({
    network: "preview",
    apiKey: "OmgVDvRX1gHuXX6AwncjZe05ZcFYdJ5y", //'ninRUQmqtOwS66rddPStASM6PItD1fa8',
  });
  const params = await provider.getParameters();
  const me = wallet.address;
  const myUtxos = await provider.getUnspentOutputs(me);

  // Use the awesome transaction builder
  const tx = await new TxBuilder(params)
    .addUnspentOutputs(myUtxos)
    .setChangeAddress(me)
    .useEvaluator((x, y) => provider.evaluateTransaction(x, y))
    .payLovelace(me, 50n * 1_000_000n)
    .complete();

  // Attach signatures (scuffed as fuck)
  const signed = await wallet.signTx(tx);
  let ws = tx.witnessSet();
  ws.setVkeys(signed.vkeys()!);
  tx.setWitnessSet(ws);

  // Post (stupid name)
  console.log(await provider.postTransactionToChain(tx));
}

manageWallet();
