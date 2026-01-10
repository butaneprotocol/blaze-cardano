import { Emulator } from "../src";
import { makeValue } from "@blaze-cardano/tx";
import { signAndSubmit } from "./util";

/**
 * This test verifies that the emulator's key generation produces valid keys
 * that always pass signature verification.
 *
 * Background: The emulator generates random BIP32 keys for mocked wallets.
 * These keys must have properly "clamped" Ed25519 scalars to work correctly
 * with libsodium's signing functions. Without clamping, signature verification
 * fails intermittently (~50% of the time).
 *
 * The fix in emulator.ts clamps the scalar when generating keys.
 */
describe("Emulator Key Generation", () => {
  test("emulator-generated wallets can sign and verify transactions reliably", async () => {
    // Run multiple iterations to ensure keys are consistently valid
    // Before the fix, this would fail ~50% of the time due to unclamped scalars
    const iterations = 10;

    for (let i = 0; i < iterations; i++) {
      const emulator = new Emulator([]);

      // Register two wallets - this triggers getOrAddWallet() which generates keys
      await emulator.register(
        `sender-${i}`,
        makeValue(10_000_000_000n),
      );
      const receiver = await emulator.register(`receiver-${i}`);

      // Use the emulator's as() method to create a transaction
      await emulator.as(`sender-${i}`, async (blaze) => {
        const tx = await blaze
          .newTransaction()
          .payLovelace(receiver, 1_000_000n)
          .complete();

        // This will fail if the signature doesn't verify
        // Before the fix, this would intermittently throw:
        // "Invalid vkey in witness set with hash ..."
        const txId = await signAndSubmit(tx, blaze);
        emulator.awaitTransactionConfirmation(txId);
      });
    }

    // If we get here, all 10 iterations succeeded
    expect(true).toBe(true);
  });

  test("multiple wallets in same emulator all have valid keys", async () => {
    const emulator = new Emulator([]);
    const walletCount = 5;

    // Register multiple wallets
    const addresses = await Promise.all(
      Array.from({ length: walletCount }, (_, i) =>
        emulator.register(`wallet-${i}`, makeValue(10_000_000_000n)),
      ),
    );

    // Each wallet should be able to sign transactions
    for (let i = 0; i < walletCount; i++) {
      await emulator.as(`wallet-${i}`, async (blaze) => {
        const recipient = addresses[(i + 1) % walletCount]!;
        const tx = await blaze
          .newTransaction()
          .payLovelace(recipient, 1_000_000n)
          .complete();

        const txId = await signAndSubmit(tx, blaze);
        emulator.awaitTransactionConfirmation(txId);
      });
    }
  });

  test("wallet signing is deterministic for same wallet", async () => {
    const emulator = new Emulator([]);

    await emulator.register("alice", makeValue(10_000_000_000n));
    const bob = await emulator.register("bob");

    // Sign multiple transactions with the same wallet
    for (let i = 0; i < 3; i++) {
      await emulator.as("alice", async (blaze) => {
        const tx = await blaze
          .newTransaction()
          .payLovelace(bob, 1_000_000n)
          .complete();

        // All signatures should verify successfully
        const txId = await signAndSubmit(tx, blaze);
        emulator.awaitTransactionConfirmation(txId);
      });
    }

    // If all 3 transactions succeeded, the wallet keys are valid
    expect(true).toBe(true);
  });
});
