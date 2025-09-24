---
title: Testing a Transaction
---

# Testing a Transaction
Let's start by setting up a simple environment with two different wallets. We are going to assume a Bun environment here, but this will work with most testing environments of your choice.

## Setup the Emulator
First we need to set up our emulator. For the purposes of this guide, we won't build our transaction outputs, but this is the beginning state of the ledger. It is not necessary to add outputs for a wallet to work, but this is a useful place to add reference inputs, scripts, etc.

```ts
import { Emulator } from "@blaze-cardano/emulator"

const emulator = new Emulator(
    [], // a List of outputs for the ledger.
);

```

## Register Wallets
Next, let's register the wallets we'll use in our test. We will use the `makeValue` method exported from `@blaze-cardano/sdk` for simplicity and ease-of-use, but you could build it manually as well.

```ts
import { describe, beforeAll, it, expect } from "bun:test"
import { Emulator } from "@blaze-cardano/emulator"
import { makeValue } from "@blaze-cardano/sdk"

const emulator = new Emulator(
    [], // a List of outputs for the ledger.
)

describe("my Emulator test", () => {
    beforeAll(() => {
        // We will just give each wallet the same assets.
        const walletAssets = makeValue(
            10_000_000n, // Lovelace amount
            ["policyId.assetName", 5n] // Native token amount
        );

        emulator.register("WalletOne", walletAssets);
        emulator.register("WalletTwo", walletAssets);
    });
});
```

## Write the Test
Next, we'll use the `Emulator.as` method to write an asyncronous test using our wallet, including transaction submission and validation.

```ts
it("will succeed in sending ada from wallet to another", async () => {
    // Store the WalletTwo address for later use.
    const walletTwoAddress = await emulator.addressOf("WalletTwo");

    // Build our transaction using WalletOne as the source.
    await emulator.as("WalletOne", async (blaze, address) => {
        
        // Send 2 ADA to WalletTwo
        const tx = await blaze
            .newTransaction()
            .payLovelace(2_000_000n, walletTwoAddress)
            .complete();

        // Emulate a signature using our wallet.
        const witness = await blaze.wallet.signTransaction(tx);

        // Keep it clean and just get the signature.
        const ws = tx.witnessSet();
        ws.setVkeys(witness.vkeys()!);

        // Apply the witness to our transaction.
        tx.setWitnessSet(ws);

        // Validate and post the transaction to the Emulator ledger.
        const hash = await blaze.provider.postTransactionToChain(tx);
        expect(hash).toBeDefined();
    });

    // Get each wallet's balance.
    const walletOneBalance = await emulator.mockWallets.get("WalletOne")?.getBalance();
    const walletTwoBalance = await emulator.mockWallets.get("WalletTwo")?.getBalance();

    // Expect their balance to be updated based on the submitted transactinon.
    expect(walletOneBalance.coin()).toEqual(8_000_000n); // True! (ignoring fee for example purposes)
    expect(walletTwoBalance.coin()).toEqual(12_000_000n); // True!
});
```