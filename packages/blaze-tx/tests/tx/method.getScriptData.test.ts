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
  Datum,
  Script,
  PlutusV1Script,
  PlutusV2Script,
  addressFromValidator,
  NetworkId,
} from "@blaze-cardano/core";
import { TxBuilder } from "../../src";
import * as value from "../../src/value";

class TestTxBuilder extends TxBuilder {
  constructor(params: ProtocolParameters) {
    super(params);
  }

  test__getScriptData(tw?: TransactionWitnessSet) {
    tw ??= super.buildPlaceholderWitnessSet();
    return super.getScriptData(tw);
  }
}

describe("TxBuilder.getScriptData", () => {
  it("should return undefined for no datums and no redeemers", async () => {
    const tx = new TestTxBuilder(hardCodedProtocolParams);

    tx.payAssets(
      Address.fromBech32(
        "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      ),
      value.makeValue(1_000_000n),
    );

    expect(tx.test__getScriptData()).toBeUndefined();
  });

  it("should return undefined for inline datum and no redeemers", async () => {
    const tx = new TestTxBuilder(hardCodedProtocolParams);

    tx.lockAssets(
      Address.fromBech32(
        "addr_test1zr866xg5kkvarzll69xjh0tfvqvu9zvuhht2qve9ehmgp0qjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngq4qar8t",
      ),
      value.makeValue(1_000_000n),
      PlutusData.fromCbor(HexBlob("d87980")),
    );

    expect(tx.test__getScriptData()).toBeUndefined();
  });

  it("should return correct script data hash with witness set datums but no redeemers", async () => {
    const tx = new TestTxBuilder(hardCodedProtocolParams);

    tx.lockAssets(
      Address.fromBech32(
        "addr_test1wpesulg5dtt5y73r4zzay9qmy3wnlrxdg944xg4rzuvewls7nrsf0",
      ),
      value.makeValue(1_000_000n),
      DatumHash(
        "923918e403bf43c34b4ef6b48eb2ee04babed17320d8d1b9ff9ad086e86f44ec",
      ),
    );

    tx.provideDatum(PlutusData.fromCbor(HexBlob("d87980")));

    expect(tx.test__getScriptData()).toMatchObject({
      redeemersEncoded: "a0",
      datumsEncoded: "d9010281" + "d87980", // nonempty set preamble + datum
      costModelsEncoded: "a0",
      hashedData: "a0" + "d9010281" + "d87980a0",
      scriptDataHash:
        "264ea21d9904cd72ce5038fa60e0ddd0859383f7fbf60ecec6df22e4c4e34a1f",
    });
  });

  it("should return correct script data hash with no datums and a redeemer", async () => {
    const tx = new TestTxBuilder(hardCodedProtocolParams);

    const alwaysTrueScript: Script = Script.newPlutusV2Script(
      new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const scriptAddress = addressFromValidator(
      NetworkId.Testnet,
      alwaysTrueScript,
    );
    const output = new TransactionOutput(
      scriptAddress,
      value.makeValue(1_000_000n),
    );
    output.setDatum(
      Datum.newInlineData(PlutusData.fromCbor(HexBlob("d87980"))),
    );
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "a7d0a23abf5f0389a2b17df1125539a0e43ee8b1f13c56d6ba406aa557ade1d2",
          ),
          0n,
        ),
        output,
      ),
      PlutusData.fromCbor(HexBlob("d87980")), // The redeemer to spend the script with
    );

    tx.provideScript(alwaysTrueScript);

    tx.payAssets(
      Address.fromBech32(
        "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      ),
      value.makeValue(1_000_000n),
    );

    const plutusV2CostModels =
      "a10198af1a000189b41901a401011903e818ad00011903e819ea350401192baf18201a000312591920a404193e801864193e801864193e801864193e801864193e801864193e80186418641864193e8018641a000170a718201a00020782182019f016041a0001194a18b2000119568718201a0001643519030104021a00014f581a00037c71187a0001011903e819a7a90402195fe419733a1826011a000db464196a8f0119ca3f19022e011999101903e819ecb2011a00022a4718201a000144ce1820193bc318201a0001291101193371041956540a197147184a01197147184a0119a9151902280119aecd19021d0119843c18201a00010a9618201a00011aaa1820191c4b1820191cdf1820192d1a18201a00014f581a00037c71187a0001011a0001614219020700011a000122c118201a00014f581a00037c71187a0001011a00014f581a00037c71187a0001011a000e94721a0003414000021a0004213c19583c041a00163cad19fc3604194ff30104001a00022aa818201a000189b41901a401011a00013eff182019e86a1820194eae182019600c1820195108182019654d182019602f18201a0290f1e70a1a032e93af1937fd0a1a0298e40b1966c40a";
    expect(tx.test__getScriptData()).toMatchObject({
      redeemersEncoded: "a182000082d87980821a00d59f801b00000002540be400",
      datumsEncoded: undefined,
      costModelsEncoded: plutusV2CostModels,
      hashedData:
        "a182000082d87980821a00d59f801b00000002540be400a10198af1a000189b41901a401011903e818ad00011903e819ea350401192baf18201a000312591920a404193e801864193e801864193e801864193e801864193e801864193e80186418641864193e8018641a000170a718201a00020782182019f016041a0001194a18b2000119568718201a0001643519030104021a00014f581a00037c71187a0001011903e819a7a90402195fe419733a1826011a000db464196a8f0119ca3f19022e011999101903e819ecb2011a00022a4718201a000144ce1820193bc318201a0001291101193371041956540a197147184a01197147184a0119a9151902280119aecd19021d0119843c18201a00010a9618201a00011aaa1820191c4b1820191cdf1820192d1a18201a00014f581a00037c71187a0001011a0001614219020700011a000122c118201a00014f581a00037c71187a0001011a00014f581a00037c71187a0001011a000e94721a0003414000021a0004213c19583c041a00163cad19fc3604194ff30104001a00022aa818201a000189b41901a401011a00013eff182019e86a1820194eae182019600c1820195108182019654d182019602f18201a0290f1e70a1a032e93af1937fd0a1a0298e40b1966c40a",
      scriptDataHash:
        "710814372ce5f98af866f23e79f6bc403805f0bb9be795e0ac3d930b7a8f627c",
    });
  });

  it("should return correct script data hash with datums and redeemers", async () => {
    const tx = new TestTxBuilder(hardCodedProtocolParams);

    const alwaysTrueScript: Script = Script.newPlutusV2Script(
      new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const scriptAddress = addressFromValidator(
      NetworkId.Testnet,
      alwaysTrueScript,
    );
    const output = new TransactionOutput(
      scriptAddress,
      value.makeValue(1_000_000n),
    );
    output.setDatum(
      Datum.newDataHash(
        DatumHash(
          "092e6ef8c4c0ead37a7a1774a7490ca76dd83df3ee22b64244668cef6eb20905",
        ),
      ),
    );
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "a7d0a23abf5f0389a2b17df1125539a0e43ee8b1f13c56d6ba406aa557ade1d2",
          ),
          0n,
        ),
        output,
      ),
      PlutusData.fromCbor(HexBlob("d87980")), // The redeemer to spend the script with,
      PlutusData.fromCbor(HexBlob("d87980")), // Datum
    );

    tx.provideScript(alwaysTrueScript);

    tx.payAssets(
      Address.fromBech32(
        "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      ),
      value.makeValue(1_000_000n),
    );

    const plutusV2CostModels =
      "a10198af1a000189b41901a401011903e818ad00011903e819ea350401192baf18201a000312591920a404193e801864193e801864193e801864193e801864193e801864193e80186418641864193e8018641a000170a718201a00020782182019f016041a0001194a18b2000119568718201a0001643519030104021a00014f581a00037c71187a0001011903e819a7a90402195fe419733a1826011a000db464196a8f0119ca3f19022e011999101903e819ecb2011a00022a4718201a000144ce1820193bc318201a0001291101193371041956540a197147184a01197147184a0119a9151902280119aecd19021d0119843c18201a00010a9618201a00011aaa1820191c4b1820191cdf1820192d1a18201a00014f581a00037c71187a0001011a0001614219020700011a000122c118201a00014f581a00037c71187a0001011a00014f581a00037c71187a0001011a000e94721a0003414000021a0004213c19583c041a00163cad19fc3604194ff30104001a00022aa818201a000189b41901a401011a00013eff182019e86a1820194eae182019600c1820195108182019654d182019602f18201a0290f1e70a1a032e93af1937fd0a1a0298e40b1966c40a";
    expect(tx.test__getScriptData()).toMatchObject({
      redeemersEncoded: "a182000082d87980821a00d59f801b00000002540be400",
      datumsEncoded: "d9010281" + "d87980",
      costModelsEncoded: plutusV2CostModels,
      hashedData:
        "a182000082d87980821a00d59f801b00000002540be400d9010281d87980a10198af1a000189b41901a401011903e818ad00011903e819ea350401192baf18201a000312591920a404193e801864193e801864193e801864193e801864193e801864193e80186418641864193e8018641a000170a718201a00020782182019f016041a0001194a18b2000119568718201a0001643519030104021a00014f581a00037c71187a0001011903e819a7a90402195fe419733a1826011a000db464196a8f0119ca3f19022e011999101903e819ecb2011a00022a4718201a000144ce1820193bc318201a0001291101193371041956540a197147184a01197147184a0119a9151902280119aecd19021d0119843c18201a00010a9618201a00011aaa1820191c4b1820191cdf1820192d1a18201a00014f581a00037c71187a0001011a0001614219020700011a000122c118201a00014f581a00037c71187a0001011a00014f581a00037c71187a0001011a000e94721a0003414000021a0004213c19583c041a00163cad19fc3604194ff30104001a00022aa818201a000189b41901a401011a00013eff182019e86a1820194eae182019600c1820195108182019654d182019602f18201a0290f1e70a1a032e93af1937fd0a1a0298e40b1966c40a",
      scriptDataHash:
        "e1b227554d79136615d527db574e58c432326010022d9e89f0eb58d743d8470d",
    });
  });

  it("should return correct script data hash with multiple script versions", async () => {
    const tx = new TestTxBuilder(hardCodedProtocolParams);

    const alwaysTrueV1: Script = Script.newPlutusV1Script(
      new PlutusV1Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const alwaysTrueV2: Script = Script.newPlutusV2Script(
      new PlutusV2Script(HexBlob("510100003222253330044a229309b2b2b9a1")),
    );
    const scriptAddressV1 = addressFromValidator(
      NetworkId.Testnet,
      alwaysTrueV1,
    );
    const scriptAddressV2 = addressFromValidator(
      NetworkId.Testnet,
      alwaysTrueV2,
    );
    const outputV1 = new TransactionOutput(
      scriptAddressV1,
      value.makeValue(1_000_000n),
    );
    const outputV2 = new TransactionOutput(
      scriptAddressV2,
      value.makeValue(1_000_000n),
    );
    outputV1.setDatum(
      Datum.newDataHash(
        DatumHash(
          "092e6ef8c4c0ead37a7a1774a7490ca76dd83df3ee22b64244668cef6eb20905",
        ),
      ),
    );
    outputV2.setDatum(
      Datum.newDataHash(
        DatumHash(
          "8392f0c940435c06888f9bdb8c74a95dc69f156367d6a089cf008ae05caae01e",
        ),
      ),
    );
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "a7d0a23abf5f0389a2b17df1125539a0e43ee8b1f13c56d6ba406aa557ade1d2",
          ),
          0n,
        ),
        outputV1,
      ),
      PlutusData.fromCbor(HexBlob("d87980")), // The redeemer to spend the script with,
      PlutusData.fromCbor(HexBlob("d87980")), // Datum
    );
    tx.addInput(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "a7d0a23abf5f0389a2b17df1125539a0e43ee8b1f13c56d6ba406aa557ade1d2",
          ),
          1n,
        ),
        outputV2,
      ),
      PlutusData.fromCbor(HexBlob("d87a80")), // The redeemer to spend the script with,
      PlutusData.fromCbor(HexBlob("d87a80")), // Datum
    );

    tx.provideScript(alwaysTrueV1);
    tx.provideScript(alwaysTrueV2);

    tx.payAssets(
      Address.fromBech32(
        "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      ),
      value.makeValue(1_000_000n),
    );

    const redeemersEncoded =
      "a282000082d87980821a00d59f801b00000002540be40082000182d87a80821a00d59f801b00000002540be400";
    const datumsEncoded = "d9010282" + "d87980" + "d87a80";
    const costModelsEncoded =
      "a20198af1a000189b41901a401011903e818ad00011903e819ea350401192baf18201a000312591920a404193e801864193e801864193e801864193e801864193e801864193e80186418641864193e8018641a000170a718201a00020782182019f016041a0001194a18b2000119568718201a0001643519030104021a00014f581a00037c71187a0001011903e819a7a90402195fe419733a1826011a000db464196a8f0119ca3f19022e011999101903e819ecb2011a00022a4718201a000144ce1820193bc318201a0001291101193371041956540a197147184a01197147184a0119a9151902280119aecd19021d0119843c18201a00010a9618201a00011aaa1820191c4b1820191cdf1820192d1a18201a00014f581a00037c71187a0001011a0001614219020700011a000122c118201a00014f581a00037c71187a0001011a00014f581a00037c71187a0001011a000e94721a0003414000021a0004213c19583c041a00163cad19fc3604194ff30104001a00022aa818201a000189b41901a401011a00013eff182019e86a1820194eae182019600c1820195108182019654d182019602f18201a0290f1e70a1a032e93af1937fd0a1a0298e40b1966c40a41005901a69f1a000189b41901a401011903e818ad00011903e819ea350401192baf18201a000312591920a404193e801864193e801864193e801864193e801864193e801864193e80186418641864193e8018641a000170a718201a00020782182019f016041a0001194a18b2000119568718201a0001643519030104021a00014f581a00037c71187a0001011903e819a7a90402195fe419733a1826011a000db464196a8f0119ca3f19022e011999101903e819ecb2011a00022a4718201a000144ce1820193bc318201a0001291101193371041956540a197147184a01197147184a0119a9151902280119aecd19021d0119843c18201a00010a9618201a00011aaa1820191c4b1820191cdf1820192d1a18201a00014f581a00037c71187a0001011a0001614219020700011a000122c118201a00014f581a00037c71187a0001011a00014f581a00037c71187a0001011a0004213c19583c041a00163cad19fc3604194ff30104001a00022aa818201a000189b41901a401011a00013eff182019e86a1820194eae182019600c1820195108182019654d182019602f18201a032e93af1937fd0aff";
    expect(tx.test__getScriptData()).toMatchObject({
      redeemersEncoded,
      datumsEncoded,
      costModelsEncoded,
      hashedData: redeemersEncoded + datumsEncoded + costModelsEncoded,
      scriptDataHash:
        "180262ca6cf7b0de40f7063cefbc23a1f931872af77f3f3e9df2ab05668de112",
    });
  });

  // TODO: add some golden tests based on some raw script bytes
});
