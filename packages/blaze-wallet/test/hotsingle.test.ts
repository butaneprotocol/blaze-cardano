import type { Provider } from "@blaze-cardano/query";
import { HotSingleWallet } from "../src";
import * as Core from "@blaze-cardano/core";

const mockProvider: Provider = jest.fn() as any;

describe("HotSingleWallet", () => {
  it("constructs correctly with payment and stake key", () => {
    const privateKey = Core.Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e"
    );

    const wallet = new HotSingleWallet(
      privateKey,
      Core.NetworkId.Mainnet,
      mockProvider,
      privateKey
    );

    expect(wallet.address.toBech32().toString()).toBe(
      "addr1q9dkr76agvvj04n740a2zcq9w8rgl8xhhfwm9ds7vzdu7pjmv8a46sceylt8a2l659sq2uwx37wd0wjak2mpucymeurqhgrk09"
    );
  });
});
