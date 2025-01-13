import {
  Address,
  DatumHash,
  hardCodedProtocolParams,
  HexBlob,
  PlutusData,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  type TransactionWitnessSet,
  type ProtocolParameters,
} from "@blaze-cardano/core";
import { TxBuilder } from "../../src";
import * as value from "../../src/value";

class TestTxBuilder extends TxBuilder {
  constructor(params: ProtocolParameters) {
    super(params);
  }

  test__getScriptData(tw?: TransactionWitnessSet) {
    tw ??= super.buildTransactionWitnessSet();
    return super.getScriptData(tw);
  }
}

describe("TxBuilder.getScriptData", () => {
  it("should return undefined if no datums or redeemers", async () => {
    // Real Preview Transaction: ab46256ef7fa8c4aad88be214482c76e1a5b6341c1b27b572d1c01a814a0372d
    const tx = new TestTxBuilder(hardCodedProtocolParams);
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "3228e3b7929f7c6e727f436c2ea2d139fa5dbfdc236739313fc00faed5d52f3c",
          ),
          1n,
        ),
        new TransactionOutput(
          Address.fromBech32(
            "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
          ),
          value.makeValue(1_287_000n, [
            "44a1eb2d9f58add4eb1932bd0048e6a1947e85e3fe4f32956a1104140014df102e74e6af9739616dd021f547bca1f68c937b566bb6ca2e4782e76001",
            464_705n,
          ]),
        ),
      ),
    );

    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "3228e3b7929f7c6e727f436c2ea2d139fa5dbfdc236739313fc00faed5d52f3c",
          ),
          2n,
        ),
        new TransactionOutput(
          Address.fromBech32(
            "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
          ),
          value.makeValue(2893_406_704n),
        ),
      ),
    );

    tx.lockAssets(
      Address.fromBech32(
        "addr_test1zr866xg5kkvarzll69xjh0tfvqvu9zvuhht2qve9ehmgp0qjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngq4qar8t",
      ),
      value.makeValue(3_280_000n, [
        "44a1eb2d9f58add4eb1932bd0048e6a1947e85e3fe4f32956a1104140014df102e74e6af9739616dd021f547bca1f68c937b566bb6ca2e4782e76001",
        116_176n,
      ]),
      PlutusData.fromCbor(
        HexBlob(
          "d8799fd8799f581c2e74e6af9739616dd021f547bca1f68c937b566bb6ca2e4782e76001ffd8799f581c121fd22e0b57ac206fefc763f8bfa0771919f5218b40691eea4514d0ff1a00138800d8799fd8799fd8799f581cc279a3fb3b4e62bbc78e288783b58045d4ae82a18867d8352d02775affd8799fd8799fd8799f581c121fd22e0b57ac206fefc763f8bfa0771919f5218b40691eea4514d0ffffffffd87980ffd87c9f9f581c44a1eb2d9f58add4eb1932bd0048e6a1947e85e3fe4f32956a11041458200014df102e74e6af9739616dd021f547bca1f68c937b566bb6ca2e4782e760011a0001c5d0ffff43d87980ff",
        ),
      ),
    );

    expect(tx.test__getScriptData()).toBeUndefined();
  });

  it("should correctly build script data when datums are attached but no redeemers", async () => {
    const tx = new TestTxBuilder(hardCodedProtocolParams);

    // UTXO #1
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "a7d0a23abf5f0389a2b17df1125539a0e43ee8b1f13c56d6ba406aa557ade1d2",
          ),
          0n,
        ),
        new TransactionOutput(
          Address.fromBech32(
            "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
          ),
          value.makeValue(15_000_000n),
        ),
      ),
    );

    // UTXO #2
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "939b8a271e0e47fd6e8828319bf25cc34564d14d42df6b806b2a3254ea4bf0a4",
          ),
          2n,
        ),
        new TransactionOutput(
          Address.fromBech32(
            "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
          ),
          value.makeValue(
            2_000_000n,
            [
              "fa3eff2047fdf9293c5feef4dc85ce58097ea1c6da4845a35153518374494e4459",
              4_344_137n,
            ],
            [
              "4086577ed57c514f8e29b78f42ef4f379363355a3b65b9a032ee30c96c702002",
              20n,
            ],
          ),
        ),
      ),
    );

    // UTXO #3
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "e85c7b3caba4de32ec04de1e8b37d174b06cc921f932daefc05f5b7f08aabf78",
          ),
          2n,
        ),
        new TransactionOutput(
          Address.fromBech32(
            "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
          ),
          value.makeValue(2_014_978n, [
            "4086577ed57c514f8e29b78f42ef4f379363355a3b65b9a032ee30c96c702002",
            2_165_562n,
          ]),
        ),
      ),
    );

    tx.lockAssets(
      Address.fromBech32(
        "addr_test1wpesulg5dtt5y73r4zzay9qmy3wnlrxdg944xg4rzuvewls7nrsf0",
      ),
      value.makeValue(4_500_000n, [
        "4086577ed57c514f8e29b78f42ef4f379363355a3b65b9a032ee30c96c702002",
        6_509_699n,
      ]),
      DatumHash(
        "ee5efdd83746ef1067de71e8ffa7cefeba312b4592531b193aa9d6d47ba1aad1",
      ),
    );

    tx.provideDatum(
      PlutusData.fromCbor(
        HexBlob(
          "d8799f4102d8799fd8799fd8799fd8799f581cc279a3fb3b4e62bbc78e288783b58045d4ae82a18867d8352d02775affd8799fd8799fd8799f581c121fd22e0b57ac206fefc763f8bfa0771919f5218b40691eea4514d0ffffffffd87a80ffd87a80ff1a002625a0d87a9f1a00635483ffff",
        ),
      ),
    );

    expect(tx.test__getScriptData()).toMatchObject({
      redeemersEncoded: "a0",
      datumsEncoded:
        "d9010281d8799f4102d8799fd8799fd8799fd8799f581cc279a3fb3b4e62bbc78e288783b58045d4ae82a18867d8352d02775affd8799fd8799fd8799f581c121fd22e0b57ac206fefc763f8bfa0771919f5218b40691eea4514d0ffffffffd87a80ffd87a80ff1a002625a0d87a9f1a00635483ffff",
      costModelsEncoded: "a0",
      hashedData:
        "a0d9010281d8799f4102d8799fd8799fd8799fd8799f581cc279a3fb3b4e62bbc78e288783b58045d4ae82a18867d8352d02775affd8799fd8799fd8799f581c121fd22e0b57ac206fefc763f8bfa0771919f5218b40691eea4514d0ffffffffd87a80ffd87a80ff1a002625a0d87a9f1a00635483ffffa0",
      scriptDataHash:
        "c890ff82c5188d645850890263c1519b0728b6b3e633a1d6e8a30bfe34f8ce31",
    });
  });
});
