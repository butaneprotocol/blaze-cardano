import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
const rl = readline.createInterface({ input: stdin, output: stdout });

import { Address } from "../../packages/blaze-core/dist/index.js";
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

let address = Core.addressFromBech32(
  await rl.question("Please enter your bech32 cardano address: "),
);

const wallet = new ColdWallet(address, 0, provider);
const blaze = new Blaze(provider, wallet);

const tx = await (await blaze.newTransaction())
  .payLovelace(
    Address.fromBech32(
      await rl.question(
        "Please enter the destination bech32 cardano address: ",
      ),
    ),
    5_000_000n,
  )
  .complete();

console.log("Balanced and unwitnessed transaction CBOR:");
console.log(tx.toCbor());
process.exit(0);
