import { Address } from '../packages/translucent-core'
import { Maestro } from '../packages/translucent-query/maestro'

let provider = new Maestro({
  network: 'mainnet',
  apiKey: 'ninRUQmqtOwS66rddPStASM6PItD1fa8',
})

let address = Address.fromBech32(
  'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
)

provider.getUnspentOutputs(address).then((x)=>console.log(x.map((y)=>y.toCore())))
