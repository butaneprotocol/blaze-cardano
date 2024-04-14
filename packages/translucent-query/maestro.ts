import {
  TransactionUnspentOutput,
  Address,
  AssetId,
  TransactionInput,
  DatumHash,
  PlutusData,
  TransactionId,
  Transaction,
  TransactionOutput,
  HexBlob,
} from '../translucent-core'
import { Provider } from './types'

export class Maestro implements Provider {
  private url: string
  private apiKey: string

  constructor({ network, apiKey }: { network: string; apiKey: string }) {
    this.url = `https://${network}.gomaestro-api.org/v1`
    this.apiKey = apiKey
  }

  private headers() {
    return { "api-key": this.apiKey };
  }

  getParameters(): Promise<typeof TxParams> {}

  getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]> {
    /* todo: paginate */
    const query = `/addresses/${address.toBech32()}/utxos?with_cbor=true&count=100`
    return fetch(`${this.url}${query}`, {headers: this.headers()})
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          let response = json as MaestroResponse<MaestroUTxOResponse>
          if ('message' in response){
            throw new Error(`getUnspentOutputs: Maestro threw "${response.message}"`)
          }
          let utxos: TransactionUnspentOutput[] = []
          for (const maestroUTxO of response.data) {
            let txIn = new TransactionInput(
              TransactionId(maestroUTxO.tx_hash),
              BigInt(maestroUTxO.index)
            )
            let txOut = TransactionOutput.fromCbor(
              HexBlob(maestroUTxO.txout_cbor),
            )
            utxos.push(new TransactionUnspentOutput(txIn, txOut))
          }
          return utxos
        }
        throw new Error("getUnspentOutputs: Could not parse response json")
      })
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    throw new Error("unimplemented")
  }

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
    throw new Error("unimplemented")
  }

  resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    throw new Error("unimplemented")
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    throw new Error("unimplemented")
  }

  awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {
    throw new Error("unimplemented")
  }

  postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    throw new Error("unimplemented")
  }
}

type MaestroResponse<SomeResponse> = SomeResponse | { message: string }

interface MaestroUTxOResponse {
  data: MaestroTransaction[]
  last_updated: LastUpdated
  next_cursor: null
}

interface MaestroTransaction {
  tx_hash: string
  index: number
  slot: number
  txout_cbor: string
}

interface LastUpdated {
  timestamp: string
  block_hash: string
  block_slot: number
}

/*

curl -L -X GET 'https://mainnet.gomaestro-api.org/v1/addresses/addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4/utxos?with_cbor=true' \
-H 'Accept: application/json' \
-H 'api-key: ninRUQmqtOwS66rddPStASM6PItD1fa8'

*/
