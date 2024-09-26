import {
  Address,
  AuxiliaryData,
  ConstrPlutusData,
  Datum,
  DatumHash,
  Ed25519KeyHashHex,
  hardCodedProtocolParams,
  HexBlob,
  NetworkId,
  PlutusData,
  PlutusList,
  PlutusV2Script,
  Script,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  Value,
} from "@blaze-cardano/core";
import * as value from "../src/value";
import { TxBuilder } from "../src/tx";
import { makeUplcEvaluator } from "@blaze-cardano/vm";

function flatten<U>(iterator: IterableIterator<U> | undefined): U[] {
  if (!iterator) {
    return [];
  }
  const result: U[] = [];
  for (const item of iterator) {
    result.push(item);
  }
  return result;
}

const ASSETS = Array.from({ length: 1200 }, (_, i) =>
  i
    .toString(16)
    .padStart(2, "0")
    .concat("ef".repeat(56 / 2)),
);

describe("Transaction Building", () => {
  it("A complex transaction should balance correctly", async () => {
    const ASSET_NAME_1 = ASSETS[0]!;
    const ASSET_NAME_2 = ASSETS[1]!;
    // $hosky
    const testAddress = Address.fromBech32(
      "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
    );
    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("0".repeat(64)), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(50_000_000n, [ASSET_NAME_1, 1n], [ASSET_NAME_2, 1n]),
        ),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("1".padStart(64, "0")), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(40_000_000n, [ASSET_NAME_1, 1n], [ASSET_NAME_2, 1n]),
        ),
      ),
    ];
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .payAssets(testAddress, value.makeValue(48_708_900n, [ASSET_NAME_1, 1n]))
      .complete();

    const inputValue =
      // value.merge(
      tx
        .body()
        .inputs()
        .values()
        .map((x) =>
          utxos
            .find((y) => y.input().toCbor() == x.toCbor())!
            .output()
            .amount(),
        )
        .reduce(value.merge, value.zero());
    //   ,new Value(
    //     flatten(tx.body().withdrawals()?.values()).reduce((x, y) => x + y, 0n),
    //   ),
    // )

    const outputValue = value.merge(
      flatten(tx.body().outputs().values())
        .map((x) => x.amount())
        .reduce(value.merge, value.zero()),
      new Value(tx.body().fee()),
    );

    console.log("Change: ", tx.body().outputs().at(1)?.amount().coin());

    console.dir(inputValue.toCore(), { depth: null });
    console.dir(outputValue.toCore(), { depth: null });

    // console.dir(tx.toCore(), {depth: null})
    expect(inputValue.toCbor()).toEqual(outputValue.toCbor());
  });
  it("Should correctly balance change for a really big output change", async () => {
    // $hosky
    const testAddress = Address.fromBech32(
      "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
    );
    const utxo1Assets: [string, bigint][] = ASSETS.slice(
      0,
      ASSETS.length / 2,
    ).map((x) => [x, 1n]);
    const utxo2Assets: [string, bigint][] = ASSETS.slice(ASSETS.length / 2).map(
      (x) => [x, 1n],
    );
    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("0".repeat(64)), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(10_000_000_000n, ...utxo1Assets),
        ),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("1".padStart(64, "0")), 0n),
        new TransactionOutput(
          testAddress,
          value.makeValue(10_000_000_000n, ...utxo2Assets),
        ),
      ),
    ];
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .payAssets(
        testAddress,
        value.makeValue(10_001_000_000n, [ASSETS[0]!, 1n]),
      )
      .complete();

    const inputValue =
      // value.merge(
      tx
        .body()
        .inputs()
        .values()
        .map((x) =>
          utxos
            .find((y) => {
              return y.input().toCbor() == x.toCbor();
            })!
            .output()
            .amount(),
        )
        .reduce(value.merge, value.zero());
    //   ,new Value(
    //     flatten(tx.body().withdrawals()?.values()).reduce((x, y) => x + y, 0n),
    //   ),
    // )
    //

    const outputValue = value.merge(
      Array.from(tx.body().outputs().values())
        .map((x) => x.amount())
        .reduce(value.merge, value.zero()),
      new Value(tx.body().fee()),
    );

    console.log("Change: ", tx.body().outputs().at(1)?.amount().coin());

    console.dir(inputValue.toCore(), { depth: null });
    console.dir(outputValue.toCore(), { depth: null });

    expect(inputValue.multiasset()?.size).toEqual(
      outputValue.multiasset()?.size,
    );
    expect(inputValue.toCbor()).toEqual(outputValue.toCbor());
  });
  // The following test is based on the below transaction, which was a transaction built by JPG Store. It created a fee that was too small.
  // 84aa008282582032eaefc2c186411bb4b999f049168f2e3698fba95dc7a34b501998efc1e12bd5008258202a4370a502edee902e1380550f3a1de5cb79ad5fef287dbc2e2fbbf88eeff02b010182825839012229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6f988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825c821a001226b8a1581ca2e719d70b9d71636aa825e71c11ca508ecf98eec87182b0e526d7c5a150000de1404f5554504f5354303737393001825839012229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6f988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825c1b000000010e044191021a00037479031a080dadf90b5820b364dedb7511ab4037953c059263e60af66bdc72111783c6f73a3dd1aa9ea4cc0d81825820e38ff80f05017b6946ba6be90a827740fb8f9155ddfd3fb69ba99fe830931b5d020e81581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac610825839012229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6f988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825c1a00471c8a111a00052eb612818258201693c508b6132e89b932754d657d28b24068ff5ff1715fec36c010d4d6470b3d00a20481d8799f9fd8799fd8799fd8799f581c6f52cb0e5c2767859dc6afa9331700bd6fad888dcc140e66c101b943ffd8799fd8799fd8799f581ce3c9536e2947e33703d5793a02b593a8d32b49aaaef03ea0b2b03c87ffffffff1a07258760ffd8799fd8799fd8799f581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6ffd8799fd8799fd8799f581cf988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825cffffffff1a3ee3da80ffff581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6ff0581840001d87a80821a0001d6991a0202fe87f5f6
  it("Should calculate fee correctly running script", async () => {
    const outputAddress = Address.fromBech32(
      "addr1qy3znuu30r3wwxewacwds8zkh7p29jaw7r6fhumxjp7043he3p3j6avyp732svlzrkga5xyn2ltf067pq79e49essfwqxsxf8s",
    );
    const jpgAddress = Address.fromBech32(
      "addr1x8rjw3pawl0kelu4mj3c8x20fsczf5pl744s9mxz9v8n7efvjel5h55fgjcxgchp830r7h2l5msrlpt8262r3nvr8ekstg4qrx",
    );
    const inputAddress = Address.fromBech32(
      "addr1qyntnf6e8pmk9305xcdwreaav3lgnwsmue6du59jzcjspd8e3p3j6avyp732svlzrkga5xyn2ltf067pq79e49essfwqhfv8xr",
    );

    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "2A4370A502EDEE902E1380550F3A1DE5CB79AD5FEF287DBC2E2FBBF88EEFF02B",
          ),
          1n,
        ),
        new TransactionOutput(inputAddress, value.makeValue(4_530_207_134n)),
      ),
    ];

    const refOutput = new TransactionOutput(
      jpgAddress,
      value.makeValue(8124350n),
    );

    const jpgAskScript = Script.newPlutusV2Script(
      PlutusV2Script.fromCbor(
        HexBlob(
          "59068959068601000032323232323232323232322223232533300a323232323232323232323232323232323232533301c3370e900000089919191919191919191919192999814002099b8848000ccc0040140180204c8c8c8c8c8c8c8c8c8c8c8c8c94ccc0e0c0ec0184c8c8c94ccc0ecc0f80084c8c8c8c94ccc0f14ccc0f14ccc0f0028402452808008a50100214a066e24040008cdc7802a44100375a60760046eb8c0e400458c0f0004dd5981c0011bae30360011630390053375e00c98150d8799fd87a9f581c84cc25ea4c29951d40b443b95bbc5676bc425470f96376d1984af9abffd8799fd8799fd87a9f581c2c967f4bd28944b06462e13c5e3f5d5fa6e03f8567569438cd833e6dffffffff003375e002024606c002606c0046eacc0d0004c0d0008c0c8004c0a8010cdc199b83337040029032240c4903219980180080426103d8798000302f006302d005222323232323232323253330323375e0020122646464646464a66607066ebc00c02c4c94ccc0f0c0fc0284c8c8c94ccc0fcc1080084c8c94ccc0f8cdc7802a45001533303e533303e3371200e002266e21200000714a026466e000200054ccc10402c5200013301801300b1616375a607e0046eb8c0f400458c100004dd5981e0011bae303a00116303d00916375a60780026078004607400260640046072016606e0142c606c002606c0046eacc0d0004c0d0008c0c8004c0a8008c0c4010c0bc00cc004004888c8c8c8c8c8c8c8c94ccc0c0cdd7800a6103d8798000132323232323253330363375e006016264a666074607a0142646464a66607a608000426464a66607866e3c015221001533303c533303c3371200e002266e21200000714a026466e000200054ccc0fc02c52000133301701701300b1616375a607a0046eb8c0ec00458c0f8004dd5981d0011bae303800116303b00916375a6074002607400460700026060004606e014606a0122c606800260680046eacc0c8004c0c8008c0c0004c0a0008c0bc00cc0b4008ccc8c0040048894ccc0a800852809919299981498018010a511333005005001003302e003375c605800497ae1011e581c15df89fe62968415bac4de9d8576da39c34db4717f46332572aca3eb00811e581c53391ebae9fa352a1108e2769df9baf0d3efcab0f49404bd6ac56bd400119805806800999919191800800911299981419b89480500044c8ccc010010004cdc080124028646464646464646464606e002606c002606a00260680026066002606400260620026060002605e002605c0042660080040026002002444a66604c66e1c0052000100213233300400400133702004900118160010090031bac3027001301f01832323374a9002198131ba90014bd701b94001376600260480026038a66603c66e1d2002301d011101116375a604400260340282660040086eb8cc060c06804d2002301a0133001001222533301f00214a026464a66603c66e3c00800c528899980280280080198118019bae30210023758603a002603a002603800260360026034002603200260300046eb0c058004c058004c054004c03000cc048004c048008c040004c02000c52616320053323232232533300e3370e9000000899191919299980a980c00109924c6600e0064649319299980a19b87480000044c8c8c8c94ccc06cc0780084c9263253330193370e9000000899191919299981018118010991924c64a66603e66e1d20000011323253330243027002132498c94ccc088cdc3a400000226464a66604e605400426493180d8008b181400098100010a99981119b87480080044c8c8c8c8c8c94ccc0acc0b800852616375a605800260580046eb4c0a8004c0a8008dd6981400098100010b18100008b1812800980e8018a99980f99b874800800454ccc088c07400c5261616301d00230140031630210013021002301f001301700416301700316375a60380026038004603400260240042c60240022c6eb8c058004c058008dd6180a00098060010b1806000980080091129998080010a4c264666008008602800600460026024004464a66601666e1d20000011323253330103013002149858dd7180880098048010a99980599b87480080044c8c94ccc040c04c00852616375c602200260120042c60120020086400664a66601266e1d200000113232533300e3011002149858dd6980780098038018a99980499b874800800454ccc030c01c00c5261616300700233001001480008888cccc01ccdc38008018061199980280299b8000448008c0380040080088c014dd5000918019baa0015734aae7555cf2ab9f5740ae855d101",
        ),
      ),
    );

    refOutput.setScriptRef(jpgAskScript);

    const referenceInput: TransactionUnspentOutput =
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "1693C508B6132E89B932754D657D28B24068FF5FF1715FEC36C010D4D6470B3D",
          ),
          0n,
        ),
        refOutput,
      );

    const params = { ...hardCodedProtocolParams };
    if (params.minFeeReferenceScripts) {
      params.minFeeReferenceScripts.base = 15;
    }
    const jpgOutput = new TransactionOutput(
      jpgAddress,
      value.makeValue(1336100n, [
        "a2e719d70b9d71636aa825e71c11ca508ecf98eec87182b0e526d7c5000de1404f5554504f53543037373930",
        1n,
      ]),
    );
    jpgOutput.setDatum(
      Datum.newDataHash(
        DatumHash(
          "804af7c563cc3108d7f88e8e1e23994d6c3ec24b4ebdeef7744973608315a2a4",
        ),
      ),
    );
    const jpgUtxo = new TransactionUnspentOutput(
      new TransactionInput(
        TransactionId(
          "32EAEFC2C186411BB4B999F049168F2E3698FBA95DC7A34B501998EFC1E12BD5",
        ),
        0n,
      ),

      jpgOutput,
    );
    const redeemer = PlutusData.newConstrPlutusData(
      new ConstrPlutusData(1n, new PlutusList()),
    );
    const datum = PlutusData.fromCbor(
      HexBlob(
        "d8799f9fd8799fd8799fd8799f581c6f52cb0e5c2767859dc6afa9331700bd6fad888dcc140e66c101b943ffd8799fd8799fd8799f581ce3c9536e2947e33703d5793a02b593a8d32b49aaaef03ea0b2b03c87ffffffff1a07258760ffd8799fd8799fd8799f581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6ffd8799fd8799fd8799f581cf988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825cffffffff1a3ee3da80ffff581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6ff",
      ),
    );
    const collateralUtxo = new TransactionUnspentOutput(
      new TransactionInput(
        TransactionId(
          "e38ff80f05017b6946ba6be90a827740fb8f9155ddfd3fb69ba99fe830931b5d",
        ),
        2n,
      ),
      new TransactionOutput(
        Address.fromBech32(
          "addr1q9a9vkvsncec97jh44kvdqnx8qjx8lk244v2f6utdnhnh3le3p3j6avyp732svlzrkga5xyn2ltf067pq79e49essfwqkn74qn",
        ),
        value.makeValue(5_000_000n),
      ),
    );

    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .provideCollateral([collateralUtxo])
      .useEvaluator(makeUplcEvaluator(params, 1, 1))
      .setChangeAddress(outputAddress)
      .setNetworkId(NetworkId.Mainnet)
      .addInput(jpgUtxo, redeemer, datum)
      .addRequiredSigner(
        Ed25519KeyHashHex(
          "2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6",
        ),
      )
      .addReferenceInput(referenceInput)
      .payAssets(
        outputAddress,
        value.makeValue(1189560n, [
          "a2e719d70b9d71636aa825e71c11ca508ecf98eec87182b0e526d7c5000de1404f5554504f53543037373930",
          1n,
        ]),
      )
      .complete();
    // Calculate the fee based on the transaction size and minimum fee parameters.
    //
    // expect(tx.toCbor()).toEqual(
    //   "84aa008282582032eaefc2c186411bb4b999f049168f2e3698fba95dc7a34b501998efc1e12bd5008258202a4370a502edee902e1380550f3a1de5cb79ad5fef287dbc2e2fbbf88eeff02b010182825839012229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6f988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825c821a001226b8a1581ca2e719d70b9d71636aa825e71c11ca508ecf98eec87182b0e526d7c5a150000de1404f5554504f5354303737393001825839012229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6f988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825c1b000000010e044191021a00037479031a080dadf90b5820b364dedb7511ab4037953c059263e60af66bdc72111783c6f73a3dd1aa9ea4cc0d81825820e38ff80f05017b6946ba6be90a827740fb8f9155ddfd3fb69ba99fe830931b5d020e81581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac610825839012229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6f988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825c1a00471c8a111a00052eb612818258201693c508b6132e89b932754d657d28b24068ff5ff1715fec36c010d4d6470b3d00a20481d8799f9fd8799fd8799fd8799f581c6f52cb0e5c2767859dc6afa9331700bd6fad888dcc140e66c101b943ffd8799fd8799fd8799f581ce3c9536e2947e33703d5793a02b593a8d32b49aaaef03ea0b2b03c87ffffffff1a07258760ffd8799fd8799fd8799f581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6ffd8799fd8799fd8799f581cf988632d75840fa2a833e21d91da189357d697ebc1078b9a9730825cffffffff1a3ee3da80ffff581c2229f39178e2e71b2eee1cd81c56bf82a2cbaef0f49bf366907cfac6ff0581840001d87a80821a0001d6991a0202fe87f5f6",
    // );
    expect(tx.body().fee().toString()).toEqual("235269");
  });

  // The following test is based on the below transaction, which was a transaction built by JPG Store. It created a fee that was too small.
  // 84a50082825820c5ecfe23d8e1fb31b68cb4e5b3b04e2cf5d16510163420501ec981dea010797a038258204b3c188d713345b31abe10013f0ddf4a822b6f11bd1010386d7bf2a10bea991c02018383583931c727443d77df6cff95dca383994f4c3024d03ff56b02ecc22b0f3f652c967f4bd28944b06462e13c5e3f5d5fa6e03f8567569438cd833e6d821a0014d8fea1581cdd589bbcfa48c9a133a22e205da33a5d07ef79dac1f8d5d8067b1004a15777686572657357696c6454616e677a57616c646f313035015820b5cfda67c40eb18ebc9a75518d4be7769fb637e96e510889fdd72a17bcc86271825839010e25beb3f6253f4e19ff4db22eb0372ae06abf1a3bf9f417e532bee886668ae3519cd6618dc692a28f5ec9734fc29917dee33ee79dd63219821a00323ea8a9581ccaa18329293a0fc71eaad5b27db33f27b47cdd58c0d3223977f46b70a146724941474f4e01581ccbe39f3e91910e9e1b777a633419d971e16b32aee33efc250766b99aa144454747531a001e8468581ccfee97ff8359f07a0a395a72b424bc6e030503390d864b86d4e0ecf8a1464b41495a454e1a000b71b0581cd5dec6074942b36b50975294fd801f7f28c907476b1ecc1b57c916eda1435241541a1082af40581cd894897411707efa755a76deb66d26dfd50593f2e70863e1661e98a0a14a7370616365636f696e731905dc581ce282271ec9251ba23fb123b0f53618b35cf5a6cde4170c003a0ebf13a148424a53303833363001581cefc46d26f2a914c405bd99b249eb2de7cd2ad320b5cbe74e4f8e9510a54c546865466978657231333438014c546865466978657231343838014c546865466978657231363034014c546865466978657231393938014c54686546697865723237323601581cf0e2e1e619ea784202ab90d96b6785684611fa213bb46fdcdc3ae5e1a24d59524941433230323431333839014d5952494143323032343137323201581cfca746f58adf9f3da13b7227e5e2c6052f376447473f4d49f8004195a551000de140436974697a656e2023303637360151000de140436974697a656e2023363333370151000de140436974697a656e2023363739300151000de140436974697a656e2023373138390151000de140436974697a656e20233938333701825839010e25beb3f6253f4e19ff4db22eb0372ae06abf1a3bf9f417e532bee886668ae3519cd6618dc692a28f5ec9734fc29917dee33ee79dd632191a014f7c16021a00034335031a080ee625075820bcf716b3925df69b10d102b04f949b8502226cc45ee41db404764837e433a6eda0f5a5181e61361832784064383739396639666438373939666438373939666438373939663538316330653235626562336636323533663465313966663464623232656230333732616530183378403661626631613362663966343137653533326265653866666438373939666438373939666438373939663538316338363636386165333531396364363631386418347840633639326132386635656339373334666332393931376465653333656537396464363332313966666666666666663161303038393534343066666666353831631835783b306532356265623366363235336634653139666634646232326562303337326165303661626631613362663966343137653533326265653866662c

  it("should correctly calculate fee without script", async () => {
    const outputAddress = Address.fromBech32(
      "addr1qy8zt04n7cjn7nselaxmyt4sxu4wq64lrgalnaqhu5eta6yxv69wx5vu6escm35j5284ajtnflpfj977uvlw08wkxgvsups8k8",
    );
    const jpgAddress = Address.fromBech32(
      "addr1x8rjw3pawl0kelu4mj3c8x20fsczf5pl744s9mxz9v8n7efvjel5h55fgjcxgchp830r7h2l5msrlpt8262r3nvr8ekstg4qrx",
    );
    const inputAddress = Address.fromBech32(
      "addr1q90kjx3srj9e4fstwp0x9y63yxwk9jse4e2c395y4s3arwvxv69wx5vu6escm35j5284ajtnflpfj977uvlw08wkxgvsp2g5yt",
    );

    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "C5ECFE23D8E1FB31B68CB4E5B3B04E2CF5D16510163420501EC981DEA010797A",
          ),
          3n,
        ),
        new TransactionOutput(
          outputAddress,
          value.makeValue(
            3_534_200n,
            [
              "fca746f58adf9f3da13b7227e5e2c6052f376447473f4d49f8004195000de140436974697a656e202330363736",
              1n,
            ],
            [
              "fca746f58adf9f3da13b7227e5e2c6052f376447473f4d49f8004195000de140436974697a656e202336333337",
              1n,
            ],
            [
              "fca746f58adf9f3da13b7227e5e2c6052f376447473f4d49f8004195000de140436974697a656e202336373930",
              1n,
            ],
            [
              "fca746f58adf9f3da13b7227e5e2c6052f376447473f4d49f8004195000de140436974697a656e202337313839",
              1n,
            ],
            [
              "fca746f58adf9f3da13b7227e5e2c6052f376447473f4d49f8004195000de140436974697a656e202339383337",
              1n,
            ],
            [
              "e282271ec9251ba23fb123b0f53618b35cf5a6cde4170c003a0ebf13424a533038333630",
              1n,
            ],
            [
              "cbe39f3e91910e9e1b777a633419d971e16b32aee33efc250766b99a45474753",
              1999976n,
            ],
            [
              "cfee97ff8359f07a0a395a72b424bc6e030503390d864b86d4e0ecf84b41495a454e",
              750000n,
            ],
            [
              "d5dec6074942b36b50975294fd801f7f28c907476b1ecc1b57c916ed524154",
              277000000n,
            ],
            [
              "efc46d26f2a914c405bd99b249eb2de7cd2ad320b5cbe74e4f8e9510546865466978657231333438",
              1n,
            ],
            [
              "efc46d26f2a914c405bd99b249eb2de7cd2ad320b5cbe74e4f8e9510546865466978657231343838",
              1n,
            ],
            [
              "efc46d26f2a914c405bd99b249eb2de7cd2ad320b5cbe74e4f8e9510546865466978657231363034",
              1n,
            ],
            [
              "efc46d26f2a914c405bd99b249eb2de7cd2ad320b5cbe74e4f8e9510546865466978657231393938",
              1n,
            ],
            [
              "efc46d26f2a914c405bd99b249eb2de7cd2ad320b5cbe74e4f8e9510546865466978657232373236",
              1n,
            ],
            [
              "f0e2e1e619ea784202ab90d96b6785684611fa213bb46fdcdc3ae5e159524941433230323431333839",
              1n,
            ],
            [
              "f0e2e1e619ea784202ab90d96b6785684611fa213bb46fdcdc3ae5e159524941433230323431373232",
              1n,
            ],
            [
              "caa18329293a0fc71eaad5b27db33f27b47cdd58c0d3223977f46b70724941474f4e",
              1n,
            ],
            [
              "d894897411707efa755a76deb66d26dfd50593f2e70863e1661e98a07370616365636f696e73",
              1500n,
            ],
            [
              "dd589bbcfa48c9a133a22e205da33a5d07ef79dac1f8d5d8067b100477686572657357696c6454616e677a57616c646f313035",
              1n,
            ],
          ),
        ),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "4B3C188D713345B31ABE10013F0DDF4A822B6F11BD1010386D7BF2A10BEA991C",
          ),
          2n,
        ),
        new TransactionOutput(inputAddress, value.makeValue(23325049n)),
      ),
    ];

    const metadata: Map<bigint, string> = new Map();
    metadata.set(30n, "6");
    metadata.set(
      50n,
      "d8799f9fd8799fd8799fd8799f581c0e25beb3f6253f4e19ff4db22eb0372ae0",
    );
    metadata.set(
      51n,
      "6abf1a3bf9f417e532bee8ffd8799fd8799fd8799f581c86668ae3519cd6618d",
    );
    metadata.set(
      52n,
      "c692a28f5ec9734fc29917dee33ee79dd63219ffffffff1a00895440ffff581c",
    );
    metadata.set(
      53n,
      "0e25beb3f6253f4e19ff4db22eb0372ae06abf1a3bf9f417e532bee8ff,",
    );

    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .lockAssets(
        jpgAddress,
        value.makeValue(1366270n, [
          "dd589bbcfa48c9a133a22e205da33a5d07ef79dac1f8d5d8067b100477686572657357696c6454616e677a57616c646f313035",
          1n,
        ]),
        Datum.newDataHash(
          DatumHash(
            "B5CFDA67C40EB18EBC9A75518D4BE7769FB637E96E510889FDD72A17BCC86271",
          ),
        ) as unknown as Datum, // TODO: why is this type assertion necessary?
      )
      .setChangeAddress(outputAddress)
      .setNetworkId(NetworkId.Mainnet)
      .setAuxiliaryData(
        AuxiliaryData.fromCore({
          blob: metadata,
        }),
      )
      .addRequiredSigner(
        Ed25519KeyHashHex(
          "86668ae3519cd6618dc692a28f5ec9734fc29917dee33ee79dd63219",
        ),
      )
      .complete();

    const manualFee =
      hardCodedProtocolParams.minFeeConstant +
      (tx.toCbor().length / 2) * hardCodedProtocolParams.minFeeCoefficient;
    expect(tx.body().fee().toString()).toEqual(manualFee.toString());

    expect(tx.body().fee().toString()).toEqual("218213");
  });
});
