import { describe, it, expect } from "vitest";
import { Void } from "@blaze-cardano/data";
import { makeUplcEvaluator } from "@blaze-cardano/vm";
import {
  Address,
  addressFromCredential,
  AssetId,
  AssetName,
  PolicyId,
  RewardAccount,
  blake2b_256,
  Credential,
  CredentialType,
  Datum,
  Ed25519KeyHashHex,
  Hash28ByteBase16,
  hardCodedProtocolParams,
  HexBlob,
  Metadata,
  Metadatum,
  NativeScripts,
  NetworkId,
  PlutusV2Script,
  Script,
  Serialization,
  Slot,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  type Value,
} from "@blaze-cardano/core";
import * as value from "../../src/value";
import { TxBuilder, TxBuilderReuseError } from "../../src/TxBuilder";

const walletAddress = Address.fromBech32(
  "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
);
const recipientAddress = Address.fromBech32(
  "addr_test1qq82re4ttqrnpnuyqp03fazf8psgckvwlj6482g8pcaeqgr5rr4au7zr2g79y6ggwm7l4hv6jqtzcy758gpu8ez69kwsc40mlq",
);
const TOKEN = "ff".repeat(28) + "746f6b656e";

function utxo(index: number, amount: Value): TransactionUnspentOutput {
  return new TransactionUnspentOutput(
    new TransactionInput(
      TransactionId(index.toString(16).padStart(64, "0")),
      0n,
    ),
    new TransactionOutput(walletAddress, amount),
  );
}

function builder(utxos: TransactionUnspentOutput[]): TxBuilder {
  return new TxBuilder(hardCodedProtocolParams)
    .addUnspentOutputs(utxos)
    .setNetworkId(NetworkId.Testnet)
    .setChangeAddress(walletAddress);
}

function inputValue(
  subTx: Serialization.SubTransaction,
  utxos: TransactionUnspentOutput[],
): Value {
  return subTx
    .body()
    .inputs()
    .values()
    .map((input) =>
      utxos
        .find((u) => u.input().toCbor() === input.toCbor())!
        .output()
        .amount(),
    )
    .reduce(value.merge, value.zero());
}

function outputValue(subTx: Serialization.SubTransaction): Value {
  return subTx
    .body()
    .outputs()
    .map((output) => output.amount())
    .reduce(value.merge, value.zero());
}

describe("Sub-transaction building", () => {
  it("balances a sub-transaction the wallet can fully cover, paying no fee", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];

    const subTx = await builder(utxos)
      .payLovelace(recipientAddress, 5_000_000n)
      .completeSubTransaction();

    expect(
      value.sub(inputValue(subTx, utxos), outputValue(subTx)).toCore(),
    ).toEqual(value.zero().toCore());
  });

  it("reports the lovelace a token-rich wallet lacks, and completes with exactly that deficit", async () => {
    const utxos = [utxo(1, value.makeValue(1_500_000n, [TOKEN, 100n]))];
    const order = () =>
      builder(utxos).payAssets(
        recipientAddress,
        value.makeValue(8_000_000n, [TOKEN, 10n]),
      );

    const { deficit } = await order().estimateSubTransaction();
    expect(deficit.coin()).toBeLessThan(-6_500_000n);
    expect(value.assets(deficit)).toEqual(["lovelace"]);

    const subTx = await order().completeSubTransaction(deficit);
    expect(
      value.sub(inputValue(subTx, utxos), outputValue(subTx)).toCore(),
    ).toEqual(deficit.toCore());
  });

  it("leaves a token surplus for the batch next to a lovelace deficit, with the rest as change", async () => {
    const utxos = [utxo(1, value.makeValue(1_500_000n, [TOKEN, 100n]))];
    const order = () =>
      builder(utxos).payAssets(
        recipientAddress,
        value.makeValue(8_000_000n, [TOKEN, 10n]),
      );
    const { deficit } = await order().estimateSubTransaction();
    const imbalance = value.merge(deficit, value.makeValue(0n, [TOKEN, 25n]));

    const subTx = await order().completeSubTransaction(imbalance);

    expect(
      value.sub(inputValue(subTx, utxos), outputValue(subTx)).toCore(),
    ).toEqual(imbalance.toCore());
    const change = subTx
      .body()
      .outputs()
      .find(
        (output) => output.address().toBech32() === walletAddress.toBech32(),
      )!;
    expect(
      change
        .amount()
        .multiasset()
        ?.get(TOKEN as never),
    ).toBe(65n);
  });

  it("estimates without changing the builder", async () => {
    const utxos = [utxo(1, value.makeValue(1_500_000n, [TOKEN, 100n]))];
    const tx = builder(utxos).payAssets(
      recipientAddress,
      value.makeValue(8_000_000n, [TOKEN, 10n]),
    );

    const { deficit: first } = await tx.estimateSubTransaction();
    const { deficit: second } = await tx.estimateSubTransaction();
    const subTx = await tx.completeSubTransaction(first);

    expect(second.toCore()).toEqual(first.toCore());
    expect(subTx.body().outputs()).toHaveLength(2);
    expect(
      value.sub(inputValue(subTx, utxos), outputValue(subTx)).toCore(),
    ).toEqual(first.toCore());
  });

  it("carries the validity interval, reference inputs and metadata into the sub-transaction", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];
    const reference = utxo(2, value.makeValue(2_000_000n));
    const metadata = new Metadata(
      new Map([[674n, Metadatum.newText("babel")]]),
    );

    const subTx = await builder(utxos)
      .payLovelace(recipientAddress, 5_000_000n)
      .setValidFrom(Slot(100))
      .setValidUntil(Slot(200))
      .addReferenceInput(reference)
      .setMetadata(metadata)
      .completeSubTransaction();

    const body = subTx.body();
    expect(body.validityStartInterval()).toBe(100);
    expect(body.ttl()).toBe(200);
    expect(body.referenceInputs()?.toCore()).toEqual([
      reference.input().toCore(),
    ]);
    expect(body.auxiliaryDataHash()).toBeDefined();
    expect(subTx.auxiliaryData()?.metadata()?.toCore()).toEqual(
      metadata.toCore(),
    );
  });

  it("turns required signers into key guards", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];
    const signer = Ed25519KeyHashHex("ab".repeat(28));

    const subTx = await builder(utxos)
      .payLovelace(recipientAddress, 5_000_000n)
      .addRequiredSigner(signer)
      .completeSubTransaction();

    expect(subTx.body().guards()?.keyHashes()).toEqual([signer]);
  });

  it("refuses Plutus scripts, which a sub-transaction can't run before PlutusV4", async () => {
    const script = Script.newPlutusV2Script(
      new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const locked = new TransactionUnspentOutput(
      new TransactionInput(TransactionId("ee".repeat(32)), 0n),
      new TransactionOutput(
        addressFromCredential(
          NetworkId.Testnet,
          Credential.fromCore({
            hash: script.hash(),
            type: CredentialType.ScriptHash,
          }),
        ),
        value.makeValue(5_000_000n),
      ),
    );
    locked.output().setDatum(Datum.newInlineData(Void()));

    const pending = builder([utxo(1, value.makeValue(20_000_000n))])
      .provideScript(script)
      .addInput(locked, Void())
      .completeSubTransaction();

    await expect(pending).rejects.toThrow(/Plutus/);
  });

  it("spends from a native script and carries the script in its witness set", async () => {
    const timelock = NativeScripts.after(Slot(10));
    const locked = new TransactionUnspentOutput(
      new TransactionInput(TransactionId("dd".repeat(32)), 0n),
      new TransactionOutput(
        NativeScripts.address(timelock, NetworkId.Testnet),
        value.makeValue(10_000_000n),
      ),
    );

    const subTx = await builder([utxo(1, value.makeValue(20_000_000n))])
      .provideScript(Script.newNativeScript(timelock))
      .addInput(locked)
      .setValidFrom(Slot(10))
      .payLovelace(recipientAddress, 5_000_000n)
      .completeSubTransaction();

    expect(subTx.witnessSet().nativeScripts()?.toCore()).toEqual([
      timelock.toCore(),
    ]);
    expect(subTx.witnessSet().vkeys()).toBeUndefined();
  });

  it("refuses fee and collateral settings, which belong to the top-level transaction", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];
    const pay = () => builder(utxos).payLovelace(recipientAddress, 5_000_000n);

    await expect(
      pay().setFeePadding(1000n).completeSubTransaction(),
    ).rejects.toThrow(/fee/);
    await expect(
      pay().setMinimumFee(1000n).completeSubTransaction(),
    ).rejects.toThrow(/fee/);
    await expect(
      pay()
        .provideCollateral([utxo(2, value.makeValue(5_000_000n))])
        .completeSubTransaction(),
    ).rejects.toThrow(/collateral/);
  });

  it("refuses to complete the same builder twice", async () => {
    const tx = builder([utxo(1, value.makeValue(20_000_000n))]).payLovelace(
      recipientAddress,
      5_000_000n,
    );
    await tx.completeSubTransaction();

    await expect(tx.completeSubTransaction()).rejects.toThrow(
      TxBuilderReuseError,
    );
    await expect(tx.complete()).rejects.toThrow(TxBuilderReuseError);
  });

  it("refuses a sub-transaction larger than the maximum transaction size", async () => {
    const utxos = [utxo(1, value.makeValue(100_000_000_000n))];
    let tx = builder(utxos);
    for (let i = 0; i < 400; i++) {
      tx = tx.payLovelace(recipientAddress, 2_000_000n);
    }

    await expect(tx.completeSubTransaction()).rejects.toThrow(/maxTxSize|size/);
  });

  it("identifies the sub-transaction by the hash of its body bytes as emitted", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];

    const subTx = await builder(utxos)
      .payLovelace(recipientAddress, 5_000_000n)
      .completeSubTransaction();

    expect(subTx.getId()).toBe(blake2b_256(subTx.body().toCbor()));
    expect(Serialization.SubTransaction.fromCbor(subTx.toCbor()).getId()).toBe(
      subTx.getId(),
    );
  });
});

describe("Sub-transaction building from the SDK's side", () => {
  const order = value.makeValue(8_000_000n, [TOKEN, 10n]);
  const tokenWallet = () => [
    utxo(1, value.makeValue(1_500_000n, [TOKEN, 100n])),
  ];
  const imbalanceOf = (
    subTx: Serialization.SubTransaction,
    utxos: TransactionUnspentOutput[],
  ) => value.sub(inputValue(subTx, utxos), outputValue(subTx));

  it("estimates and completes a builder whose wallet arrives through a pre-complete hook", async () => {
    // Blaze.newTransaction() loads the wallet in a hook that returns fresh UTxO objects each call.
    const utxos = tokenWallet();
    const tx = new TxBuilder(hardCodedProtocolParams)
      .setNetworkId(NetworkId.Testnet)
      .addPreCompleteHook(async (b) => {
        b.addUnspentOutputs(
          utxos.map((u) => TransactionUnspentOutput.fromCbor(u.toCbor())),
        ).setChangeAddress(walletAddress, false);
      })
      .payAssets(recipientAddress, order);

    const { deficit } = await tx.estimateSubTransaction();
    const subTx = await tx.completeSubTransaction(deficit);

    expect(imbalanceOf(subTx, utxos).toCore()).toEqual(deficit.toCore());
  });

  it("commits to the datums it carries with a script data hash", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];
    const datum = Void();
    const orderScript = NativeScripts.after(Slot(1));
    const orderAt = () =>
      builder(utxos)
        .provideDatum(datum)
        .lockAssets(
          NativeScripts.address(orderScript, NetworkId.Testnet),
          value.makeValue(5_000_000n),
          Datum.newDataHash(datum.hash()),
        );

    const subTx = await orderAt().completeSubTransaction();
    const tx = await orderAt().complete();

    expect(subTx.witnessSet().plutusData()?.size()).toBe(1);
    expect(subTx.body().scriptDataHash()).toBe(tx.body().scriptDataHash());
  });

  it.each([1, 29, 35, 60])(
    "completes with whatever deficit it estimated, for a wallet of %i small UTxOs",
    async (count) => {
      const utxos = Array.from({ length: count }, (_, i) =>
        utxo(i + 1, value.makeValue(1_200_000n)),
      );
      const tx = builder(utxos).payLovelace(recipientAddress, 40_000_000n);

      const { deficit } = await tx.estimateSubTransaction();
      const subTx = await tx.completeSubTransaction(deficit);

      expect(imbalanceOf(subTx, utxos).toCore()).toEqual(deficit.toCore());
    },
  );

  it("falls back to a sub-transaction after a normal completion failed on the same builder", async () => {
    const utxos = tokenWallet();
    const tx = builder(utxos).payAssets(recipientAddress, order);
    await expect(tx.complete()).rejects.toThrow();

    const { deficit } = await tx.estimateSubTransaction();
    const subTx = await tx.completeSubTransaction(deficit);

    expect(imbalanceOf(subTx, utxos).toCore()).toEqual(deficit.toCore());
  });

  it("estimating leaves the builder as it was, even with reference scripts and later script inputs", async () => {
    const script = Script.newPlutusV2Script(
      new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const scriptAddress = addressFromCredential(
      NetworkId.Testnet,
      Credential.fromCore({
        hash: script.hash(),
        type: CredentialType.ScriptHash,
      }),
    );
    const withRefScript = utxo(1, value.makeValue(30_000_000n));
    withRefScript.output().setScriptRef(script);
    const utxos = [withRefScript, utxo(2, value.makeValue(30_000_000n))];
    const locked = new TransactionUnspentOutput(
      new TransactionInput(TransactionId("ee".repeat(32)), 0n),
      new TransactionOutput(scriptAddress, value.makeValue(5_000_000n)),
    );
    locked.output().setDatum(Datum.newInlineData(Void()));
    const start = () =>
      builder(utxos)
        .useEvaluator(makeUplcEvaluator(hardCodedProtocolParams, 1, 1))
        .provideScript(script)
        .payLovelace(recipientAddress, 45_000_000n);

    const estimated = start();
    await estimated.estimateSubTransaction();
    const afterEstimate = await estimated.addInput(locked, Void()).complete();
    const fresh = await start().addInput(locked, Void()).complete();

    expect(afterEstimate.toCbor()).toBe(fresh.toCbor());
  });

  it("is funded by a native-script wallet", async () => {
    const multisig = NativeScripts.after(Slot(1));
    const scriptWallet = NativeScripts.address(multisig, NetworkId.Testnet);
    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("cc".repeat(32)), 0n),
        new TransactionOutput(scriptWallet, value.makeValue(20_000_000n)),
      ),
    ];

    const subTx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(scriptWallet)
      .provideScript(Script.newNativeScript(multisig))
      .setValidFrom(Slot(1))
      .payLovelace(recipientAddress, 5_000_000n)
      .completeSubTransaction();

    expect(imbalanceOf(subTx, utxos).toCore()).toEqual(value.zero().toCore());
  });

  it("spends at least one input, so its id can't repeat", async () => {
    const subTx = await builder([utxo(1, value.makeValue(20_000_000n))])
      .setMetadata(new Metadata(new Map([[674n, Metadatum.newText("hi")]])))
      .completeSubTransaction();

    expect(subTx.body().inputs().size()).toBeGreaterThan(0);
  });
  it("prices its own footprint: the fee it adds to the top-level transaction and its signed size", async () => {
    const utxos = tokenWallet();
    const tx = builder(utxos).payAssets(recipientAddress, order);

    const { deficit, fee, signedSize } = await tx.estimateSubTransaction();
    const subTx = await tx.completeSubTransaction(deficit);

    expect(fee).toBe(
      BigInt(Math.ceil(signedSize * hardCodedProtocolParams.minFeeCoefficient)),
    );
    // Unsigned, plus one vkey witness for the wallet's input.
    expect(signedSize).toBeGreaterThan(subTx.toCbor().length / 2 + 90);
    expect(signedSize).toBeLessThan(subTx.toCbor().length / 2 + 110);
  });

  it("estimates with a surplus kept back, spending what the surplus needs", async () => {
    const OTHER = "ee".repeat(28) + "6f74686572";
    const utxos = [
      utxo(1, value.makeValue(20_000_000n)),
      utxo(2, value.makeValue(1_500_000n, [OTHER, 50n])),
    ];
    const price = value.makeValue(0n, [OTHER, 50n]);
    const tx = builder(utxos).payLovelace(recipientAddress, 5_000_000n);

    const withoutPrice = await tx.estimateSubTransaction();
    const withPrice = await tx.estimateSubTransaction(price);
    const subTx = await tx.completeSubTransaction(
      value.merge(withPrice.deficit, price),
    );

    expect(withPrice.signedSize).toBeGreaterThan(withoutPrice.signedSize);
    expect(subTx.body().inputs().size()).toBe(2);
    expect(imbalanceOf(subTx, utxos).toCore()).toEqual(
      value.merge(withPrice.deficit, price).toCore(),
    );
  });

  it("requires guards of the top-level transaction, which a top-level transaction can't itself require", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];
    const service = Credential.fromCore({
      type: CredentialType.KeyHash,
      hash: Hash28ByteBase16("cd".repeat(28)),
    });
    const pay = () =>
      builder(utxos)
        .payLovelace(recipientAddress, 5_000_000n)
        .addRequiredTopLevelGuard(service);

    const subTx = await pay().completeSubTransaction();

    expect(
      [...(subTx.body().requiredTopLevelGuards()?.keys() ?? [])].map((c) =>
        c.toCore(),
      ),
    ).toEqual([service.toCore()]);
    await expect(pay().complete()).rejects.toThrow(/top-level guards/);
  });
});

describe("Sub-transaction building, second review", () => {
  const fresh = (utxos: TransactionUnspentOutput[]) =>
    utxos.map((u) => TransactionUnspentOutput.fromCbor(u.toCbor()));

  it("retries a pre-complete hook that failed", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];
    let calls = 0;
    const tx = new TxBuilder(hardCodedProtocolParams)
      .setNetworkId(NetworkId.Testnet)
      .addPreCompleteHook(async (b) => {
        calls++;
        if (calls === 1) throw new Error("provider unavailable");
        b.addUnspentOutputs(fresh(utxos)).setChangeAddress(
          walletAddress,
          false,
        );
      })
      .payLovelace(recipientAddress, 5_000_000n);

    await expect(tx.completeSubTransaction()).rejects.toThrow(
      "provider unavailable",
    );
    const subTx = await tx.completeSubTransaction();

    expect(calls).toBe(2);
    expect(subTx.body().inputs().size()).toBe(1);
  });

  it("runs each pre-complete hook once, including one added after an estimate", async () => {
    const utxos = [utxo(1, value.makeValue(20_000_000n))];
    let walletHook = 0;
    let lateHook = 0;
    const tx = new TxBuilder(hardCodedProtocolParams)
      .setNetworkId(NetworkId.Testnet)
      .addPreCompleteHook(async (b) => {
        walletHook++;
        b.addUnspentOutputs(fresh(utxos)).setChangeAddress(
          walletAddress,
          false,
        );
      })
      .payLovelace(recipientAddress, 5_000_000n);

    await tx.estimateSubTransaction();
    tx.addPreCompleteHook(async () => {
      lateHook++;
    });
    await tx.completeSubTransaction();

    expect(walletHook).toBe(1);
    expect(lateHook).toBe(1);
  });

  it("refuses a sub-transaction with no input to spend", async () => {
    const pay = () => builder([]).payLovelace(recipientAddress, 5_000_000n);

    await expect(
      pay().completeSubTransaction(value.makeValue(-6_000_000n)),
    ).rejects.toThrow(/input/);
    await expect(pay().estimateSubTransaction()).rejects.toThrow(/input/);
  });

  it("carries mint, withdrawals, certificates and donation into the sub-transaction", async () => {
    const policyScript = NativeScripts.after(Slot(1));
    const policy = PolicyId(policyScript.hash());
    const stake = Credential.fromCore({
      type: CredentialType.KeyHash,
      hash: Hash28ByteBase16(walletAddress.getProps().delegationPart!.hash),
    });
    const rewardAccount = RewardAccount.fromCredential(
      stake.toCore(),
      NetworkId.Testnet,
    );

    const subTx = await builder([utxo(1, value.makeValue(20_000_000n))])
      .provideScript(Script.newNativeScript(policyScript))
      .addMint(policy, new Map([[AssetName("01"), 5n]]))
      .addWithdrawal(rewardAccount, 1_000_000n)
      .addRegisterStake(stake)
      .setDonation(1_000n)
      .setValidFrom(Slot(1))
      .payLovelace(recipientAddress, 5_000_000n)
      .completeSubTransaction();

    const body = subTx.body();
    expect(body.mint()?.get(AssetId.fromParts(policy, AssetName("01")))).toBe(
      5n,
    );
    expect(body.withdrawals()?.get(rewardAccount)).toBe(1_000_000n);
    expect(body.certs()?.size()).toBe(1);
    expect(body.donation()).toBe(1_000n);
  });

  it("counts the reference scripts it spends in the fee it adds", async () => {
    const withScript = utxo(1, value.makeValue(20_000_000n));
    withScript
      .output()
      .setScriptRef(
        Script.newPlutusV2Script(
          new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
        ),
      );

    const { fee, signedSize } = await builder([withScript])
      .payLovelace(recipientAddress, 5_000_000n)
      .estimateSubTransaction();

    expect(fee).toBeGreaterThan(
      BigInt(Math.ceil(signedSize * hardCodedProtocolParams.minFeeCoefficient)),
    );
  });

  it("estimating leaves the builder as it was across wallets with several keys", async () => {
    const utxos = [
      utxo(1, value.makeValue(10_000_000n)),
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("cd".repeat(32)), 0n),
        new TransactionOutput(recipientAddress, value.makeValue(10_000_000n)),
      ),
    ];
    const start = () =>
      builder(utxos).payLovelace(recipientAddress, 2_000_000n);

    const estimated = start();
    await estimated.estimateSubTransaction(value.makeValue(15_000_000n));
    const afterEstimate = await estimated.complete();
    const freshTx = await start().complete();

    expect(afterEstimate.toCbor()).toBe(freshTx.toCbor());
  });

  it("estimating leaves the builder as it was for a wallet spread over native scripts", async () => {
    const first = NativeScripts.after(Slot(1));
    const second = NativeScripts.after(Slot(2));
    const at = (script: typeof first, id: string) =>
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId(id.repeat(32)), 0n),
        new TransactionOutput(
          NativeScripts.address(script, NetworkId.Testnet),
          value.makeValue(10_000_000n),
        ),
      );
    const utxos = [at(first, "a1"), at(second, "a2")];
    const start = () =>
      new TxBuilder(hardCodedProtocolParams)
        .addUnspentOutputs(utxos)
        .setNetworkId(NetworkId.Testnet)
        .setChangeAddress(NativeScripts.address(first, NetworkId.Testnet))
        .provideScript(Script.newNativeScript(first))
        .provideScript(Script.newNativeScript(second))
        .setValidFrom(Slot(2))
        .payLovelace(recipientAddress, 2_000_000n);

    const estimated = start();
    await estimated.estimateSubTransaction(value.makeValue(15_000_000n));
    const afterEstimate = await estimated.complete();
    const freshTx = await start().complete();

    expect(afterEstimate.toCbor()).toBe(freshTx.toCbor());
  });

  it("refuses to estimate a sub-transaction over the maximum transaction size", async () => {
    const tx = new TxBuilder({ ...hardCodedProtocolParams, maxTxSize: 250 })
      .addUnspentOutputs([utxo(1, value.makeValue(20_000_000n))])
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(walletAddress)
      .payLovelace(recipientAddress, 5_000_000n);

    await expect(tx.estimateSubTransaction()).rejects.toThrow(/maxTxSize/);
  });
});
