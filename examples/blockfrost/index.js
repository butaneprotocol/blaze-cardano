// Run example from project top level with the following commands:
// $ pnpm install && pnpm build
// $ BLOCKFROST_PROJECT_ID="..." bun run examples/blockfrost/index.js
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
const rl = readline.createInterface({ input: stdin, output: stdout });

import {
  Address,
  AssetId,
  fromHex,
  TransactionInput,
} from "../../packages/blaze-core/dist/index.js";
import { Blockfrost } from "./../../packages/blaze-query/dist/index.js";
import {
  Blaze,
  ColdWallet,
  Core,
} from "../../packages/blaze-sdk/dist/index.js";

const projectId = process.env["BLOCKFROST_PROJECT_ID"];
if (!projectId) {
  throw new Error("Missing blockfrost key");
}

const provider = new Blockfrost({
  network: "cardano-preview",
  projectId,
});

// Preview address with BTN
let address = Core.addressFromBech32(
  "addr_test1qrks8q2cvl7084pnnc82t8rkrhq464567urqfjvgavc3u56hnq4zmgv8h5g8e3hh8e0wdsa8509e2fxnkgtwsax75naskdzynd",
);

const wallet = new ColdWallet(address, 0, provider);
const blaze = new Blaze(provider, wallet);

console.log(await provider.getParameters());

const tx = await (
  await blaze.newTransaction()
)
  .payLovelace(
    Address.fromBech32(
      // Some other preview address with BTN
      "addr_test1qp7sdszpnc09mj4x9k0830lwkeexyqm04qdhsvs88kkxdndvyd9zpxkg8hrchyrmdvnpe0fuljl6spgdg3xeuhjgj4ksncykcq",
    ),
    5_000_000n,
  )
  .complete();

console.log("Balanced and unwitnessed transaction CBOR:");
console.log(tx.toCbor() + "\n");

// BTN on Preview
const btnUnit =
  "cf36b40b08ec2e215d026bb117bc044e245b95aeedff0c12ebaa4d7a42544e";
const assetId = AssetId(btnUnit);

const assetName = Buffer.from(AssetId.getAssetName(assetId), "hex").toString();

const utxos = await provider.getUnspentOutputsWithAsset(address, assetId);
console.log(`UTxOs with ${assetName} Asset (FT):`);
for (const utxo of utxos) {
  const utxoRef = `${utxo.input().transactionId()}#${utxo.input().index()}`;
  console.log(utxoRef);

  const amountADA = utxo.output().amount().coin();
  console.log(`Amount of ADA: ${amountADA / 1000000}`);

  const amountBTN = utxo.output().amount().multiasset().get(btnUnit);
  console.log(`Amount of ${assetName}: ${amountBTN / 1000000}`);
}

// Some NFT on Preview
const nft = AssetId(
  "594ec0fba6c3caa9cb74b3513de95c35738f60aa20beca658e243342.000de1404a554e474c452d4e4654",
);
const nftName = Buffer.from(AssetId.getAssetName(nft), "hex").toString();
const nftUTXO = await provider.getUnspentOutputByNFT(nft);

console.log(`\n${nftName} Asset (NFT) found on the following UTxO:`);
const nftUtxoRef = `${nftUTXO.input().transactionId()}#${nftUTXO.input().index()} `;
console.log(nftUtxoRef + "\n");

const txIns = [
  new TransactionInput(
    "74baf638a18a6ab54798cac310112af61cb1f1d6eacb8c893a10b6877cf71a8d",
    1,
  ),
];

const resolvedOutputs = await provider.resolveUnspentOutputs(txIns);

for (const utxo of resolvedOutputs) {
  const amountADA = utxo.output().amount().coin();
  console.log(`Amount of ADA: ${amountADA / 1000000}`);

  const multiAssetMap = utxo.output().amount().multiasset();
  for (const [asset, amount] of multiAssetMap.entries()) {
    const assetId = AssetId(asset);
    const assetName = Buffer.from(
      AssetId.getAssetName(assetId),
      "hex",
    ).toString();

    console.log(`Amount of ${assetName}: ${amount}`);
  }
}

const datumHash =
  "6331cbcd2e8bd43057c6d77985007226a562edfe9475acb1648ad7a54eb2c12b";
const resolvedDatum = await provider.resolveDatum(datumHash);
console.log(`\nDatum CBOR: ${resolvedDatum.asList().toCbor()}`);

const txCompleted =
  "7523354f3e46889a36b46fa09a18d87075bf1608e0bbb6eb760d5816e9c31a04";

const isTxConfirmed = await provider.awaitTransactionConfirmation(txCompleted);
console.log(`Transaction confirmed ? ${isTxConfirmed}`);

process.exit(0);
