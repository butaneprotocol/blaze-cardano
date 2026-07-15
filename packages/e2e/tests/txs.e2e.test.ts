import { describe, it, expect, beforeAll } from "vitest";
import { Blaze, HotSingleWallet, Blockfrost } from "@blaze-cardano/sdk";
import { Metadatum, Metadata } from "@blaze-cardano/core";
import { Emulator } from "@blaze-cardano/emulator";
import { makeValue } from "@blaze-cardano/tx";
import { walletFromMnemonic } from "./wallet";

const enabled = Boolean(
  process.env["SEED_MNEMONIC"] && process.env["BLOCKFROST_KEY"],
);
const describeIf = enabled ? describe : describe.skip;

describeIf("sequential e2e txs", () => {
  const mnemonic = process.env["SEED_MNEMONIC"] as string;
  let provider: Blockfrost;
  let wallet: Awaited<ReturnType<typeof walletFromMnemonic>>;
  let blaze: Blaze<Blockfrost, HotSingleWallet>;

  beforeAll(async () => {
    if (!mnemonic) throw new Error("SEED_MNEMONIC not set");
    provider = new Blockfrost({
      network: "cardano-preview",
      projectId: process.env["BLOCKFROST_KEY"] as string,
    });
    wallet = await walletFromMnemonic(mnemonic, provider);
    blaze = await Blaze.from(provider, wallet);
    console.log("address: ", wallet.address.toBech32());
    const utxos = await provider.getUnspentOutputs(wallet.address);
    console.log("utxos", utxos);
    if (utxos.length === 0) {
      const addr = wallet.address;
      console.error(`E2E wallet has no funds. Please fund: ${addr.toBech32()}`);
      throw new Error("E2E wallet has no funds");
    }
    console.log("E2E tests beginning with wallet: ", wallet.address.toBech32());
  });

  it("sends minimal lovelace to self", async () => {
    const tx = await blaze
      .newTransaction()
      .payLovelace(wallet.address, 2_000_000n)
      .complete();

    const signed = await blaze.signTransaction(tx);
    console.log("signed tx", signed.toCbor());
    const txId = await blaze.submitTransaction(signed);
    const ok = await provider.awaitTransactionConfirmation(txId, 120000);
    expect(ok).toBe(true);
  }, 150000);

  // it("sends two sequential small self-payments", async () => {
  //   const utxos = await wallet.getUnspentOutputs();
  //   if (utxos.length === 0) {
  //     console.warn("No UTxOs available for sequential test; skipping");
  //     return;
  //   }
  //   const addr = await wallet.getChangeAddress();

  //   // First tx
  //   const txb1 = await blaze
  //     .newTransaction()
  //     .setChangeAddress(wallet.address)
  //     .payLovelace(wallet.address, 20_000_000n)
  //     .complete();
  //   const signed = await blaze.signTransaction(txb1);
  //   const txId1 = await blaze.submitTransaction(signed);
  //   const ok1 = await provider.awaitTransactionConfirmation(txId1, 120000);
  //   expect(ok1).toBe(true);

  //   // Second tx (re-fetch UTxOs)
  //   const txb2 = await blaze
  //     .newTransaction()
  //     .setChangeAddress(wallet.address)
  //     .addUnspentOutputs(utxos)
  //     .payLovelace(addr, 20_000_000n);
  //   const tx2 = await txb2.complete();
  //   const signed2 = await blaze.signTransaction(tx2);
  //   const txId2 = await blaze.submitTransaction(signed2);
  //   const ok2 = await provider.awaitTransactionConfirmation(txId2, 120000);
  //   expect(ok2).toBe(true);
  // });
});

describe("emulator transaction construction e2e", () => {
  it("builds, signs, submits, and confirms a metadata transaction", async () => {
    const emulator = new Emulator([]);
    const sender = await emulator.register("sender", makeValue(100_000_000n));
    const recipient = await emulator.register(
      "recipient",
      makeValue(5_000_000n),
    );
    const metadata = new Map<bigint, Metadatum>();
    metadata.set(674n, Metadatum.newText("blaze-emulator-e2e"));

    await emulator.as("sender", async (blaze) => {
      const tx = await blaze
        .newTransaction()
        .payLovelace(recipient, 2_000_000n)
        .setMetadata(new Metadata(metadata))
        .complete();
      const signed = await blaze.signTransaction(tx);
      const txId = await blaze.submitTransaction(signed, true);
      const submittedMetadata = tx.auxiliaryData()?.metadata()?.metadata();

      await expect(
        blaze.provider.awaitTransactionConfirmation(txId),
      ).resolves.toBe(true);
      expect(sender.toBech32()).toContain("addr_test");
      expect(submittedMetadata?.get(674n)?.asText()).toBe("blaze-emulator-e2e");
    });
  });
});
