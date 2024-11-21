import type { Provider } from "@blaze-cardano/query";
import { HotSingleWallet } from "../src";
import * as Core from "@blaze-cardano/core";
import { toHex } from "@blaze-cardano/core";

const mockProvider: Provider = jest.fn() as any;

const expectedAddress =
  "addr1q9dkr76agvvj04n740a2zcq9w8rgl8xhhfwm9ds7vzdu7pjmv8a46sceylt8a2l659sq2uwx37wd0wjak2mpucymeurqhgrk09";

describe("HotSingleWallet", () => {
  let wallet: HotSingleWallet;
  beforeAll(() => {
    const privateKey = Core.Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );

    wallet = new HotSingleWallet(
      privateKey,
      Core.NetworkId.Mainnet,
      mockProvider,
      privateKey,
    );
  });
  it("constructs correctly with payment and stake key", () => {
    expect(wallet.address.toBech32().toString()).toBe(expectedAddress);
  });

  it("correctly signs transaction", async () => {
    const text = "Hello, World!";

    const payload = toHex(Buffer.from(text));
    const rewardAddress = Core.Address.fromBech32(
      "stake1u9dkr76agvvj04n740a2zcq9w8rgl8xhhfwm9ds7vzdu7psgp9u9d",
    );
    const address = Core.Address.fromBech32(expectedAddress);

    const signedWithPayment = await wallet.signData(address, payload);
    const signedWithStake = await wallet.signData(rewardAddress, payload);

    expect(signedWithPayment.signature).toEqual(
      "845846a2012767616464726573735839015b61fb5d431927d67eabfaa1600571c68f9cd7ba5db2b61e609bcf065b61fb5d431927d67eabfaa1600571c68f9cd7ba5db2b61e609bcf06a166686173686564f44d48656c6c6f2c20576f726c642158402080becd8d9c6f5b9a5a4d5908a21c028674076fa5b14e2e7a5cc637b10ea33b524ce950f1de3cc4ed57be26c5a13d2e7bbc374ae67bbff53e1149284ed65a05",
    );

    expect(signedWithStake.signature).toEqual(
      "84582aa201276761646472657373581de15b61fb5d431927d67eabfaa1600571c68f9cd7ba5db2b61e609bcf06a166686173686564f44d48656c6c6f2c20576f726c642158407f1f1b93f73951174f8b796f84a84c86c6337cd9fc793ee8708f8d91550c341319cc3f659e6360593c4216b90f1b47813607460fc1d740782119e6747ced5f01",
    );
  });

  it("gets reward address correctly", async () => {
    const privateKey = Core.Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );

    const wallet = new HotSingleWallet(
      privateKey,
      Core.NetworkId.Mainnet,
      mockProvider,
      privateKey,
    );

    const stakeKey = await wallet
      .getRewardAddresses()
      .then((r) => r[0]?.toAddress().toBech32());

    expect(stakeKey).toEqual(
      "stake1u9dkr76agvvj04n740a2zcq9w8rgl8xhhfwm9ds7vzdu7psgp9u9d",
    );
  });
});
