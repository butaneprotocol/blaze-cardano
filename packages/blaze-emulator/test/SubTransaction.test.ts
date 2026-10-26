import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import type { Address, Bip32PrivateKeyHex } from "@blaze-cardano/core";
import {
  Ed25519PublicKey,
  Ed25519Signature,
  HexBlob,
} from "@blaze-cardano/core";
import { ColdWallet, HotWallet } from "@blaze-cardano/wallet";
import { Blaze, makeValue } from "@blaze-cardano/sdk";
import { Emulator, EmulatorProvider } from "../src";
import { generateAccount, generateGenesisOutputs } from "./util";

describe("Sub-transactions through Blaze", () => {
  let address: Address;
  let masterkeyHex: Bip32PrivateKeyHex;
  let recipient: Address;
  let provider: EmulatorProvider;
  let blaze: Blaze<EmulatorProvider, HotWallet>;

  beforeAll(async () => {
    ({ address, masterkeyHex } = await generateAccount());
    ({ address: recipient } = await generateAccount());
  });

  beforeEach(async () => {
    provider = new EmulatorProvider(
      new Emulator(generateGenesisOutputs(address)),
    );
    blaze = await Blaze.from(
      provider,
      await HotWallet.fromMasterkey(masterkeyHex, provider),
    );
  });

  test("signs a sub-transaction built from the wallet with the wallet's key", async () => {
    const tx = blaze
      .newTransaction()
      .payAssets(recipient, makeValue(5_000_000n));
    const { deficit } = await tx.estimateSubTransaction();
    const subTx = await tx.completeSubTransaction(deficit);

    const signed = await blaze.signSubTransaction(subTx);

    const vkeys = signed.witnessSet().vkeys()?.toCore() ?? [];
    expect(vkeys).toHaveLength(1);
    const [vkey, signature] = vkeys[0]!;
    expect(
      Ed25519PublicKey.fromHex(vkey).verify(
        Ed25519Signature.fromHex(signature),
        HexBlob(signed.getId()),
      ),
    ).toBe(true);
    expect(signed.getId()).toBe(subTx.getId());
  });

  test("refuses a wallet that can't sign sub-transactions", async () => {
    const cold = await Blaze.from(
      provider,
      new ColdWallet(address, 0, provider),
    );
    const subTx = await blaze
      .newTransaction()
      .payAssets(recipient, makeValue(5_000_000n))
      .completeSubTransaction();

    await expect(cold.signSubTransaction(subTx)).rejects.toThrow(
      /sub-transaction/,
    );
  });
});
