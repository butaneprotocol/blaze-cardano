import {
  fromHex,
  TransactionId,
  TransactionInput,
  addressFromBech32,
} from "../packages/blaze-core";
import { Maestro } from "../packages/blaze-query/maestro";
import { TxBuilder, makeValue } from "../packages/blaze-tx";

let provider = new Maestro({
  network: "mainnet",
  apiKey: "ninRUQmqtOwS66rddPStASM6PItD1fa8",
});

setTimeout(async function () {
  //console.log((await provider.resolveDatum(Hash32ByteBase16("7cb164c5028acac42979c86a3e8aee0c516cdaa077a3e90e56a4334db8898440"))).toCore())
  console.log(
    (
      await provider.resolveUnspentOutputs([
        new TransactionInput(
          TransactionId(
            "c23aba98fe2ae4544caf0d264453a3fc61aa2bb92a76b9572a51ba0dde9649f3",
          ),
          0n,
        ),
        new TransactionInput(
          TransactionId(
            "c23aba98fe2ae4544caf0d264453a3fc61aa2bb92a76b9572a51ba0dde9649f3",
          ),
          1n,
        ),
      ])
    ).map((x) => x.toCore()),
  );
  const me = addressFromBech32(
    "addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4",
  );

  const params = await provider.getParameters();
  const utxos = await provider.getUnspentOutputs(me);
  const tx = await new TxBuilder(params)
    .addUnspentOutputs(utxos)
    .setChangeAddress(me)
    .payLovelace(me, 5n * 10_000_000n)
    .payAssets(
      me,
      makeValue(
        0n,
        [
          "016be5325fd988fea98ad422fcfd53e5352cacfced5c106a932a35a442544e",
          10_000_000n,
        ],
        [
          "e52964af4fffdb54504859875b1827b60ba679074996156461143dc14f5054494d",
          10_000_000n,
        ],
      ),
    )
    .complete();

  console.log(tx.toCbor());

  let tx2 = D.Transaction.from_bytes(fromHex(tx.toCbor()));
  console.log("completed tx length: ", tx2.to_bytes().length);
  console.log(
    "fee should be ",
    tx2.to_bytes().length * params.minFeeCoefficient + params.minFeeConstant,
  );
  console.log(D.Transaction.from_bytes(fromHex(tx.toCbor())).to_json());
});
