import WebSocket from "isomorphic-ws";
import type { Schema as schema } from "./schema";
export declare class Ogmios {
    url: string;
    private ws;
    private requests;
    private constructor();
    private setupEventListeners;
    static new(url: string): Promise<Ogmios>;
    static fromDemeter(network: `mainnet` | `preview`, apiKey: `dmtr_ogmios${string}`, region: `ogmios-m1`): Promise<Ogmios>;
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
    findIntersection(points?: schema.PointOrOrigin[]): Promise<schema.IntersectionFound["result"]>;
    nextBlock(): Promise<schema.NextBlockResponse["result"]>;
    submitTransaction(transaction: {
        cbor: string;
    }): Promise<schema.SubmitTransactionSuccess["result"]>;
    evaluateTransaction(transaction: {
        cbor: string;
    }, additionalUtxos?: schema.Utxo): Promise<schema.EvaluateTransactionSuccess["result"]>;
    acquireLedgerState(point: schema.PointOrOrigin): Promise<schema.AcquireLedgerStateSuccess["result"]>;
    releaseLedgerState(): Promise<schema.ReleaseLedgerStateResponse["result"]>;
    queryLedgerStateConstitution(): Promise<schema.QueryLedgerStateConstitutionResponse["result"]>;
    queryLedgerStateConstitutionalCommittee(): Promise<schema.QueryLedgerStateConstitutionalCommitteeResponse["result"]>;
    queryLedgerStateEpoch(): Promise<schema.QueryLedgerStateEpochResponse["result"]>;
    queryLedgerStateEraStart(): Promise<schema.QueryLedgerStateEraStartResponse["result"]>;
    queryLedgerStateEraSummaries(): Promise<schema.QueryLedgerStateEraSummariesResponse["result"]>;
    queryLedgerStateLiveStakeDistribution(): Promise<schema.QueryLedgerStateLiveStakeDistributionResponse["result"]>;
    queryLedgerStateProjectedRewards(params: {
        stake?: schema.ValueAdaOnly[];
        scripts?: schema.AnyStakeCredential[];
        keys?: schema.AnyStakeCredential[];
    }): Promise<schema.QueryLedgerStateProjectedRewardsResponse["result"]>;
    queryLedgerStateProposedProtocolParameters(): Promise<schema.QueryLedgerStateProposedProtocolParametersResponse["result"]>;
    queryLedgerStateProtocolParameters(): Promise<schema.QueryLedgerStateProtocolParametersResponse["result"]>;
    queryLedgerStateRewardAccountSummaries(params: {
        scripts?: schema.AnyStakeCredential[];
        keys?: schema.AnyStakeCredential[];
    }): Promise<schema.QueryLedgerStateRewardAccountSummariesResponse["result"]>;
    queryLedgerStateRewardsProvenance(): Promise<schema.QueryLedgerStateRewardsProvenanceResponse["result"]>;
    queryLedgerStateStakePools(params?: {
        stakePools: {
            id: schema.StakePoolId;
        }[];
    }): Promise<schema.QueryLedgerStateStakePoolsResponse["result"]>;
    queryLedgerStateTip(): Promise<schema.QueryLedgerStateTipResponse["result"]>;
    queryLedgerStateTreasuryAndReserves(): Promise<schema.QueryLedgerStateTreasuryAndReservesResponse["result"]>;
    queryLedgerStateUtxo(params?: schema.UtxoByOutputReferences | schema.UtxoByAddresses | schema.WholeUtxo): Promise<schema.QueryLedgerStateUtxoResponse["result"]>;
    queryNetworkBlockHeight(): Promise<schema.QueryNetworkBlockHeightResponse["result"]>;
    queryNetworkGenesisConfiguration(params: {
        era: schema.EraWithGenesis;
    }): Promise<schema.QueryNetworkGenesisConfigurationResponse["result"]>;
    queryNetworkStartTime(): Promise<schema.QueryNetworkStartTimeResponse["result"]>;
    queryNetworkTip(): Promise<schema.QueryNetworkTipResponse["result"]>;
    acquireMempool(): Promise<schema.AcquireMempoolResponse["result"]>;
    nextTransaction(params?: {
        fields?: "all";
    }): Promise<schema.NextTransactionResponse["result"]>;
    hasTransaction(params: {
        id: schema.TransactionId;
    }): Promise<schema.HasTransactionResponse["result"]>;
    sizeOfMempool(): Promise<schema.SizeOfMempoolResponse["result"]>;
    releaseMempool(): Promise<schema.ReleaseMempoolResponse["result"]>;
}
//# sourceMappingURL=unwrapped.d.ts.map