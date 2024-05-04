import {
  derivePublicKey,
  Address,
  AddressType,
  CredentialType,
  blake2b_224,
  HexBlob,
  NetworkId,
  Ed25519PrivateNormalKeyHex,
  TransactionInput,
  TransactionId,
} from "@blazecardano/core";
import { HotWallet } from "@blazecardano/wallet";
import { Emulator } from "../src";
import { EmulatorProvider } from "../src/provider";
import {
  generateGenesisUtxos,
  generateSeedPhrase,
  privateKeyFromMnenomic,
} from "./util";

function isDefined<T>(value: T | undefined): asserts value is T {
  expect(value).toBeDefined();
}

describe("Emulator", () => {
  let emulator: Emulator;
  let privateKeyHex: Ed25519PrivateNormalKeyHex;
  let address: Address;
  let wallet: HotWallet;

  beforeAll(async () => {
    const mnemonic = generateSeedPhrase();
    privateKeyHex = (await privateKeyFromMnenomic(mnemonic)).hex();
    const publicKey = derivePublicKey(privateKeyHex);

    address = new Address({
      type: AddressType.EnterpriseKey,
      networkId: NetworkId.Testnet,
      paymentPart: {
        type: CredentialType.KeyHash,
        hash: blake2b_224(HexBlob(publicKey)),
      },
    });
  });

  beforeEach(() => {
    emulator = new Emulator(generateGenesisUtxos(address));
    wallet = new HotWallet(
      privateKeyHex,
      NetworkId.Testnet,
      // TODO: mock
      new EmulatorProvider(emulator)
    );
  });

  test("Should be able to get a genesis UTxO", async () => {
    const inp = new TransactionInput(TransactionId("00".repeat(32)), 0n);
    const out = emulator.getOutput(inp);
    isDefined(out);
    expect(out.address()).toEqual<Address>(wallet.address);
    expect(out?.amount().coin()).toEqual(1_000_000_000n);
  });
});
