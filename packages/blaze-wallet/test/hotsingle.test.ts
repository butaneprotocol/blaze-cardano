import type { Provider } from "@blaze-cardano/query";
import { HotSingleWallet } from "../src";
import * as Core from "@blaze-cardano/core";

const mockProvider: Provider = jest.fn() as any;

describe("HotSingleWallet", () => {
  it("constructs correctly with payment and stake key", () => {
    const privateKey = Core.Ed25519PrivateNormalKeyHex(
      "02f984433fca5ccad486622ebdc5a43c2248fc6305bfec8d67b887dd1802861e",
    );

    const wallet = new HotSingleWallet(
      privateKey,
      Core.NetworkId.Mainnet,
      mockProvider,
      privateKey,
    );
    console.log(wallet.address.toBech32());
  });
});
