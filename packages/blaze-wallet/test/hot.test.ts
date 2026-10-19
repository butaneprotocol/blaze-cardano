import { describe, it, expect, beforeAll } from "vitest";
import type { Provider } from "@blaze-cardano/query";
import { HotWallet } from "../src";
import * as Core from "@blaze-cardano/core";

const mockProvider: Provider = { network: Core.NetworkId.Mainnet } as any;

const expectedAddress =
  "addr1qxttdu6d96klw8xvme7ctwuv0jg7xns0vm35ksv4l722aupyayzk39uascqj78hynwh3ax5w8ch5n9062k0vpnj3dlps3a8a9a";
// stolen from https://github.com/vergl4s/ethereum-mnemonic-utils/blob/fe222052dc800a4e02fd98b48f5e4b106f9733f4/tests.py#L23
const mnemonic =
  "legal winner thank year wave sausage worth useful legal winner thank yellow";
const entropy = Core.mnemonicToEntropy(mnemonic, Core.wordlist);
const privateKey = Core.Bip32PrivateKey.fromBip39Entropy(
  Buffer.from(entropy),
  "",
);

let wallet: HotWallet;
beforeAll(async () => {
  wallet = await HotWallet.fromMasterkey(
    privateKey.hex(),
    mockProvider,
    Core.NetworkId.Mainnet,
  );
});

describe("HotWallet", () => {
  it("constructs correctly with payment and stake key", () => {
    expect(wallet.address.toBech32().toString()).toBe(expectedAddress);
  });

  it("should throw an error when network ids don't match", async () => {
    await expect(
      HotWallet.fromMasterkey(
        privateKey.hex(),
        mockProvider,
        Core.NetworkId.Testnet,
      ),
    ).rejects.toThrow(
      "The networkId does not match the id in the supplied provider. Please ensure the provider is using the same network ID. This will be removed in the future.",
    );
  });

  it("correctly signs transaction", async () => {
    const text = "Hello, World!";

    const payload = Core.toHex(Buffer.from(text));
    const rewardAddress = Core.Address.fromBech32(
      "stake1uyjwjptgj7wcvqf0rmjfhtc7n28rut6fjha9t8kqeegklsc9mz5mt",
    );
    const address = Core.Address.fromBech32(expectedAddress);

    const signedWithPayment = await wallet.signData(address, payload);
    const signedWithStake = await wallet.signData(rewardAddress, payload);

    expect(signedWithPayment.signature).toEqual(
      "845846a20127676164647265737358390196b6f34d2eadf71cccde7d85bb8c7c91e34e0f66e34b4195ff94aef024e90568979d86012f1ee49baf1e9a8e3e2f4995fa559ec0ce516fc3a166686173686564f44d48656c6c6f2c20576f726c6421584040aa61445abdb84a1146f809ada83a86950499d689e677fdf71b984de4bf0e64ffeaebdb641dfecf4f8afbaf375976d4d3bb776694e86f5dcfa44e1982cd510e",
    );

    expect(signedWithStake.signature).toEqual(
      "84582aa201276761646472657373581de124e90568979d86012f1ee49baf1e9a8e3e2f4995fa559ec0ce516fc3a166686173686564f44d48656c6c6f2c20576f726c6421584072766d627c0d3a1ecd4da2cc42b5b6b2cc4c44f97ca7f9f42cb0b5503a80778230594cffd3da6da9932f427768cf8eb8d4a0d8f114947f9634c4ce87f7bbb306",
    );
  });

  describe("signing a sub-transaction", () => {
    const subTransaction = (guards?: Core.Serialization.Guards) => {
      const body = new Core.SubTransactionBody(
        Core.CborSet.fromCore(
          [
            new Core.TransactionInput(
              Core.TransactionId("ab".repeat(32)),
              0n,
            ).toCore(),
          ],
          Core.TransactionInput.fromCore,
        ),
        [
          new Core.TransactionOutput(
            Core.Address.fromBech32(expectedAddress),
            new Core.Value(2_000_000n),
          ),
        ],
      );
      if (guards) body.setGuards(guards);
      return new Core.SubTransaction(body, new Core.TransactionWitnessSet());
    };
    const verifies = (
      [vkey, signature]: [Core.Ed25519PublicKeyHex, Core.Ed25519SignatureHex],
      subTx: Core.SubTransaction,
    ) =>
      Core.Ed25519PublicKey.fromHex(vkey).verify(
        Core.Ed25519Signature.fromHex(signature),
        Core.HexBlob(subTx.getId()),
      );

    it("signs the sub-transaction id with the payment key", async () => {
      const subTx = subTransaction();

      const witnesses = await wallet.signSubTransaction(subTx, true);

      const vkeys = witnesses.vkeys()!.toCore();
      expect(vkeys).toHaveLength(1);
      expect(verifies(vkeys[0]!, subTx)).toBe(true);
    });

    it("adds the stake key when a guard names it as a credential", async () => {
      const stakeKeyHash = Core.Hash28ByteBase16(
        wallet.address.getProps().delegationPart!.hash,
      );
      const subTx = subTransaction(
        Core.Serialization.Guards.fromCredentials([
          { type: Core.CredentialType.KeyHash, hash: stakeKeyHash },
        ]),
      );

      const witnesses = await wallet.signSubTransaction(subTx, true);

      expect(witnesses.vkeys()!.toCore()).toHaveLength(2);
    });

    it("adds the stake key when a key guard names it", async () => {
      const stakeKeyHash = Core.Ed25519KeyHashHex(
        wallet.address.getProps().delegationPart!.hash,
      );
      const subTx = subTransaction(
        Core.Serialization.Guards.fromKeyHashes([stakeKeyHash]),
      );

      const witnesses = await wallet.signSubTransaction(subTx, true);

      const vkeys = witnesses.vkeys()!.toCore();
      expect(vkeys).toHaveLength(2);
      expect(vkeys.every((vkey) => verifies(vkey, subTx))).toBe(true);
    });
  });
});
