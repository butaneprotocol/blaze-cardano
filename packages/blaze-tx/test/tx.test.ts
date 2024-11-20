import {
  Address,
  AuxiliaryData,
  Datum,
  DatumHash,
  hardCodedProtocolParams,
  HexBlob,
  NetworkId,
  Slot,
  RewardAccount,
  PlutusData,
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

  it("A transaction should always have some inputs", async () => {
    // $hosky
    const testAddress = Address.fromBech32(
      "addr1q86ylp637q7hv7a9r387nz8d9zdhem2v06pjyg75fvcmen3rg8t4q3f80r56p93xqzhcup0w7e5heq7lnayjzqau3dfs7yrls5",
    );
    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("0".repeat(64)), 0n),
        new TransactionOutput(testAddress, value.makeValue(50_000_000n)),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(TransactionId("1".padStart(64, "0")), 0n),
        new TransactionOutput(testAddress, value.makeValue(40_000_000n)),
      ),
    ];
    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .setNetworkId(NetworkId.Testnet)
      .setChangeAddress(testAddress)
      .addWithdrawal(
        RewardAccount.fromCredential(
          testAddress.getProps().paymentPart!,
          NetworkId.Testnet,
        ),
        100_000_000n,
      )
      .payAssets(testAddress, value.makeValue(48_708_900n))
      .complete();

    const inputValue = value.merge(
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
        .reduce(value.merge, value.zero()),
      value.makeValue(100_000_000n),
    );

    const outputValue = value.merge(
      flatten(tx.body().outputs().values())
        .map((x) => x.amount())
        .reduce(value.merge, value.zero()),
      new Value(tx.body().fee()),
    );
    expect(inputValue.toCbor()).toEqual(outputValue.toCbor());
    expect(tx.body().inputs().values().length).toBeGreaterThan(0);
  });
  // The following test is based on the below transaction, which was a transaction built by JPG Store. It created a fee that was too small.
  // 84a90082825820db1c583fc6117b2370e4d11016a39b3e1f8352455b15bd07c6bf057e0a8e2dde008258203a6e908226c3e85d05c9ab76d38786ed7ba84cd920dd320baea85964e17d921c040185a30058393184cc25ea4c29951d40b443b95bbc5676bc425470f96376d1984af9ab2c967f4bd28944b06462e13c5e3f5d5fa6e03f8567569438cd833e6d011a00b6cce0028201d8185822582067f5229ae335a0f6331ee86b3b4a31c0c9bcdb41a591663acec78a0ab62be174825839011d1c186d5bc22eb56035c37e370f0dcc2c300e8e5f0fa46a6bfdda99a03de54eefd4acaf0e40dd1ca949fbcd2f6658f9703c8f59ca968a761a01c90030825839016a4ee8e9e3913b2952b6f69f667fdc47184f55dcb4f8c678cf59b9de591f2f3dae1f4c91c4edce5b26a93ac25b3f813e245ac19db95d90891a213436b0825839014e1cbebe49ccbb538fb58b29ba439cdb6c9ade5b10d1f201008e1f4d2f4f939101e76ba35586e8c3fd93a0334f74a11f36cf3a7df5411bb0821a0012050ca1581c40fa2aa67258b4ce7b5782f74831d46a84c59a0ff0c28262fab21728a14e436c61794e6174696f6e3337303101825839014e1cbebe49ccbb538fb58b29ba439cdb6c9ade5b10d1f201008e1f4d2f4f939101e76ba35586e8c3fd93a0334f74a11f36cf3a7df5411bb01a5293f64d021a00047313031a085de11e0b5820811d43a658e8157a12063822a0ce3e3eac4e26686aa19519c88e87ed4dfb46cb0d8182582069b685a7de3799cf778714ed2dee97dab7a983106caf75c9f752afc20399a29c0510825839014e1cbebe49ccbb538fb58b29ba439cdb6c9ade5b10d1f201008e1f4d2f4f939101e76ba35586e8c3fd93a0334f74a11f36cf3a7df5411bb01a00459ea3111a0006ac9d12818258201693c508b6132e89b932754d657d28b24068ff5ff1715fec36c010d4d6470b3d00a20481d8799f9fd8799fd8799fd8799f581c1d1c186d5bc22eb56035c37e370f0dcc2c300e8e5f0fa46a6bfdda99ffd8799fd8799fd8799f581ca03de54eefd4acaf0e40dd1ca949fbcd2f6658f9703c8f59ca968a76ffffffff1a01c90030ffd8799fd8799fd8799f581c6a4ee8e9e3913b2952b6f69f667fdc47184f55dcb4f8c678cf59b9deffd8799fd8799fd8799f581c591f2f3dae1f4c91c4edce5b26a93ac25b3f813e245ac19db95d9089ffffffff1a213436b0ffff581c6a4ee8e9e3913b2952b6f69f667fdc47184f55dcb4f8c678cf59b9deff0581840001d8799f00ff821a000326a91a04555e60f5f6
  it("Should calculate fee correctly running script", async () => {
    const outputAddress = Address.fromBech32(
      "addr1q98pe047f8xtk5u0kk9jnwjrnndkexk7tvgdruspqz8p7nf0f7fezq08dw34tphgc07e8gpnfa62z8ekeua8ma2prwcqzy3jhn",
    );
    const jpgAddress = Address.fromBech32(
      "addr1x8rjw3pawl0kelu4mj3c8x20fsczf5pl744s9mxz9v8n7efvjel5h55fgjcxgchp830r7h2l5msrlpt8262r3nvr8ekstg4qrx",
    );
    const inputAddress = Address.fromBech32(
      "addr1q98pe047f8xtk5u0kk9jnwjrnndkexk7tvgdruspqz8p7nf0f7fezq08dw34tphgc07e8gpnfa62z8ekeua8ma2prwcqzy3jhn",
    );

    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "3a6e908226c3e85d05c9ab76d38786ed7ba84cd920dd320baea85964e17d921c",
          ),
          4n,
        ),

        new TransactionOutput(inputAddress, value.makeValue(1_984_573_620n)),
      ),
    ];

    const refOutput = new TransactionOutput(
      Address.fromBech32(
        "addr1w8rjw3pawl0kelu4mj3c8x20fsczf5pl744s9mxz9v8n7eg0fcr8k",
      ),
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
    const jpgOutput = new TransactionOutput(
      jpgAddress,
      value.makeValue(1_327_480n, [
        "40fa2aa67258b4ce7b5782f74831d46a84c59a0ff0c28262fab21728436c61794e6174696f6e33373031",
        1n,
      ]),
    );
    jpgOutput.setDatum(
      Datum.newDataHash(
        DatumHash(
          "9ef989c39ec7a452e68eaaa8c26c41cd0e7939909a3bff0ac823d3f22c7b0650",
        ),
      ),
    );
    const jpgUtxo = new TransactionUnspentOutput(
      new TransactionInput(
        TransactionId(
          "db1c583fc6117b2370e4d11016a39b3e1f8352455b15bd07c6bf057e0a8e2dde",
        ),
        0n,
      ),

      jpgOutput,
    );
    const redeemer = PlutusData.fromCbor(HexBlob("d8799f00ff"));
    const datum = PlutusData.fromCbor(
      HexBlob(
        "d8799f9fd8799fd8799fd8799f581c1d1c186d5bc22eb56035c37e370f0dcc2c300e8e5f0fa46a6bfdda99ffd8799fd8799fd8799f581ca03de54eefd4acaf0e40dd1ca949fbcd2f6658f9703c8f59ca968a76ffffffff1a01c90030ffd8799fd8799fd8799f581c6a4ee8e9e3913b2952b6f69f667fdc47184f55dcb4f8c678cf59b9deffd8799fd8799fd8799f581c591f2f3dae1f4c91c4edce5b26a93ac25b3f813e245ac19db95d9089ffffffff1a213436b0ffff581c6a4ee8e9e3913b2952b6f69f667fdc47184f55dcb4f8c678cf59b9deff",
      ),
    );
    const collateralUtxo = new TransactionUnspentOutput(
      new TransactionInput(
        TransactionId(
          "69b685a7de3799cf778714ed2dee97dab7a983106caf75c9f752afc20399a29c",
        ),
        5n,
      ),
      new TransactionOutput(inputAddress, value.makeValue(5_000_000n)),
    );
    // This tx was built with base = 44
    if (params.minFeeReferenceScripts) params.minFeeReferenceScripts.base = 44;

    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .provideCollateral([collateralUtxo])
      .useEvaluator(makeUplcEvaluator(params, 1, 1))
      .setChangeAddress(outputAddress)
      .setNetworkId(NetworkId.Mainnet)
      .addInput(jpgUtxo, redeemer, datum)
      .addReferenceInput(referenceInput)
      .setValidUntil(Slot(140370206))
      .lockAssets(
        Address.fromBech32(
          "addr1xxzvcf02fs5e282qk3pmjkau2emtcsj5wrukxak3np90n2evjel5h55fgjcxgchp830r7h2l5msrlpt8262r3nvr8eksg6pw3p",
        ),
        value.makeValue(11_980_000n),
        PlutusData.fromCbor(
          HexBlob(
            "582067f5229ae335a0f6331ee86b3b4a31c0c9bcdb41a591663acec78a0ab62be174",
          ),
        ),
      )
      .payAssets(
        Address.fromBech32(
          "addr1qyw3cxrdt0pzadtqxhphudc0phxzcvqw3e0slfr2d07a4xdq8hj5am754jhsusxarj55n77d9an937ts8j84nj5k3fmqddwtss",
        ),
        value.makeValue(29_950_000n),
      )
      .payAssets(
        Address.fromBech32(
          "addr1q94ya68fuwgnk22jkmmf7enlm3r3sn64mj6033nceavmnhjeruhnmtslfjgufmwwtvn2jwkztvlcz03yttqemw2ajzysscv93x",
        ),
        value.makeValue(557_070_000n),
      )
      .complete();
    console.log(tx.toCbor());

    expect(tx.body().fee().toString()).toEqual("291603");
  });

  // The following test is based on the below transaction, which was a transaction built by JPG Store. It created a fee that was too small.
  // 84a50082825820f4646e385964a642bee6ced21115ee6560cb6d7d99302db89319013a0b5e641900825820245202665911774b64bd1941f33abd23bcedd7918ccfa141c2c911810df1454400018283583931c727443d77df6cff95dca383994f4c3024d03ff56b02ecc22b0f3f652c967f4bd28944b06462e13c5e3f5d5fa6e03f8567569438cd833e6d821a00151c56a1581cccb2b25e5fd18224ea931a3812e5888716d9c08cd8871ff0ab3dc2faa1581a456d706f7761466f756e64696e67436f6d6d756e697479383333015820440f5b899c44c58bfd73c3283e8d72601ac39e178f854c2d52a80f9ef6ab2bec825839011c899db8a0539f39dc408fa8b1d09c29d214504ad57f10d7c355f90372b3acda54e7e9f23a683f519eda1286afc43ad1203a4e6204ceb5a71a3a0cc5e8021a0002dc15031a085de5fd0758205fa5ee64ef9dce3fbbb9e35c3eab5244c445d60364ef6993fbfc3a544eb24c03a0f5a5181e61361832784064383739396639666438373939666438373939666438373939663538316331633839396462386130353339663339646334303866613862316430396332396432183378403134353034616435376631306437633335356639303366666438373939666438373939666438373939663538316337326233616364613534653765396632336118347840363833663531396564613132383661666334336164313230336134653632303463656235613766666666666666663161316139336534653066666666353831631835783b316338393964623861303533396633396463343038666138623164303963323964323134353034616435376631306437633335356639303366662c

  it("should correctly calculate fee without script", async () => {
    const outputAddress = Address.fromBech32(
      "addr1qywgn8dc5pfe7wwugz863vwsns5ay9zsft2h7yxhcd2ljqmjkwkd5488a8er56pl2x0d5y5x4lzr45fq8f8xypxwkknss5gs29",
    );
    const jpgAddress = Address.fromBech32(
      "addr1x8rjw3pawl0kelu4mj3c8x20fsczf5pl744s9mxz9v8n7efvjel5h55fgjcxgchp830r7h2l5msrlpt8262r3nvr8ekstg4qrx",
    );

    const utxos = [
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "F4646E385964A642BEE6CED21115EE6560CB6D7D99302DB89319013A0B5E6419",
          ),
          0n,
        ),
        new TransactionOutput(
          Address.fromBech32(
            "addr1qxjdqrhk950rdmtfrpy09rlwlm3hpg9jnvd66ahwt6nkdhmjkwkd5488a8er56pl2x0d5y5x4lzr45fq8f8xypxwkknstgmy7e",
          ),
          value.makeValue(2_000_000n, [
            "ccb2b25e5fd18224ea931a3812e5888716d9c08cd8871ff0ab3dc2fa456d706f7761466f756e64696e67436f6d6d756e697479383333",
            1n,
          ]),
        ),
      ),
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId(
            "245202665911774b64bd1941f33abd23bcedd7918ccfa141c2c911810df14544",
          ),
          0n,
        ),
        new TransactionOutput(
          Address.fromBech32(
            "addr1qxzvpmq475jnhxjvgjjmwy0zd5z6j0ueucaqaq46vv4gznmjkwkd5488a8er56pl2x0d5y5x4lzr45fq8f8xypxwkkns5mspfr",
          ),
          value.makeValue(973486547n),
        ),
      ),
    ];

    const metadata: Map<bigint, string> = new Map();
    metadata.set(30n, "6");
    metadata.set(
      50n,
      "d8799f9fd8799fd8799fd8799f581c1c899db8a0539f39dc408fa8b1d09c29d2",
    );
    metadata.set(
      51n,
      "14504ad57f10d7c355f903ffd8799fd8799fd8799f581c72b3acda54e7e9f23a",
    );
    metadata.set(
      52n,
      "683f519eda1286afc43ad1203a4e6204ceb5a7ffffffff1a1a93e4e0ffff581c",
    );
    metadata.set(
      53n,
      "1c899db8a0539f39dc408fa8b1d09c29d214504ad57f10d7c355f903ff,",
    );

    const tx = await new TxBuilder(hardCodedProtocolParams)
      .addUnspentOutputs(utxos)
      .lockAssets(
        jpgAddress,
        value.makeValue(1_383_510n, [
          "ccb2b25e5fd18224ea931a3812e5888716d9c08cd8871ff0ab3dc2fa456d706f7761466f756e64696e67436f6d6d756e697479383333",
          1n,
        ]),
        Datum.newDataHash(
          DatumHash(
            "440F5B899C44C58BFD73C3283E8D72601AC39E178F854C2D52A80F9EF6AB2BEC",
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
      .setValidUntil(Slot(180371453))
      .complete();

    expect(tx.body().fee().toString()).toEqual("191857");
  });
});
