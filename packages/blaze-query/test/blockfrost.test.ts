import {
  Hash28ByteBase16,
  HexBlob,
  PlutusV2Script,
  Script,
} from "@blaze-cardano/core";
import { Blockfrost } from "../src";

const blockfrost = new Blockfrost({
  network: "cardano-preview",
  projectId: "test",
});

const alwaysTrueScript: Script = Script.newPlutusV2Script(
  new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
);

describe("Blockfrost", () => {
  it("should be able to handle a string or a script in resolveScriptRef", async () => {
    const spy = jest.spyOn(Blockfrost.prototype, "getUnspentOutputs");
    spy.mockResolvedValue([]);

    await expect(
      blockfrost.resolveScriptRef(Hash28ByteBase16("0".repeat(56))),
    ).resolves.not.toThrow();

    await expect(
      blockfrost.resolveScriptRef(alwaysTrueScript),
    ).resolves.not.toThrow();

    spy.mockClear();
  });
});
