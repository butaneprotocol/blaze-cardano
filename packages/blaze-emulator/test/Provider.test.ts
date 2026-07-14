import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import {
  type Bip32PrivateKeyHex,
  type Address,
  TransactionOutput,
  AssetId,
  TransactionInput,
  TransactionId,
  Datum,
  ChainIds,
  SLOT_CONFIG_NETWORK,
} from "@blaze-cardano/core";
import { HotWallet } from "@blaze-cardano/wallet";
import {
  createEmulatorNetworkConfig,
  Emulator,
  EmulatorProvider,
} from "../src";
import {
  alwaysTrueScript,
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

  test("uses emulator network and timing configuration", () => {
    const configuredEmulator = new Emulator([], {
      chainId: ChainIds.Mainnet,
      slotConfig: {
        zeroTime: 1000,
        zeroSlot: 5,
        slotLength: 2000,
      },
    });
    const configuredProvider = new EmulatorProvider(configuredEmulator);

    expect(configuredProvider.network).toBe(ChainIds.Mainnet.networkId);
    expect(configuredProvider.networkName).toBe("cardano-mainnet");
    expect(configuredProvider.getSlotConfig()).toEqual({
      zeroTime: 1000,
      zeroSlot: 5,
      slotLength: 2000,
    });
  });

  test("uses the configured network for generated addresses", async () => {
    const configuredEmulator = new Emulator([], {
      chainId: ChainIds.Mainnet,
    });
    const address = await configuredEmulator.register("mainnet");
    configuredEmulator.publishScript(alwaysTrueScript);
    const referenceAddress = configuredEmulator
      .lookupScript(alwaysTrueScript)
      .output()
      .address();

    expect(address.getNetworkId()).toBe(ChainIds.Mainnet.networkId);
    expect(referenceAddress.getNetworkId()).toBe(ChainIds.Mainnet.networkId);
  });

  test("creates network presets with partial timing overrides", () => {
    const config = createEmulatorNetworkConfig({
      preset: "preview",
      slotConfig: { slotLength: 2000 },
      slotsPerBlock: 5,
    });

    expect(config.chainId).toEqual(ChainIds.Preview);
    expect(config.slotConfig).toEqual({
      ...SLOT_CONFIG_NETWORK.Preview,
      slotLength: 2000,
    });
    expect(config.slotsPerEpoch).toBe(86400);
    expect(config.slotsPerBlock).toBe(5);
    expect(() => createEmulatorNetworkConfig({ slotsPerEpoch: 0 })).toThrow(
      "slotsPerEpoch must be a positive integer",
    );
    expect(() =>
      createEmulatorNetworkConfig({
        slotConfig: { zeroSlot: -1, slotLength: 1000 },
      }),
    ).toThrow("zeroSlot must be a non-negative integer");
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

    await expect(
      provider.getUnspentOutputByNFT(AssetId("0".repeat(64))),
    ).rejects.toEqual(
      "getUnspentOutputByNFT: emulated ledger had no UTxO with NFT",
    );
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
