import {
  Address,
  TransactionOutput,
  fromHex,
  getPaymentAddress,
  Hash32ByteBase16,
  HexBlob,
  TransactionId,
  TransactionInput,
} from "../packages/translucent-core";
import { Maestro } from "../packages/translucent-query/maestro";
import { TxBuilder } from "../packages/translucent-tx";

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
  const me = Address.fromBech32(
    "addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4",
  );

  const params = await provider.getParameters();
  const utxos = await provider.getUnspentOutputs(me);
  const tx = new TxBuilder(params)
    .addUnspentOutputs(utxos)
    .setChangeAddress(me)
    .addOutput(
      TransactionOutput.fromCore({
        address: getPaymentAddress(me),
        value: { coins: 5n * 10_000_000n },
      }),
    )
    .complete();

  console.log(tx.toCbor());

  let tx2 = D.Transaction.from_bytes(fromHex(tx.toCbor()))
  console.log("completed tx length: ", (tx2.to_bytes().length))
  console.log("fee should be ", (tx2.to_bytes().length) * params.minFeeCoefficient + params.minFeeConstant)
  console.log(
    D.Transaction.from_bytes(fromHex(tx.toCbor())).to_json(),
  )
});
