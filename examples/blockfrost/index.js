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
console.log(nftUtxoRef);

process.exit(0);
