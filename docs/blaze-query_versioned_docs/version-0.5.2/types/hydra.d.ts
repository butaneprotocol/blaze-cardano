import type { ProtocolParameters, AssetId, DatumHash, Transaction as BlazeTransaction, Redeemers, NetworkId } from "@blaze-cardano/core";
import { Address, TransactionUnspentOutput, TransactionInput, PlutusData, TransactionId } from "@blaze-cardano/core";
import { Provider } from "./provider";
import WebSocket from "ws";
export declare class HydraProvider extends Provider {
    url: URL;
    connection: WebSocket;
    constructor(url: string, networkId: NetworkId, filterAddress?: string, connectionCallbacks?: {
        onConnect?: (event: WebSocket.Event) => void;
        onDisconnect?: (event: WebSocket.CloseEvent) => void;
        onError?: (event: WebSocket.ErrorEvent) => void;
    }, hydraMessageHandler?: HydraMessageHandler);
    getParameters(): Promise<ProtocolParameters>;
    getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputsWithAsset(_address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    /**
     * This method fetches the UTxO that holds a particular NFT given as an argument
     * It does **NOT** gaurantee the uniqueness of the NFT.
     * It is just like `getUnspentOutputsWithAsset`, except it short circuits and returns the first UTxO containing the unit
     * @param unit - the AssetId of the NFT
     * @returns A promise that resolves to the UTxO
     */
    getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    /**
     * This method takes a datum hash and tries to find the assosciated inline datum in the current snapshot utxo set.
     * If the output containing the datum has been spent, this method will error
     * @param datumHash
     * @returns Promise<PlutusData>
     */
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    postTransactionToChain(tx: BlazeTransaction): Promise<TransactionId>;
    evaluateTransaction(_tx: BlazeTransaction, _additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
    fetchUTxOs(): Promise<{
        [txRef: string]: TransactionUnspentOutput;
    }>;
    private hydraUtxoToTransactionUnspentOutput;
}
export declare abstract class HydraMessageHandler {
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
    receiveMessage(message: WebSocket.MessageEvent): void;
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
    utxo: {
        [txRef: string]: TxOut;
    };
    confirmedTransactions: string[];
    utxoToDecommit: {
        [txRef: string]: TxOut;
    };
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
    utxo: {
        [txRef: string]: TxOut;
    };
    headSeed: string;
}
export interface CollectComTx {
    tag: "CollectComTx";
    utxo: {
        [txRef: string]: TxOut;
    };
    headId: string;
    headParameters: HeadParameters;
}
export interface InitialSnapshot {
    headId: string;
    initialUtxo: {
        [txRef: string]: TxOut;
    };
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
    utxo: {
        [txRef: string]: TxOut;
    };
    utxoToDecommit: {
        [txRef: string]: TxOut;
    };
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
    snapshotUtxo: {
        [txRef: string]: TxOut;
    };
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
    remoteHost: {
        tag: "IPv4";
        ipv4: string;
    } | {
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
    utxo: {
        [txRef: string]: TxOut;
    };
    seq: number;
    timestamp: string;
}
export interface HeadIsOpen {
    tag: "HeadIsOpen";
    headId: string;
    utxo: {
        [txRef: string]: TxOut;
    };
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
    utxo: {
        [txRef: string]: TxOut;
    };
    seq: number;
    timestamp: string;
}
export interface HeadIsFinalized {
    tag: "HeadIsFinalized";
    headId: string;
    utxo: {
        [txRef: string]: TxOut;
    };
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
    utxo: {
        [txRef: string]: TxOut;
    };
    transaction: Transaction;
    validationError: {
        reason: string;
    };
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
    utxo: {
        [txRef: string]: TxOut;
    };
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
    postChainTx: InitTx | AbortTx | CollectComTx | DecrementTx | CloseTx | ContestTx | FanoutTx;
    postTxError: any;
    seq: number;
    timestamp: string;
}
export interface CommandFailed {
    tag: "CommandFailed";
    clientInput: {
        tag: "Abort";
    } | {
        tag: "NewTx";
        transaction: Transaction;
    } | {
        tag: "GetUTxO";
    } | {
        tag: "Decommit";
        decommitTx: Transaction;
    } | {
        tag: "Close";
    } | {
        tag: "Contest";
    } | {
        tag: "Fanout";
    };
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
    decommitInvalidReason: {
        tag: "DecommitTxInvalid";
        localUtxo: {
            [txRef: string]: TxOut;
        };
        validationError: {
            reason: string;
        };
    } | {
        tag: "DecommitAlreadyInFlight";
        otherDecommitTxId: string;
    };
}
export interface DecommitRequested {
    tag: "DecommitRequested";
    headId: string;
    decommitTx: Transaction;
    utxoToDecommit: {
        [txRef: string]: TxOut;
    };
    seq: number;
    timestmap: string;
}
export interface DecommitApproved {
    tag: "DecommitApproved";
    headId: string;
    decommitTxId: string;
    utxoToDecommit: {
        [txRef: string]: TxOut;
    };
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
//# sourceMappingURL=hydra.d.ts.map