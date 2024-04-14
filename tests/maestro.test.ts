import { Address, TransactionOutput, fromHex } from '../packages/translucent-core'
import { Maestro } from '../packages/translucent-query/maestro'
import { TxBuilder } from "../packages/translucent-tx"

let provider = new Maestro({
  network: 'mainnet',
  apiKey: 'ninRUQmqtOwS66rddPStASM6PItD1fa8',
})

setTimeout(async function(){
  const me = Address.fromBech32(
    'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
  )
  const bech = me.toBech32()

  if (bech.__opaqueString == "RewardAccount"){
    throw new Error("wrong address type!")
  }

  const params = await provider.getParameters()
  const utxos = await provider.getUnspentOutputs(me)
  const txBuilder = 
    new TxBuilder(params)
  txBuilder.addUnspentOutputs(utxos)
  txBuilder.setChangeAddress(me)
  txBuilder.addOutput(
    TransactionOutput.fromCore({
      address: bech,
      value: { coins: 5n * 10_000_000n }
    })
  )

  let tx = txBuilder.complete()
  // let tx2 = D.Transaction.from_bytes(fromHex(tx.toCbor()))
  // console.log("completed tx length: ", (tx2.to_bytes().length))
  // console.log("fee should be ", (tx2.to_bytes().length) * params.minFeeCoefficient + params.minFeeConstant)
  console.log(tx.toCbor())
  // console.log(
  //   D.Transaction.from_bytes(fromHex(tx.toCbor())).to_json(),
  // )
})