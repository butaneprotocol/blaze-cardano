import { Bip32PrivateKey, mnemonicToEntropy, wordlist, AssetName, PolicyId, TransactionInput, TransactionId } from "../../packages/blaze-core/dist/index.js";
import { HotWallet, Core, Blaze, Blockfrost, Maestro, U5C } from "../../packages/blaze-sdk/dist/index.js";
const provider = new U5C({
    url: "http://localhost:50051"
})

const mnemonic = "end link visit estate sock hurt crucial forum eagle earn idle laptop wheat rookie when hard suffer duty kingdom clerk glide mechanic debris jar";
const entropy = mnemonicToEntropy(mnemonic, wordlist);
const masterkey = Bip32PrivateKey.fromBip39Entropy(Buffer.from(entropy), "");

const wallet = await HotWallet.fromMasterkey(masterkey.hex(), provider);
console.log("Address", wallet.address.toBytes().toString());

const utxos = await provider.getUnspentOutputs(wallet.address);
utxos.forEach(utxo => console.log(utxo.toCore()));

const utxosByAsset = await provider.getUnspentOutputsWithAsset(
    wallet.address,
    Core.AssetId.fromParts(PolicyId("8b05e87a51c1d4a0fa888d2bb14dbc25e8c343ea379a171b63aa84a0"), AssetName("434e4354"))
);
utxosByAsset.forEach(utxo => console.log(utxo));

const utxosByNft = await provider.getUnspentOutputByNFT(
    Core.AssetId.fromParts(PolicyId("8b05e87a51c1d4a0fa888d2bb14dbc25e8c343ea379a171b63aa84a0"), AssetName("434e4354"))
);

const utxosByOutputRef1 = await provider.resolveUnspentOutputs([
    new TransactionInput(TransactionId("f8f1338d0eadd9033c585b5451b2f38d7aca5a7556af1f600f5323a6c68c7973"), 0n)
]);
const utxosByOutputRef2 = await provider.resolveUnspentOutputs([
    new TransactionInput(TransactionId("a7a4d76d314c50ad4374f34b616dc9a063cf322ce150b35459b711c147ee7e8d"), 0n)
]);

console.log("Utxos", utxos.length);
console.log("Utxos by asset", utxosByAsset.length);
console.log("Utxos by NFT", utxosByNft.toCore());
console.log("Utxos by output ref", utxosByOutputRef1.length, utxosByOutputRef1[0]?.toCore());
console.log("Utxos by output ref", utxosByOutputRef2.length, utxosByOutputRef2[0]?.toCore());


// const blaze = new Blaze(provider, wallet);
// console.log("Balance", (await wallet.getBalance()).toCore());
// const utxosResponse = await wallet.getUnspentOutputs();
// const utxos = utxosResponse.map(utxo => utxo.toCbor().toString());

// const tx = await (await blaze.newTransaction())
//   .payLovelace(
//     Core.Address.fromBech32("addr_test1qrnrqg4s73skqfyyj69mzr7clpe8s7ux9t8z6l55x2f2xuqra34p9pswlrq86nq63hna7p4vkrcrxznqslkta9eqs2nsmlqvnk"), 
//     5_000_000n
//   )
//   .complete();

// const signexTx = await blaze.signTransaction(tx);
// console.log("signed tx", signexTx.toCbor().toString());

// const txId = await blaze.provider.postTransactionToChain(signexTx);
// console.log("waiting for confirmation", txId);

// while (true) {
//   const confirmed = await blaze.provider.awaitTransactionConfirmation(txId, 1000 * 60);
//   if (confirmed) {
//     break;
//   }
//   await new Promise(resolve => setTimeout(resolve, 1000));
// }

// console.log("transaction confirmed", txId);

// console.log("balance", (await wallet.getBalance()).toCore());
