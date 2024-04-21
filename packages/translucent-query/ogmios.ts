import { Ogmios, TransactionOutputReference, Utxo } from '@cardano-ogmios/schema'
import * as ogmios from '@cardano-ogmios/schema'

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
  CostModels,
  fromHex,
  Credential,
  AddressType,
  PaymentAddress,
  TokenMap,
  PolicyId,
  AssetName,
  Hash32ByteBase16,
  Script,
  PlutusV1Script,
  PlutusV2Script,
  PlutusV3Script,
  NativeScript,
} from '../translucent-core'
import { Provider } from './types'

type OgmiosRequest =
  | Ogmios['SubmitTransaction']
  | Ogmios['QueryLedgerStateConstitution']
  | Ogmios['QueryLedgerStateEpoch']
  | Ogmios['QueryLedgerStateEraStart']
  | Ogmios['QueryLedgerStateEraSummaries']
  | Ogmios['QueryLedgerStateLiveStakeDistribution']
  | Ogmios['QueryLedgerStateProjectedRewards']
  | Ogmios['QueryLedgerStateProposedProtocolParameters']
  | Ogmios['QueryLedgerStateProtocolParameters']
  | Ogmios['QueryLedgerStateRewardAccountSummaries']
  | Ogmios['QueryLedgerStateRewardsProvenance']
  | Ogmios['QueryLedgerStateStakePools']
  | Ogmios['QueryLedgerStateTip']
  | Ogmios['QueryLedgerStateUtxo']
  | Ogmios['QueryNetworkBlockHeight']
  | Ogmios['QueryNetworkGenesisConfiguration']
  | Ogmios['QueryNetworkStartTime']
  | Ogmios['QueryNetworkTip']

type OgmiosResponseOf<A> = 
    A extends Ogmios['SubmitTransaction'] ? Ogmios['SubmitTransactionResponse']
    : A extends Ogmios['QueryLedgerStateConstitution'] ? Ogmios['QueryLedgerStateConstitutionResponse']
    : A extends Ogmios['QueryLedgerStateEpoch'] ? Ogmios['QueryLedgerStateEpochResponse']
    : A extends Ogmios['QueryLedgerStateEraStart'] ? Ogmios['QueryLedgerStateEraStartResponse']
    : A extends Ogmios['QueryLedgerStateEraSummaries'] ? Ogmios['QueryLedgerStateEraSummariesResponse']
    : A extends Ogmios['QueryLedgerStateLiveStakeDistribution'] ? Ogmios['QueryLedgerStateLiveStakeDistributionResponse']
    : A extends Ogmios['QueryLedgerStateProjectedRewards'] ? Ogmios['QueryLedgerStateProjectedRewardsResponse']
    : A extends Ogmios['QueryLedgerStateProposedProtocolParameters'] ? Ogmios['QueryLedgerStateProposedProtocolParametersResponse']
    : A extends Ogmios['QueryLedgerStateProtocolParameters'] ? Ogmios['QueryLedgerStateProtocolParametersResponse']
    : A extends Ogmios['QueryLedgerStateRewardAccountSummaries'] ? Ogmios['QueryLedgerStateRewardAccountSummariesResponse']
    : A extends Ogmios['QueryLedgerStateRewardsProvenance'] ? Ogmios['QueryLedgerStateRewardsProvenanceResponse']
    : A extends Ogmios['QueryLedgerStateStakePools'] ? Ogmios['QueryLedgerStateStakePoolsResponse']
    : A extends Ogmios['QueryLedgerStateTip'] ? Ogmios['QueryLedgerStateTipResponse']
    : A extends Ogmios['QueryLedgerStateUtxo'] ? Ogmios['QueryLedgerStateUtxoResponse']
    : A extends Ogmios['QueryNetworkBlockHeight'] ? Ogmios['QueryNetworkBlockHeightResponse']
    : A extends Ogmios['QueryNetworkGenesisConfiguration'] ? Ogmios['QueryNetworkGenesisConfigurationResponse']
    : A extends Ogmios['QueryNetworkStartTime'] ? Ogmios['QueryNetworkStartTimeResponse']
    : A extends Ogmios['QueryNetworkTip'] ? Ogmios['QueryNetworkTipResponse']
    : never

export class OgmiosProvider implements Provider {
  private url: string
  private apiKey: string
  private params?: ProtocolParameters

  constructor({ network, apiKey }: { network: string; apiKey: string }) {
    this.url = `https://${network}.gomaestro-api.org/v1`
    this.apiKey = apiKey
  }

  private headers() {
    return { 'api-key': this.apiKey }
  }

  private request<RequestType extends OgmiosRequest>(request: RequestType): OgmiosResponseOf<RequestType>{
    // This will end up relying on ogmios guarantees. We can maybe do a short assertion that the methods are equivalent?
    // Perhaps typesafe json parser ... 
    throw new Error("unimplemented!")
  }

  getParameters(): Promise<ProtocolParameters> {
    if (this.params) {
      return Promise.resolve(this.params)
    }
    const request: Ogmios['QueryLedgerStateProtocolParameters'] = {
      jsonrpc: '2.0',
      method: 'queryLedgerState/protocolParameters',
    }
    const rawResponse:
      | Ogmios['QueryLedgerStateProtocolParametersResponse']
      | undefined = this.request(request)
    if (!rawResponse) {
      throw new Error('')
    }
    if (!('response' in rawResponse)) {
      throw new Error(
        `getParameters: Ogmios threw "${rawResponse['error']['message']}"`,
      )
    }
    const response: ogmios.QueryLedgerStateProtocolParametersResponse = rawResponse
    const params = response['result']
    const costModels: CostModels = new Map()
    if (params.plutusCostModels) {
      for (const key of Object.keys(params.plutusCostModels)) {
        let cm = params.plutusCostModels[key]
        let plutusLanguageVersion: PlutusLanguageVersion
        if (key == 'plutus:v1') {
          plutusLanguageVersion = PlutusLanguageVersion.V1
        } else if (key == 'plutus:v2') {
          plutusLanguageVersion = PlutusLanguageVersion.V2
        } else if (key == 'plutus:v3') {
          plutusLanguageVersion = PlutusLanguageVersion.V3
        } else {
          throw new Error(
            'getParameters: Ogmios response unknown Plutus language version!',
          )
        }
        costModels.set(plutusLanguageVersion, cm)
      }
    } else {
      throw new Error(
        'getParameters: Ogmios response missing Plutus cost models!',
      )
    }
    if (!params.maxTransactionSize) {
      throw new Error(
        'getParameters: Ogmios response missing maxTransactionSize!',
      )
    }
    if (!params.maxValueSize) {
      throw new Error('getParameters: Ogmios response missing maxValueSize!')
    }
    if (!params.collateralPercentage) {
      throw new Error(
        'getParameters: Ogmios response missing collateralPercentage!',
      )
    }
    if (!params.maxCollateralInputs) {
      throw new Error(
        'getParameters: Ogmios response missing maxCollateralInputs!',
      )
    }
    if (!params.scriptExecutionPrices) {
      throw new Error(
        'getParameters: Ogmios response missing scriptExecutionPrices!',
      )
    }
    if (!params.maxExecutionUnitsPerTransaction) {
      throw new Error(
        'getParameters: Ogmios response missing maxExecutionUnitsPerTransaction!',
      )
    }
    if (!params.maxExecutionUnitsPerBlock) {
      throw new Error(
        'getParameters: Ogmios response missing maxExecutionUnitsPerBlock!',
      )
    }
    let protocolVersion: ProtocolParameters['protocolVersion'] = {
      major: params.version.major,
      minor: params.version.minor,
      patch: params.version.patch,
    }
    return Promise.resolve({
      coinsPerUtxoByte: params.minUtxoDepositCoefficient,
      maxTxSize: params.maxTransactionSize.bytes,
      minFeeCoefficient: params.minFeeCoefficient,
      minFeeConstant: Number(params.minFeeConstant.ada.lovelace),
      maxBlockBodySize: params.maxBlockBodySize.bytes,
      maxBlockHeaderSize: params.maxBlockHeaderSize.bytes,
      stakeKeyDeposit: Number(params.stakeCredentialDeposit.ada.lovelace),
      poolDeposit: Number(params.stakePoolDeposit.ada.lovelace),
      poolRetirementEpochBound: params.stakePoolRetirementEpochBound,
      desiredNumberOfPools: params.desiredNumberOfStakePools,
      poolInfluence: params.stakePoolPledgeInfluence,
      monetaryExpansion: params.monetaryExpansion,
      treasuryExpansion: params.treasuryExpansion,
      minPoolCost: Number(params.minStakePoolCost.ada.lovelace),
      protocolVersion,
      maxValueSize: params.maxValueSize.bytes,
      collateralPercentage: params.collateralPercentage / 100,
      maxCollateralInputs: params.maxCollateralInputs,
      costModels: costModels,
      prices: {
        memory: parseFloat(params.scriptExecutionPrices.memory) / 10000,
        steps: parseFloat(params.scriptExecutionPrices.cpu) / 10000,
      },
      maxExecutionUnitsPerTransaction: {
        memory: params.maxExecutionUnitsPerTransaction.memory,
        steps: params.maxExecutionUnitsPerTransaction.cpu,
      },
      maxExecutionUnitsPerBlock: {
        memory: params.maxExecutionUnitsPerBlock.memory,
        steps: params.maxExecutionUnitsPerBlock.cpu,
      },
    })
  }

  getUnspentOutputs(
    address: Address | Credential,
  ): Promise<TransactionUnspentOutput[]> {
    // const request: Ogmios["QueryLedgerStateUtxo"] = {
    //     jsonrpc: "2.0",
    //     method: "queryLedgerState/utxo",
    //     params: {
    //         addresses: 
    //     }
    // }
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {}

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {}

  async resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    const mappedOrefs: TransactionOutputReference[] = txIns.map((x)=>({transaction: {id: x.transactionId()}, index: Number(x.index())}))
    const request: Ogmios["QueryLedgerStateUtxo"] = {
        jsonrpc: "2.0",
        method: "queryLedgerState/utxo",
        params: {
            outputReferences: mappedOrefs
        }
    }
    const rawResponse: Ogmios["QueryLedgerStateUtxoResponse"] | undefined = this.request(request)
    if (!rawResponse) {
        throw new Error('')
    }
    const response = (rawResponse as Ogmios["QueryLedgerStateUtxoResponse"])
    if (!('result' in response)){
        throw new Error('resolveUnspentOutputs: Ogmios query did not respond any UTxOs')
    }
    return Promise.resolve(response.result.map(fromOgmiosUTxO))
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {}

  async awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {}

  postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    const request: Ogmios["SubmitTransaction"] = {
        jsonrpc: "2.0",
        method: "submitTransaction",
        params: {
            transaction: {
                cbor: tx.toCbor()
            }
        }
    }
    const rawResponse: Ogmios["SubmitTransactionResponse"] | undefined = this.request(request)
    if (!rawResponse) {
        throw new Error('postTransactionToChain: No response!')
    }
    const response = (rawResponse as Ogmios["SubmitTransactionResponse"])
    if (!('result' in response)){
        throw new Error(`postTransactionToChain: Ogmios error! ${response.error.message}`)
    }
    return Promise.resolve(TransactionId(response.result.transaction.id))
  }
}

function fromOgmiosUTxO(utxo: Utxo[number]): TransactionUnspentOutput {
    const tokenMap: TokenMap = new Map()
    let tokenMapEmpty = true
    for (const policy of Object.keys(utxo.value)){
        for (const assetName of (Object.keys(utxo.value[policy]))){
            tokenMap.set(AssetId.fromParts(PolicyId(policy), AssetName(assetName)), utxo.value[policy][assetName])
            tokenMapEmpty = false
        }
    }
    let script: Script | undefined
    if (utxo.script){
        if (utxo.script.language == 'plutus:v1') {
            script = Script.newPlutusV1Script(PlutusV1Script.fromCbor(HexBlob(utxo.script.cbor)))
        } else if (utxo.script.language == 'plutus:v2') {
            script = Script.newPlutusV2Script(PlutusV2Script.fromCbor(HexBlob(utxo.script.cbor)))
        } else if (utxo.script.language == 'plutus:v3') {
            script = Script.newPlutusV3Script(PlutusV3Script.fromCbor(HexBlob(utxo.script.cbor)))
        } else {
            // todo: convert script native manually if there is no cbor!
            script = Script.newNativeScript(NativeScript.fromCbor(HexBlob(utxo.script.cbor!)))
        }
    }
    return TransactionUnspentOutput.fromCore([
        {txId: TransactionId(utxo.transaction.id), index: utxo.index},
        {
            address: PaymentAddress(utxo.address),
            value: {
                coins: BigInt(utxo.value.ada.lovelace),
                assets: tokenMapEmpty ? undefined : tokenMap
            },
            datum: utxo.datum ? PlutusData.fromCbor(HexBlob(utxo.datum)).toCore() : undefined, 
            datumHash: utxo.datumHash ? Hash32ByteBase16(utxo.datumHash) : undefined, 
            scriptReference: script?.toCore()
        }
    ])
}