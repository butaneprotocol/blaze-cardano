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
  ProtocolParameters,
  PlutusLanguageVersion,
  CostModels
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

  getParameters(): Promise<ProtocolParameters> {
    const query = `/protocol-params`
    return fetch(`${this.url}${query}`, {headers: this.headers()})
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          const response = json as MaestroResponse<MaestroProtocolParametersResponse>
          if ('message' in response){
            throw new Error(`getUnspentOutputs: Maestro threw "${response.message}"`)
          }
          const params = response.data
          const costModels: CostModels = new Map()
          for (const cm of Object.keys(params.cost_models) as MaestroLanguageVersions[]){
            let costModel: number[] = []
            let keys = Object.keys(params.cost_models[cm]).sort()
            for (const key of keys){
                costModel.push(params.cost_models[cm][key])
            }
            costModels.set(fromMaestroLanguageVersion(cm), costModel)
          }
          return {
            coinsPerUtxoByte: params.coins_per_utxo_byte,
            maxTxSize: params.max_tx_size,
            minFeeCoefficient: params.min_fee_coefficient,
            minFeeConstant: params.min_fee_constant,
            maxBlockBodySize: params.max_block_body_size,
            maxBlockHeaderSize: params.max_block_header_size,
            stakeKeyDeposit: params.stake_key_deposit,
            poolDeposit: params.pool_deposit,
            poolRetirementEpochBound: params.pool_retirement_epoch_bound,
            desiredNumberOfPools: params.desired_number_of_pools,
            poolInfluence: params.pool_influence,
            monetaryExpansion: params.monetary_expansion,
            treasuryExpansion: params.treasury_expansion,
            minPoolCost: params.min_pool_cost,
            protocolVersion: params.protocol_version,
            maxValueSize: params.max_value_size,
            collateralPercentage: params.collateral_percentage,
            maxCollateralInputs: params.max_collateral_inputs,
            costModels: costModels,
            prices: {
                memory: parseFloat(params.prices.memory),
                steps: parseFloat(params.prices.steps)
            },
            maxExecutionUnitsPerTransaction: params.max_execution_units_per_transaction,
            maxExecutionUnitsPerBlock: params.max_execution_units_per_block,
        }
        }
        throw new Error("getUnspentOutputs: Could not parse response json");
      })
  }

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

type MaestroLanguageVersions = "plutus:v1" | "plutus:v2"
const fromMaestroLanguageVersion = (x: MaestroLanguageVersions): PlutusLanguageVersion => {
    if (x == "plutus:v1"){
        return PlutusLanguageVersion.V1
    }else if (x=="plutus:v2"){
        return PlutusLanguageVersion.V2
    }
    throw new Error("fromMaestroLanguageVersion: Unreachable!")
}

interface MaestroProtocolParametersResponse {
    data: {
      min_fee_coefficient: number;
      min_fee_constant: number;
      max_block_body_size: number;
      max_block_header_size: number;
      max_tx_size: number;
      stake_key_deposit: number;
      pool_deposit: number;
      pool_retirement_epoch_bound: number;
      desired_number_of_pools: number;
      pool_influence: string;
      monetary_expansion: string;
      treasury_expansion: string;
      protocol_version: {
        major: number;
        minor: number;
      };
      min_pool_cost: number;
      coins_per_utxo_byte: number;
      cost_models: Record<MaestroLanguageVersions, {[key: string]: number}>;
      prices: {
        memory: string;
        steps: string;
      };
      max_execution_units_per_transaction: {
        memory: number;
        steps: number;
      };
      max_execution_units_per_block: {
        memory: number;
        steps: number;
      };
      max_value_size: number;
      collateral_percentage: number;
      max_collateral_inputs: number;
    };
    last_updated: MaestroLastUpdated;
  }

type MaestroResponse<SomeResponse> = SomeResponse | { message: string }

interface MaestroUTxOResponse {
  data: MaestroTransaction[]
  last_updated: MaestroLastUpdated
  next_cursor: null
}

interface MaestroTransaction {
  tx_hash: string
  index: number
  slot: number
  txout_cbor: string
}

interface MaestroLastUpdated {
  timestamp: string
  block_hash: string
  block_slot: number
}