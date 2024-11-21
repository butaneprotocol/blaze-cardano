import type { Provider } from "@blaze-cardano/query";
import { HotWallet } from "../src";
import * as Core from "@blaze-cardano/core";

const mockProvider: Provider = jest.fn() as any;

const expectedAddress =
  "addr1qxttdu6d96klw8xvme7ctwuv0jg7xns0vm35ksv4l722aupyayzk39uascqj78hynwh3ax5w8ch5n9062k0vpnj3dlps3a8a9a";

describe("HotWallet", () => {
  let wallet: HotWallet;
  beforeAll(async () => {
    // stolen from https://github.com/vergl4s/ethereum-mnemonic-utils/blob/fe222052dc800a4e02fd98b48f5e4b106f9733f4/tests.py#L23
    const mnemonic =
      "legal winner thank year wave sausage worth useful legal winner thank yellow";
    const entropy = Core.mnemonicToEntropy(mnemonic, Core.wordlist);
    const privateKey = Core.Bip32PrivateKey.fromBip39Entropy(
      Buffer.from(entropy),
      "",
    );
    wallet = await HotWallet.fromMasterkey(
      privateKey.hex(),
      mockProvider,
      Core.NetworkId.Mainnet,
    );
  });
  it("constructs correctly with payment and stake key", () => {
    expect(wallet.address.toBech32().toString()).toBe(expectedAddress);
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
});
