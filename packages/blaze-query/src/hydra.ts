import type {
  ProtocolParameters,
  AssetId,
  DatumHash,
  Transaction as BlazeTransaction,
  Redeemers,
  NetworkId,
} from "@blaze-cardano/core";
import {
  Address,
  TransactionUnspentOutput,
  TransactionInput,
  TransactionOutput,
  PlutusData,
  TransactionId,
  Datum,
  hardCodedProtocolParams,
  toHex,
  Value,
  Script as BlazeScript,
  HexBlob,
  DatumKind,
} from "@blaze-cardano/core";
import { Provider } from "./provider";
import WebSocket from "ws";

export class HydraProvider extends Provider {
  url: URL;
  connection: WebSocket;

  constructor(
    url: string,
    networkId: NetworkId,
    filterAddress?: string,
    connectionCallbacks?: {
      onConnect?: (event: WebSocket.Event) => void;
      onDisconnect?: (event: WebSocket.CloseEvent) => void;
      onError?: (event: WebSocket.ErrorEvent) => void;
    },
    hydraMessageHandler?: HydraMessageHandler,
  ) {
    super(networkId, "unknown"); // TODO: implement slot translation

    this.url = new URL(url);
    this.url.protocol = this.url.protocol.replace("ws", "http");
    const websocketUrl = new URL(url);
    websocketUrl.protocol = websocketUrl.protocol.replace("http", "ws");
    this.connection = new WebSocket(
      websocketUrl +
        (websocketUrl.toString().endsWith("/") ? "" : "/") +
        `?${filterAddress ? `address=${filterAddress}&` : ""}history=no`,
    );
    this.connection.onopen = (event) => connectionCallbacks?.onConnect?.(event);
    this.connection.onclose = (event) =>
      connectionCallbacks?.onDisconnect?.(event);
    this.connection.onerror = (event) => connectionCallbacks?.onError?.(event);
    this.connection.onmessage = (event) =>
      hydraMessageHandler?.receiveMessage(event);
  }

  async getParameters(): Promise<ProtocolParameters> {
    const resp = await fetch(`${this.url}protocol-parameters`);
    const rawParams = (await resp.json()) as any;
    return {
      minFeeConstant: rawParams.txFeeFixed,
      minFeeCoefficient: rawParams.txFeePerByte,
      maxTxSize: rawParams.maxTxSize,
      maxValueSize: rawParams.maxValueSize,
      stakeKeyDeposit: rawParams.stakeAddressDeposit,
      poolDeposit: rawParams.stakePoolDeposit,
      prices: {
        memory: rawParams.executionUnitPrices.priceMemory,
        steps: rawParams.executionUnitPrices.priceSteps,
      },
      maxExecutionUnitsPerTransaction: {
        memory: rawParams.maxTxExecutionUnits.memory,
        steps: rawParams.maxTxExecutionUnits.steps,
      },
      coinsPerUtxoByte: rawParams.utxoCostPerByte,
      collateralPercentage: rawParams.collateralPercentage,
      maxCollateralInputs: rawParams.maxCollateralInputs,
      costModels: rawParams.costModels,
      minFeeReferenceScripts: rawParams.minfeeRefscriptCostPerByte
        ? {
            ...hardCodedProtocolParams.minFeeReferenceScripts!,
            base: rawParams.minfeeRefscriptCostPerByte,
          }
        : undefined,
      poolRetirementEpochBound: rawParams.poolRetireMaxEpoch,
      desiredNumberOfPools: rawParams.stakePoolTargetNum,
      poolInfluence: rawParams.poolPledgeInfluence,
      monetaryExpansion: rawParams.monetaryExpansion,
      treasuryExpansion: rawParams.treasuryCut,
      minPoolCost: rawParams.minPoolCost,
      protocolVersion: rawParams.protocolVersion,
      maxExecutionUnitsPerBlock: {
        memory: rawParams.maxBlockExecutionUnits.memory,
        steps: rawParams.maxBlockExecutionUnits.steps,
      },
      maxBlockBodySize: rawParams.maxBlockBodySize,
      maxBlockHeaderSize: rawParams.maxBlockHeaderSize,
    };
  }

  async getUnspentOutputs(
    address: Address,
  ): Promise<TransactionUnspentOutput[]> {
    const utxos = await this.fetchUTxOs();

    const ret: TransactionUnspentOutput[] = [];
    for (const key in utxos) {
      const utxo = utxos[key]!;
      if (utxo.output().address().toBech32() === address.toBech32()) {
        ret.push(utxo);
      }
    }

    return Promise.resolve(ret);
  }

  async getUnspentOutputsWithAsset(
    _address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    const utxos = await this.fetchUTxOs();

    const ret: TransactionUnspentOutput[] = [];
    // TODO: filter by address
    for (const key in utxos) {
      const utxo = utxos[key]!;
      if (utxo.output().amount().multiasset()?.has(unit)) {
        ret.push(utxo);
      }
    }

    return Promise.resolve(ret);
  }

  /**
   * This method fetches the UTxO that holds a particular NFT given as an argument.
   * @remarks
   * It does **NOT** gaurantee the uniqueness of the NFT.
   * It is just like `getUnspentOutputsWithAsset`, except it short circuits and returns the first UTxO containing the unit
   * @param unit - the AssetId of the NFT
   * @returns A promise that resolves to the UTxO
   */
  async getUnspentOutputByNFT(
    unit: AssetId,
  ): Promise<TransactionUnspentOutput> {
    const utxos = await this.fetchUTxOs();

    for (const key in utxos) {
      const utxo = utxos[key]!;
      if (utxo.output().amount().multiasset()?.has(unit)) {
        return utxo;
      }
    }

    throw new Error("UTxO not found");
  }

  async resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    const utxos = await this.fetchUTxOs();

    const ret: TransactionUnspentOutput[] = [];
    for (const txIn of txIns) {
      const utxo: TransactionUnspentOutput | undefined =
        utxos[`${txIn.transactionId()}#${txIn.index()}`];
      if (!utxo) {
        throw new Error(
          `Failed to resolve transaction: ${txIn.transactionId()}#${txIn.index()}`,
        );
      }

      ret.push(utxo);
    }

    return ret;
  }

  /**
   * This method takes a datum hash and tries to find the assosciated inline datum in the current snapshot utxo set.
   * @remarks
   * If the output containing the datum has been spent, this method will error
   * @param datumHash
   * @returns Promise<PlutusData>
   */
  async resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    const utxos = await this.fetchUTxOs();

    for (const key in utxos) {
      const utxo = utxos[key]!;
      const datum = utxo.output().datum();
      if (!datum) continue;
      if (datum.kind() != DatumKind.InlineData) continue;

      const hash = datum.asInlineData()?.hash();
      if (datumHash === hash) {
        return datum.asInlineData()!;
      }
    }

    throw new Error(
      "resolveDatum: could not find a datum with that hash in the current snapshot",
    );
  }

  async awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {
    const startTime = Date.now();

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const checkConfirmation = async () => {
      const resp = await fetch(`${this.url}snapshot/utxo`);
      const rawUtxo = (await resp.json()) as any;
      return !!Object.keys(rawUtxo).find(
        (txRef) => txRef.split("#")[0] === txId,
      );
    };

    if (await checkConfirmation()) {
      return true;
    }

    if (timeout) {
      while (Date.now() - startTime < timeout) {
        await delay(500);

        if (await checkConfirmation()) {
          return true;
        }
      }
    }

    return false;
  }

  async postTransactionToChain(tx: BlazeTransaction): Promise<TransactionId> {
    const txId = tx.body().hash();
    this.connection.send(
      JSON.stringify({
        tag: "NewTx",
        transaction: {
          type: "Tx BabbageEra",
          cborHex: tx.toCbor(),
        },
      }),
    );

    return txId;
  }
  evaluateTransaction(
    _tx: BlazeTransaction,
    _additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    throw new Error("Unsupported by the Hydra API");
  }

  async fetchUTxOs(): Promise<{ [txRef: string]: TransactionUnspentOutput }> {
    const utxos: { [txRef: string]: TransactionUnspentOutput } = {};
    const resp = await fetch(`${this.url}snapshot/utxo`);
    const rawUtxo = (await resp.json()) as any;
    for (const key in rawUtxo) {
      const [txHash, idx] = key.split("#");
      const output = rawUtxo[key];
      utxos[key] = this.hydraUtxoToTransactionUnspentOutput(
        txHash!,
        parseInt(idx!),
        output,
      );
    }

    return utxos;
  }
  private hydraUtxoToTransactionUnspentOutput(
    txHash: string,
    idx: number,
    output: any,
  ): TransactionUnspentOutput {
    const address = Address.fromBech32(output.address);
    const value = output.amount
      ? new Value(BigInt(output.amount.coin ?? 0), output.amount.multiasset)
      : new Value(BigInt(output.value.lovelace ?? 0));
    const txOut = new TransactionOutput(address, value);

    const datumBytes = output.datum?.Data?.original_bytes
      ? toHex(output.datum.Data.original_bytes)
      : output.inlineDatum?.Data?.original;

    if (datumBytes) {
      const datum = new Datum(
        output.inlineDatumHash,
        PlutusData.fromCbor(datumBytes),
      );

      txOut.setDatum(datum);
    }

    const referenceScript = output.referenceScript;
    if (referenceScript) {
      const cborHex: string = referenceScript.cborHex;
      const script = BlazeScript.fromCbor(HexBlob(cborHex));
      txOut.setScriptRef(script);
    }

    const txIn = new TransactionInput(TransactionId(txHash), BigInt(idx));
    return new TransactionUnspentOutput(txIn, txOut);
  }
}

export abstract class HydraMessageHandler {
  abstract onGreetings(message: Greetings): void;
  abstract onPeerConnected(message: PeerConnected): void;
  abstract onPeerDisconnected(message: PeerDisconnected): void;
  abstract onPeerHandshakeFailure(message: PeerHandshakeFailure): void;
  abstract onHeadIsInitializing(message: HeadIsInitializing): void;
  abstract onCommitted(message: Committed): void;
  abstract onHeadIsOpen(message: HeadIsOpen): void;
  abstract onHeadIsClosed(message: HeadIsClosed): void;
  abstract onHeadIsContested(message: HeadIsContested): void;
  abstract onReadyToFanout(message: ReadyToFanout): void;
  abstract onHeadIsAborted(message: HeadIsAborted): void;
  abstract onHeadIsFinalized(message: HeadIsFinalized): void;
  abstract onTxValid(message: TxValid): void;
  abstract onTxInvalid(message: TxInvalid): void;
  abstract onSnapshotConfirmed(message: SnapshotConfirmed): void;
  abstract onGetUTxOResponse(message: GetUTxOResponse): void;
  abstract onInvalidInput(message: InvalidInput): void;
  abstract onPostTxOnChainFailed(message: PostTxOnChainFailed): void;
  abstract onCommandFailed(message: CommandFailed): void;
  abstract onIgnoredHeadInitializing(message: IgnoredHeadInitializing): void;
  abstract onDecommitInvalid(message: DecommitInvalid): void;
  abstract onDecommitRequested(message: DecommitRequested): void;
  abstract onDecommitApproved(message: DecommitApproved): void;
  abstract onDecommitFinalized(message: DecommitFinalized): void;

  receiveMessage(message: WebSocket.MessageEvent) {
    const data = JSON.parse(message.data as string);
    switch (data.tag) {
      case "Greetings":
        this.onGreetings(message as unknown as Greetings);
        break;
      case "PeerConnected":
        this.onPeerConnected(message as unknown as PeerConnected);
        break;
      case "onPeerDisconnected":
        this.onPeerDisconnected(message as unknown as PeerDisconnected);
        break;
      case "PeerHandshakeFailure":
        this.onPeerHandshakeFailure(message as unknown as PeerHandshakeFailure);
        break;
      case "HeadIsInitializing":
        this.onHeadIsInitializing(message as unknown as HeadIsInitializing);
        break;
      case "Committed":
        this.onCommitted(message as unknown as Committed);
        break;
      case "HeadIsOpen":
        this.onHeadIsOpen(message as unknown as HeadIsOpen);
        break;
      case "HeadIsClosed":
        this.onHeadIsClosed(message as unknown as HeadIsClosed);
        break;
      case "HeadIsContested":
        this.onHeadIsContested(message as unknown as HeadIsContested);
        break;
      case "ReadyToFanout":
        this.onReadyToFanout(message as unknown as ReadyToFanout);
        break;
      case "HeadIsAborted":
        this.onHeadIsAborted(message as unknown as HeadIsAborted);
        break;
      case "HeadIsFinalized":
        this.onHeadIsFinalized(message as unknown as HeadIsFinalized);
        break;
      case "TxValid":
        this.onTxValid(message as unknown as TxValid);
        break;
      case "TxInvalid":
        this.onTxInvalid(message as unknown as TxInvalid);
        break;
      case "SnapshotConfirmed":
        this.onSnapshotConfirmed(message as unknown as SnapshotConfirmed);
        break;
      case "GetUTxOResponse":
        this.onGetUTxOResponse(message as unknown as GetUTxOResponse);
        break;
      case "InvalidInput":
        this.onInvalidInput(message as unknown as InvalidInput);
        break;
      case "PostTxOnChainFailed":
        this.onPostTxOnChainFailed(message as unknown as PostTxOnChainFailed);
        break;
      case "CommandFailed":
        this.onCommandFailed(message as unknown as CommandFailed);
        break;
      case "IgnoredHeadInitializing":
        this.onIgnoredHeadInitializing(
          message as unknown as IgnoredHeadInitializing,
        );
        break;
      case "DecommitInvalid":
        this.onDecommitInvalid(message as unknown as DecommitInvalid);
        break;
      case "DecommitRequested":
        this.onDecommitRequested(message as unknown as DecommitRequested);
        break;
      case "DecommitApproved":
        this.onDecommitApproved(message as unknown as DecommitApproved);
        break;
      case "DecommitFinalized":
        this.onDecommitFinalized(message as unknown as DecommitFinalized);
        break;
      default:
        // Unknown message
        break;
    }
  }
}

export interface Script {
  cborHex: string;
  description: string;
  type: "SimpleScript" | "PlutusScriptV1" | "PlutusScriptV2" | "PlutusScriptV3";
}

export interface TxOut {
  address: string;
  value: {
    lovelace: number;
    [assetId: string]: number;
  };
  referenceScript: Script | null;
  datumhash: string | null;
  inlineDatum: any | null;
  datum: string | null;
}

export interface Party {
  vkey: string;
}

export interface Transaction {
  type: "Tx ConwayEra" | "Unwitnessed Tx ConwayEra" | "Witnessed Tx ConwayEra";
  description: string;
  cborHex: string;
  txId: string;
}

export interface Snapshot {
  headId: string;
  snapshotNumber: string;
  utxo: { [txRef: string]: TxOut };
  confirmedTransactions: string[];
  utxoToDecommit: { [txRef: string]: TxOut };
  version: number;
}

export interface HeadParameters {
  contestationPeriod: number;
  parties: Party[];
}

export interface InitTx {
  tag: "InitTx";
  participants: string[];
  headParameters: HeadParameters;
}

export interface AbortTx {
  tag: "AbortTx";
  utxo: { [txRef: string]: TxOut };
  headSeed: string;
}

export interface CollectComTx {
  tag: "CollectComTx";
  utxo: { [txRef: string]: TxOut };
  headId: string;
  headParameters: HeadParameters;
}

export interface InitialSnapshot {
  headId: string;
  initialUtxo: { [txRef: string]: TxOut };
  tag: "InitialSnapshot";
}

export interface ConfirmedSnapshot {
  snapshot: Snapshot;
  signatures: {
    mutliSignature: string[];
  };
  tag: "ConfirmedSnapshot";
}
export interface DecrementTx {
  tag: "DecrementTx";
  headId: string;
  headParameters: HeadParameters;
  decerementingSnapshot: InitialSnapshot | ConfirmedSnapshot;
}

export interface CloseTx {
  tag: "CloseTx";
  headId: string;
  headParameters: HeadParameters;
  closingSnapshot: InitialSnapshot | ConfirmedSnapshot;
  openVersion: number;
}

export interface ContestTx {
  tag: "ContestTx";
  headId: string;
  headParameters: HeadParameters;
  contestingSnapshot: InitialSnapshot | ConfirmedSnapshot;
  openVersion: number;
}

export interface FanoutTx {
  tag: "FanoutTx";
  utxo: { [txRef: string]: TxOut };
  utxoToDecommit: { [txRef: string]: TxOut };
  headSeed: string;
  contestationDeadline: string;
}

export interface Greetings {
  tag: "Greetings";
  me: {
    vkey: string;
  };
  headStatus: "Idle" | "Initializing" | "Open" | "FanoutPossible" | "Final";
  hydraHeadId: string;
  snapshotUtxo: { [txRef: string]: TxOut };
  timestamp: string;
  hydraNodeVersion: string;
}

export interface PeerConnected {
  tag: "PeerConnected";
  peer: string;
  seq: number;
  timestamp: string;
}

export interface PeerDisconnected {
  tag: "PeerDisconnected";
  peer: string;
  seq: number;
  timestamp: string;
}

export interface PeerHandshakeFailure {
  tag: "PeerHandshakeFailure";
  remoteHost:
    | {
        tag: "IPv4";
        ipv4: string;
      }
    | {
        tag: "IPv6";
        ipv6: string;
      };
  ourVersion: number;
  theirVersions: number[];
  seq: number;
  timestamp: string;
}

export interface HeadIsInitializing {
  tag: "HeadIsInitializing";
  headId: string;
  parties: Party[];
  seq: number;
  timestamp: string;
}

export interface Committed {
  tag: "Committed";
  parties: Party[];
  utxo: { [txRef: string]: TxOut };
  seq: number;
  timestamp: string;
}

export interface HeadIsOpen {
  tag: "HeadIsOpen";
  headId: string;
  utxo: { [txRef: string]: TxOut };
  seq: number;
  timestamp: string;
}

export interface HeadIsClosed {
  tag: "HeadIsClosed";
  headId: string;
  snapshotNumber: number;
  contestationDeadline: string;
  seq: number;
  timestamp: string;
}

export interface HeadIsContested {
  tag: "HeadIsContested";
  headId: string;
  snapshotNumber: number;
  contestationDeadline: string;
  seq: number;
  timestamp: string;
}

export interface ReadyToFanout {
  tag: "ReadyToFanout";
  headId: string;
  seq: number;
  timestamp: string;
}

export interface HeadIsAborted {
  tag: "HeadIsAborted";
  headId: string;
  utxo: { [txRef: string]: TxOut };
  seq: number;
  timestamp: string;
}

export interface HeadIsFinalized {
  tag: "HeadIsFinalized";
  headId: string;
  utxo: { [txRef: string]: TxOut };
  seq: number;
  timestamp: string;
}

export interface TxValid {
  tag: "TxValid";
  headId: string;
  transaction: Transaction;
  seq: number;
  timestamp: string;
}

export interface TxInvalid {
  tag: "TxInvalid";
  headId: string;
  utxo: { [txRef: string]: TxOut };
  transaction: Transaction;
  validationError: { reason: string };
  seq: number;
  timestamp: string;
}

export interface SnapshotConfirmed {
  tag: "SnapshotConfirmed";
  headId: string;
  snapshot: Snapshot;
  seq: number;
  timestamp: string;
}

export interface GetUTxOResponse {
  tag: "GetUTxOResponse";
  headId: string;
  utxo: { [txRef: string]: TxOut };
  seq: number;
  timestamp: string;
}

export interface InvalidInput {
  tag: "InvalidInput";
  reason: string;
  input: string;
  seq: number;
  timestamp: string;
}

export interface PostTxOnChainFailed {
  tag: "PostTxOnChainFailed";
  postChainTx:
    | InitTx
    | AbortTx
    | CollectComTx
    | DecrementTx
    | CloseTx
    | ContestTx
    | FanoutTx;
  postTxError: any;
  seq: number;
  timestamp: string;
}

export interface CommandFailed {
  tag: "CommandFailed";
  clientInput:
    | {
        tag: "Abort";
      }
    | { tag: "NewTx"; transaction: Transaction }
    | { tag: "GetUTxO" }
    | { tag: "Decommit"; decommitTx: Transaction }
    | { tag: "Close" }
    | { tag: "Contest" }
    | { tag: "Fanout" };
  seq: number;
  timestamp: string;
}

export interface IgnoredHeadInitializing {
  tag: "IgnoredHeadInitializing";
  headId: string;
  contestationPeriod: number;
  parties: Party[];
  participants: string[];
  seq: number;
  timestamp: string;
}

export interface DecommitInvalid {
  tag: "DecommitInvalid";
  headId: string;
  decommitTx: Transaction;
  decommitInvalidReason:
    | {
        tag: "DecommitTxInvalid";
        localUtxo: { [txRef: string]: TxOut };
        validationError: { reason: string };
      }
    | { tag: "DecommitAlreadyInFlight"; otherDecommitTxId: string };
}

export interface DecommitRequested {
  tag: "DecommitRequested";
  headId: string;
  decommitTx: Transaction;
  utxoToDecommit: { [txRef: string]: TxOut };
  seq: number;
  timestmap: string;
}

export interface DecommitApproved {
  tag: "DecommitApproved";
  headId: string;
  decommitTxId: string;
  utxoToDecommit: { [txRef: string]: TxOut };
  seq: number;
  timestamp: string;
}

export interface DecommitFinalized {
  tag: "DecommitFinalized";
  headId: string;
  decommitTxId: string;
  seq: number;
  timestamp: string;
}
