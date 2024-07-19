import { ProtocolParameters, Address, TransactionUnspentOutput, AssetId, TransactionInput, DatumHash, PlutusData, TransactionId, Transaction, Redeemers, TransactionOutput, HexBlob, Value, TokenMap, PolicyId, AssetName } from "@blaze-cardano/core";
import { Provider } from "./types";
import { CardanoQueryClient } from "@utxorpc/sdk";
import * as Cardano from "@utxorpc/spec/lib/utxorpc/v1alpha/cardano/cardano_pb.js";

export class U5C implements Provider {
    private queryClient: CardanoQueryClient;
    constructor({
        url,
    }: {
        url: string;
    }) {
        this.queryClient = new CardanoQueryClient({
            uri: url,
        });
    }

    getParameters(): Promise<ProtocolParameters> {
        throw new Error("Method not implemented.");
    }

    async getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]> {
        const utxoSearchResult = await this.queryClient.getUtxosByAddress(new Uint8Array(Buffer.from(address.toBytes().toString(), 'hex')));
        const utxos = utxoSearchResult.map(item => {
            const input = new TransactionInput(
                TransactionId(Buffer.from(item.txHash).toString('hex')),
                BigInt(item.outputIndex),
            );

            if (item.asOutput === undefined || item.asOutput === null) {
                throw new Error(`Error fetching unspent outputs`);
            }

            const output = this._rpcTxOutToCoreTxOut(item.asOutput);
            return new TransactionUnspentOutput(
                input,
                output,
            );
        });
        return utxos;
    }

    async getUnspentOutputsWithAsset(address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]> {
        const policyId = AssetId.getPolicyId(unit).toString();
        const assetName = AssetId.getAssetName(unit).toString();
        const policyIdBytes = new Uint8Array(Buffer.from(policyId, 'hex'));
        const assetNameBytes = new Uint8Array(Buffer.from(assetName, 'hex'));
        const addressBytes = new Uint8Array(Buffer.from(address.toBytes().toString(), 'hex'));
        const utxoSearchResult = await this.queryClient.getUtxosByAddressAsset(addressBytes, policyIdBytes, assetNameBytes);
        return utxoSearchResult.map(item => {
            const input = new TransactionInput(
                TransactionId(Buffer.from(item.txHash).toString('hex')),
                BigInt(item.outputIndex),
            );

            if (item.asOutput === undefined || item.asOutput === null) {
                throw new Error(`Error fetching unspent outputs`);
            }
    
            const output = this._rpcTxOutToCoreTxOut(item.asOutput);

            return new TransactionUnspentOutput(
                input,
                output,
            );
        });
    }

    async getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
        const policyId = AssetId.getPolicyId(unit).toString();
        const assetName = AssetId.getAssetName(unit).toString();
        const policyIdBytes = new Uint8Array(Buffer.from(policyId, 'hex'));
        const assetNameBytes = new Uint8Array(Buffer.from(assetName, 'hex'));
        const utxoSearchResult = await this.queryClient.getUtxosByNft(policyIdBytes, assetNameBytes);

        if (utxoSearchResult.length <= 0) {
            throw new Error(`Error fetching unspent outputs`);
        }

        const item = utxoSearchResult[0];
        if (item === undefined || item === null) {
            throw new Error(`Error fetching unspent outputs`);
        }

        const input = new TransactionInput(
            TransactionId(Buffer.from(item.txHash).toString('hex')),
            BigInt(item.outputIndex),
        );

        if (item.asOutput === undefined || item.asOutput === null) {
            throw new Error(`Error fetching unspent outputs`);
        }

        const output = this._rpcTxOutToCoreTxOut(item.asOutput);

        return new TransactionUnspentOutput(
            input,
            output,
        );
    }

    async resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]> {
        const references = txIns.map(txIn => {
            const txHashBytes = new Uint8Array(Buffer.from(txIn.transactionId().toString(), 'hex'));
            return {
                txHash: txHashBytes,
                outputIndex: Number(txIn.index().toString())
            }
        });
        const utxoSearchResult = await this.queryClient.getUtxoByOutputRef(references);
        return utxoSearchResult?.map(item => {
            const input = new TransactionInput(
                TransactionId(Buffer.from(item.txHash).toString('hex')),
                BigInt(item.outputIndex),
            );

            if (item.asOutput === undefined || item.asOutput === null) {
                throw new Error(`Error fetching unspent outputs`);
            }

            const output = this._rpcTxOutToCoreTxOut(item.asOutput);

            return new TransactionUnspentOutput(
                input,
                output,
            );
        }) ?? [];
    }

    resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
        console.log("resolveDatum", datumHash);
        throw new Error("Method not implemented.");
    }

    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean> {
        console.log("awaitTransactionConfirmation", txId, timeout);
        throw new Error("Method not implemented.");
    }

    postTransactionToChain(tx: Transaction): Promise<TransactionId> {
        console.log("postTransactionToChain", tx);
        throw new Error("Method not implemented.");
    }

    evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers> {
        console.log("evaluateTransaction", tx, additionalUtxos);
        throw new Error("Method not implemented.");
    }

    private _rpcTxOutToCoreTxOut(rpcTxOutput: Cardano.TxOutput): TransactionOutput {
        const output = new TransactionOutput(
            Address.fromBytes(HexBlob.fromBytes(rpcTxOutput.address)),
            this._rpcTxOutToCoreValue(rpcTxOutput)
        );

        // output.setDatum(new Datum(
        //     DatumHash(Buffer.from(rpcTxOutput.datumHash).toString('hex'))
        // ))
        // Would be convient to have a Datum.fromBytes() method since blaze a PlutusData.fromCbor
        // console.log(rpcTxOutput.datum);
        return output;
    }

    private _rpcTxOutToCoreValue(rpcTxOutput: Cardano.TxOutput): Value {
        return new Value(
            BigInt(rpcTxOutput.coin),
            this._rpcMultiAssetOutputToTokenMap(rpcTxOutput.assets)
        );
    }

    private _rpcMultiAssetOutputToTokenMap(multiAsset: Cardano.Multiasset[]): TokenMap {
        const tokenMap: TokenMap = new Map();
        multiAsset.forEach((ma) => {
            ma.assets.forEach((asset) => {
                const assetId = AssetId.fromParts(
                    PolicyId(Buffer.from(ma.policyId).toString('hex')),
                    AssetName(Buffer.from(asset.name).toString('hex'))
                );

                const quantity = BigInt(asset.outputCoin);

                if (tokenMap.has(assetId)) {
                    tokenMap.set(assetId, tokenMap.get(assetId)! + quantity);
                } else {
                    tokenMap.set(assetId, quantity);
                }
            });
        });
        return tokenMap;
    }
}