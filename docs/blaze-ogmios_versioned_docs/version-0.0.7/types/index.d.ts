import * as Schema from '@cardano-ogmios/schema';
import WebSocket from 'isomorphic-ws';

/**
 * Ogmios class.
 * @remarks
 * This class is currently unimplemented.
 */
export declare class Ogmios {
}

declare class Ogmios_2 {
    url: string;
    private ws;
    private requests;
    private constructor();
    private setupEventListeners;
    static new(url: string): Promise<Ogmios_2>;
    static fromDemeter(network: `mainnet` | `preview`, apiKey: `dmtr_ogmios${string}`, region: `ogmios-m1`): Promise<Ogmios_2>;
    private static generateId;
    request<T extends {
        params: object;
    }, R extends {
        result: any;
    } | {
        error: object;
    }>(method: string, params: T["params"]): Promise<Extract<R, "result">>;
    connect(): WebSocket;
    kill(): Promise<void>;
    findIntersection(points?: Schema.PointOrOrigin[]): Promise<Schema.IntersectionFound["result"]>;
    nextBlock(): Promise<Schema.NextBlockResponse["result"]>;
    submitTransaction(transaction: {
        cbor: string;
    }): Promise<Schema.SubmitTransactionSuccess["result"]>;
    evaluateTransaction(transaction: {
        cbor: string;
    }, additionalUtxos?: Schema.Utxo): Promise<Schema.EvaluateTransactionSuccess["result"]>;
    acquireLedgerState(point: Schema.PointOrOrigin): Promise<Schema.AcquireLedgerStateSuccess["result"]>;
    releaseLedgerState(): Promise<Schema.ReleaseLedgerStateResponse["result"]>;
    queryLedgerStateConstitution(): Promise<Schema.QueryLedgerStateConstitutionResponse["result"]>;
    queryLedgerStateConstitutionalCommittee(): Promise<Schema.QueryLedgerStateConstitutionalCommitteeResponse["result"]>;
    queryLedgerStateEpoch(): Promise<Schema.QueryLedgerStateEpochResponse["result"]>;
    queryLedgerStateEraStart(): Promise<Schema.QueryLedgerStateEraStartResponse["result"]>;
    queryLedgerStateEraSummaries(): Promise<Schema.QueryLedgerStateEraSummariesResponse["result"]>;
    queryLedgerStateLiveStakeDistribution(): Promise<Schema.QueryLedgerStateLiveStakeDistributionResponse["result"]>;
    queryLedgerStateProjectedRewards(params: {
        stake?: Schema.ValueAdaOnly[];
        scripts?: Schema.AnyStakeCredential[];
        keys?: Schema.AnyStakeCredential[];
    }): Promise<Schema.QueryLedgerStateProjectedRewardsResponse["result"]>;
    queryLedgerStateProposedProtocolParameters(): Promise<Schema.QueryLedgerStateProposedProtocolParametersResponse["result"]>;
    queryLedgerStateProtocolParameters(): Promise<Schema.QueryLedgerStateProtocolParametersResponse["result"]>;
    queryLedgerStateRewardAccountSummaries(params: {
        scripts?: Schema.AnyStakeCredential[];
        keys?: Schema.AnyStakeCredential[];
    }): Promise<Schema.QueryLedgerStateRewardAccountSummariesResponse["result"]>;
    queryLedgerStateRewardsProvenance(): Promise<Schema.QueryLedgerStateRewardsProvenanceResponse["result"]>;
    queryLedgerStateStakePools(params?: {
        stakePools: {
            id: Schema.StakePoolId;
        }[];
    }): Promise<Schema.QueryLedgerStateStakePoolsResponse["result"]>;
    queryLedgerStateTip(): Promise<Schema.QueryLedgerStateTipResponse["result"]>;
    queryLedgerStateTreasuryAndReserves(): Promise<Schema.QueryLedgerStateTreasuryAndReservesResponse["result"]>;
    queryLedgerStateUtxo(params?: Schema.UtxoByOutputReferences | Schema.UtxoByAddresses | Schema.WholeUtxo): Promise<Schema.QueryLedgerStateUtxoResponse["result"]>;
    queryNetworkBlockHeight(): Promise<Schema.QueryNetworkBlockHeightResponse["result"]>;
    queryNetworkGenesisConfiguration(params: {
        era: Schema.EraWithGenesis;
    }): Promise<Schema.QueryNetworkGenesisConfigurationResponse["result"]>;
    queryNetworkStartTime(): Promise<Schema.QueryNetworkStartTimeResponse["result"]>;
    queryNetworkTip(): Promise<Schema.QueryNetworkTipResponse["result"]>;
    acquireMempool(): Promise<Schema.AcquireMempoolResponse["result"]>;
    nextTransaction(params?: {
        fields?: "all";
    }): Promise<Schema.NextTransactionResponse["result"]>;
    hasTransaction(params: {
        id: Schema.TransactionId;
    }): Promise<Schema.HasTransactionResponse["result"]>;
    sizeOfMempool(): Promise<Schema.SizeOfMempoolResponse["result"]>;
    releaseMempool(): Promise<Schema.ReleaseMempoolResponse["result"]>;
}

export { Schema }

export declare namespace Unwrapped {
    export {
        Ogmios_2 as Ogmios
    }
}

export { }
