import WebSocket from "isomorphic-ws";
import type { Schema as schema } from "./schema";

export class Ogmios {
  url: string;
  private ws: WebSocket;
  private requests: Record<
    string,
    { resolve: (value: any) => void; reject: (reason: any) => void }
  > = {};

  private constructor(url: string) {
    this.url = url;
    this.ws = new WebSocket(this.url);
  }

  private async setupEventListeners(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => {
        resolve();
      };

      this.ws.onmessage = (event) => {
        const messageText =
          typeof event.data === "string"
            ? event.data
            : event.data.toString("utf-8");
        const parsedMessage = JSON.parse(messageText);

        if (parsedMessage.id && parsedMessage.id in this.requests) {
          const { resolve, reject } = this.requests[parsedMessage.id]!;
          if (parsedMessage.error) {
            reject(new Error(JSON.stringify(parsedMessage.error)));
          } else {
            resolve(parsedMessage.result);
          }
          delete this.requests[parsedMessage.id];
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      };
    });
  }

  public static async new(url: string): Promise<Ogmios> {
    const instance = new Ogmios(url);
    await instance.setupEventListeners();
    return instance;
  }

  public static async fromDemeter(
    network: `mainnet` | `preview`,
    apiKey: `dmtr_ogmios${string}`,
    region: `ogmios-m1`,
  ): Promise<Ogmios> {
    const url = `wss://${apiKey}.${network}-v6.${region}.demeter.run`;
    return Ogmios.new(url);
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }

  async request<
    T extends { params: object },
    R extends { result: any } | { error: object },
  >(method: string, params: T["params"]) {
    if (this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection not open");
    }
    const id = Ogmios.generateId();
    return new Promise<Extract<R, "result">>((resolve, reject) => {
      this.ws.send(
        JSON.stringify(
          { jsonrpc: "2.0", method, params, id },
          (_key, value) => {
            if (typeof value === "bigint") {
              return Number(value);
            }
            return value;
          },
        ),
      );
      this.requests[id] = { resolve, reject };
    });
  }

  public connect(): WebSocket {
    return this.ws;
  }

  public kill(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.ws) {
        this.ws.close();
        this.ws.onclose = (event) => {
          console.log("WebSocket connection closed:", event);
          // Clear any pending requests
          this.requests = {};
        };
      } else {
        // If there's no WebSocket, resolve immediately
        resolve();
      }
    });
  }

  async findIntersection(
    points?: schema.PointOrOrigin[],
  ): Promise<schema.IntersectionFound["result"]> {
    return this.request<
      schema.FindIntersection,
      schema.Ogmios["FindIntersectionResponse"]
    >("findIntersection", { points });
  }

  async nextBlock(): Promise<schema.NextBlockResponse["result"]> {
    return this.request<any, schema.Ogmios["NextBlockResponse"]>(
      "nextBlock",
      {},
    );
  }

  // Transaction Submission API
  async submitTransaction(transaction: {
    cbor: string;
  }): Promise<schema.SubmitTransactionSuccess["result"]> {
    return this.request<
      schema.SubmitTransaction,
      schema.Ogmios["SubmitTransactionResponse"]
    >("submitTransaction", { transaction });
  }

  // Transaction Evaluation API
  async evaluateTransaction(
    transaction: { cbor: string },
    additionalUtxos?: schema.Utxo,
  ): Promise<schema.EvaluateTransactionSuccess["result"]> {
    return this.request<
      schema.EvaluateTransaction,
      schema.Ogmios["EvaluateTransactionResponse"]
    >("evaluateTransaction", { transaction, additionalUtxo: additionalUtxos });
  }

  // State Query API
  async acquireLedgerState(
    point: schema.PointOrOrigin,
  ): Promise<schema.AcquireLedgerStateSuccess["result"]> {
    return this.request<
      schema.AcquireLedgerState,
      schema.Ogmios["AcquireLedgerStateResponse"]
    >("acquireLedgerState", { point });
  }

  async releaseLedgerState(): Promise<
    schema.ReleaseLedgerStateResponse["result"]
  > {
    return this.request<any, schema.Ogmios["ReleaseLedgerStateResponse"]>(
      "releaseLedgerState",
      {},
    );
  }

  async queryLedgerStateConstitution(): Promise<
    schema.QueryLedgerStateConstitutionResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateConstitutionResponse"]
    >("queryLedgerState/constitution", {});
  }

  async queryLedgerStateConstitutionalCommittee(): Promise<
    schema.QueryLedgerStateConstitutionalCommitteeResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateConstitutionalCommitteeResponse"]
    >("queryLedgerState/constitutionalCommittee", {});
  }

  async queryLedgerStateEpoch(): Promise<
    schema.QueryLedgerStateEpochResponse["result"]
  > {
    return this.request<any, schema.Ogmios["QueryLedgerStateEpochResponse"]>(
      "queryLedgerState/epoch",
      {},
    );
  }

  async queryLedgerStateEraStart(): Promise<
    schema.QueryLedgerStateEraStartResponse["result"]
  > {
    return this.request<any, schema.Ogmios["QueryLedgerStateEraStartResponse"]>(
      "queryLedgerState/eraStart",
      {},
    );
  }

  async queryLedgerStateEraSummaries(): Promise<
    schema.QueryLedgerStateEraSummariesResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateEraSummariesResponse"]
    >("queryLedgerState/eraSummaries", {});
  }

  async queryLedgerStateLiveStakeDistribution(): Promise<
    schema.QueryLedgerStateLiveStakeDistributionResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateLiveStakeDistributionResponse"]
    >("queryLedgerState/liveStakeDistribution", {});
  }

  async queryLedgerStateProjectedRewards(params: {
    stake?: schema.ValueAdaOnly[];
    scripts?: schema.AnyStakeCredential[];
    keys?: schema.AnyStakeCredential[];
  }): Promise<schema.QueryLedgerStateProjectedRewardsResponse["result"]> {
    return this.request<
      schema.QueryLedgerStateProjectedRewards,
      schema.Ogmios["QueryLedgerStateProjectedRewardsResponse"]
    >("queryLedgerState/projectedRewards", params);
  }

  async queryLedgerStateProposedProtocolParameters(): Promise<
    schema.QueryLedgerStateProposedProtocolParametersResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateProposedProtocolParametersResponse"]
    >("queryLedgerState/proposedProtocolParameters", {});
  }

  async queryLedgerStateProtocolParameters(): Promise<
    schema.QueryLedgerStateProtocolParametersResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateProtocolParametersResponse"]
    >("queryLedgerState/protocolParameters", {});
  }

  async queryLedgerStateRewardAccountSummaries(params: {
    scripts?: schema.AnyStakeCredential[];
    keys?: schema.AnyStakeCredential[];
  }): Promise<schema.QueryLedgerStateRewardAccountSummariesResponse["result"]> {
    return this.request<
      schema.QueryLedgerStateRewardAccountSummaries,
      schema.Ogmios["QueryLedgerStateRewardAccountSummariesResponse"]
    >("queryLedgerState/rewardAccountSummaries", params);
  }

  async queryLedgerStateRewardsProvenance(): Promise<
    schema.QueryLedgerStateRewardsProvenanceResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateRewardsProvenanceResponse"]
    >("queryLedgerState/rewardsProvenance", {});
  }

  async queryLedgerStateStakePools(params?: {
    stakePools: { id: schema.StakePoolId }[];
  }): Promise<schema.QueryLedgerStateStakePoolsResponse["result"]> {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateStakePoolsResponse"]
    >("queryLedgerState/stakePools", params);
  }

  async queryLedgerStateTip(): Promise<
    schema.QueryLedgerStateTipResponse["result"]
  > {
    return this.request<any, schema.Ogmios["QueryLedgerStateTipResponse"]>(
      "queryLedgerState/tip",
      {},
    );
  }

  async queryLedgerStateTreasuryAndReserves(): Promise<
    schema.QueryLedgerStateTreasuryAndReservesResponse["result"]
  > {
    return this.request<
      any,
      schema.Ogmios["QueryLedgerStateTreasuryAndReservesResponse"]
    >("queryLedgerState/treasuryAndReserves", {});
  }

  async queryLedgerStateUtxo(
    params?:
      | schema.UtxoByOutputReferences
      | schema.UtxoByAddresses
      | schema.WholeUtxo,
  ): Promise<schema.QueryLedgerStateUtxoResponse["result"]> {
    return this.request<any, schema.Ogmios["QueryLedgerStateUtxoResponse"]>(
      "queryLedgerState/utxo",
      params,
    );
  }

  // Network Query API
  async queryNetworkBlockHeight(): Promise<
    schema.QueryNetworkBlockHeightResponse["result"]
  > {
    return this.request<any, schema.Ogmios["QueryNetworkBlockHeightResponse"]>(
      "queryNetwork/blockHeight",
      {},
    );
  }

  async queryNetworkGenesisConfiguration(params: {
    era: schema.EraWithGenesis;
  }): Promise<schema.QueryNetworkGenesisConfigurationResponse["result"]> {
    return this.request<
      schema.QueryNetworkGenesisConfiguration,
      schema.Ogmios["QueryNetworkGenesisConfigurationResponse"]
    >("queryNetwork/genesisConfiguration", params);
  }

  async queryNetworkStartTime(): Promise<
    schema.QueryNetworkStartTimeResponse["result"]
  > {
    return this.request<any, schema.Ogmios["QueryNetworkStartTimeResponse"]>(
      "queryNetwork/startTime",
      {},
    );
  }

  async queryNetworkTip(): Promise<schema.QueryNetworkTipResponse["result"]> {
    return this.request<any, schema.Ogmios["QueryNetworkTipResponse"]>(
      "queryNetwork/tip",
      {},
    );
  }

  // Local State Query API
  async acquireMempool(): Promise<schema.AcquireMempoolResponse["result"]> {
    return this.request<any, schema.Ogmios["AcquireMempoolResponse"]>(
      "acquireMempool",
      {},
    );
  }

  async nextTransaction(params?: {
    fields?: "all";
  }): Promise<schema.NextTransactionResponse["result"]> {
    return this.request<any, schema.Ogmios["NextTransactionResponse"]>(
      "nextTransaction",
      params,
    );
  }

  async hasTransaction(params: {
    id: schema.TransactionId;
  }): Promise<schema.HasTransactionResponse["result"]> {
    return this.request<
      schema.HasTransaction,
      schema.Ogmios["HasTransactionResponse"]
    >("hasTransaction", params);
  }

  async sizeOfMempool(): Promise<schema.SizeOfMempoolResponse["result"]> {
    return this.request<
      any,
      schema.SizeOfMempoolResponse | schema.MustAcquireMempoolFirst
    >("sizeOfMempool", {});
  }

  async releaseMempool(): Promise<schema.ReleaseMempoolResponse["result"]> {
    return this.request<any, schema.Ogmios["ReleaseMempoolResponse"]>(
      "releaseMempool",
      {},
    );
  }
}
