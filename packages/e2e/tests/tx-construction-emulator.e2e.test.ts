import { describe, expect, it } from "vitest";
import { Metadatum, Metadata } from "@blaze-cardano/core";
import { Emulator } from "@blaze-cardano/emulator";
import { makeValue } from "@blaze-cardano/tx";

describe("transaction construction emulator e2e", () => {
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
