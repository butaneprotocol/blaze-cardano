import {
  type Bip32PrivateKeyHex,
  type Address,
  TransactionOutput,
  AssetId,
  TransactionInput,
  TransactionId,
  Datum,
} from "@blaze-cardano/core";
import { HotWallet } from "@blaze-cardano/wallet";
import { Emulator, EmulatorProvider } from "../src";
import {
  generateAccount,
  generateGenesisOutputs,
  signAndSubmit,
  VOID_PLUTUS_DATA,
} from "./util";
import { Blaze, makeValue } from "@blaze-cardano/sdk";

const assetIdFungible = AssetId(
  `${"0".repeat(54)}.${Buffer.from("test").toString("hex")}`,
);
const assetIdNft = AssetId(
  `${"0".repeat(54)}.${Buffer.from("id").toString("hex")}`,
);

describe("Provider", () => {
  let emulator: Emulator;
  let masterkeyHex1: Bip32PrivateKeyHex;
  let address1: Address;
  let wallet1: HotWallet;
  let assetUtxo: TransactionOutput;
  let datumUtxo: TransactionOutput;
  let datumHashUtxo: TransactionOutput;
  let blaze: Blaze<EmulatorProvider, HotWallet>;
  let provider: EmulatorProvider;

  beforeAll(async () => {
    ({ address: address1, masterkeyHex: masterkeyHex1 } =
      await generateAccount());
  });

  beforeEach(async () => {
    assetUtxo = new TransactionOutput(
      address1,
      makeValue(
        1_000_000_000n,
        [assetIdFungible, 100_000_000n],
        [assetIdNft, 1n],
      ),
    );

    datumUtxo = new TransactionOutput(address1, makeValue(5_000_000n));
    datumUtxo.setDatum(Datum.newInlineData(VOID_PLUTUS_DATA));

    datumHashUtxo = new TransactionOutput(address1, makeValue(5_000_000n));
    datumHashUtxo.setDatum(Datum.newDataHash(VOID_PLUTUS_DATA.hash()));

    emulator = new Emulator([
      ...generateGenesisOutputs(address1),
      assetUtxo,
      datumUtxo,
      datumHashUtxo,
    ]);

    // TODO: not sure if this is the best way to register datums, consider adding a helper method.
    emulator.datumHashes[VOID_PLUTUS_DATA.hash()] = VOID_PLUTUS_DATA;

    provider = new EmulatorProvider(emulator);
    wallet1 = await HotWallet.fromMasterkey(masterkeyHex1, provider);
    blaze = await Blaze.from(provider, wallet1);
  });

  test("getSlotConfig", () => {
    const result = provider.getSlotConfig();
    expect(result).not.toBeUndefined();
  });

  test("getUnspentOutputs", async () => {
    const providerUtxos = await provider.getUnspentOutputs(wallet1.address);
    for (const providerUtxo of providerUtxos) {
      const emulatorOutput = emulator.getOutput(providerUtxo.input());
      expect(emulatorOutput).toBeDefined();
      expect(emulatorOutput?.toCbor()).toEqual(providerUtxo.output().toCbor());
    }
  });

  test("getUnspentOutputsWithAsset", async () => {
    const [providerUtxo] = await provider
      .getUnspentOutputsWithAsset(wallet1.address, assetIdFungible)
      .then((r) => r.map((utxo) => utxo.output().toCbor()));
    expect(providerUtxo).toEqual(assetUtxo.toCbor());
  });

  test("getUnspentOutputByNFT", async () => {
    const providerUtxo = await provider
      .getUnspentOutputByNFT(assetIdNft)
      .then((r) => r.output().toCbor());
    expect(providerUtxo).toEqual(assetUtxo.toCbor());

    try {
      await provider.getUnspentOutputByNFT(AssetId("0".repeat(64)));
      fail("Expected error to be thrown, but code executed successfully");
    } catch (e) {
      expect(e).toEqual(
        "getUnspentOutputByNFT: emulated ledger had no UTxO with NFT",
      );
    }
  });

  test("resolveUnspentOutputs", async () => {
    const [providerUtxo] = await provider.resolveUnspentOutputs([
      TransactionInput.fromCore({
        index: 10,
        txId: TransactionId("0".repeat(64)),
      }),
    ]);
    expect(providerUtxo).toBeDefined();
    expect(providerUtxo!.output().toCbor()).toEqual(assetUtxo.toCbor());
  });

  test("resolveDatum", async () => {
    const providerDatumResult = await provider.resolveDatum(
      VOID_PLUTUS_DATA.hash(),
    );
    expect(providerDatumResult).toBeDefined();
    expect(providerDatumResult!.toCbor()).toEqual(VOID_PLUTUS_DATA.toCbor());
  });

  test("evaluateTransaction", async () => {
    const [utxo] = await provider.resolveUnspentOutputs([
      TransactionInput.fromCore({
        index: 11,
        txId: TransactionId("0".repeat(64)),
      }),
    ]);

    const tx = await blaze.newTransaction().addInput(utxo!).complete();
    const result = await provider.evaluateTransaction(tx, []);
    expect(result).toBeDefined();
  });

  test("awaitTransactionConfirmation", async () => {
    const [utxo] = await provider.resolveUnspentOutputs([
      TransactionInput.fromCore({
        index: 11,
        txId: TransactionId("0".repeat(64)),
      }),
    ]);

    const tx = await blaze.newTransaction().addInput(utxo!).complete();
    const hash = await signAndSubmit(tx, blaze);

    const result = await provider.awaitTransactionConfirmation(hash);
    expect(result).toBe(true);
  });
});
