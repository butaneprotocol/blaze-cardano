import {
  Address,
  TransactionOutput,
  fromHex,
  getPaymentAddress,
} from '../packages/translucent-core'
import { Maestro } from '../packages/translucent-query/maestro'
import { TxBuilder } from '../packages/translucent-tx'

let provider = new Maestro({
  network: 'mainnet',
  apiKey: 'ninRUQmqtOwS66rddPStASM6PItD1fa8',
})

setTimeout(async function () {
  const me = Address.fromBech32(
    'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
  )

  const params = await provider.getParameters()
  const utxos = await provider.getUnspentOutputs(me)
  const tx = new TxBuilder(params)
    .addUnspentOutputs(utxos)
    .setChangeAddress(me)
    .addOutput(
      TransactionOutput.fromCore({
        address: getPaymentAddress(me),
        value: { coins: 5n * 10_000_000n },
      }),
    )
    .complete()

  console.log(tx.toCbor())

  // let tx2 = D.Transaction.from_bytes(fromHex(tx.toCbor()))
  // console.log("completed tx length: ", (tx2.to_bytes().length))
  // console.log("fee should be ", (tx2.to_bytes().length) * params.minFeeCoefficient + params.minFeeConstant)
  // console.log(
  //   D.Transaction.from_bytes(fromHex(tx.toCbor())).to_json(),
  // )
})
