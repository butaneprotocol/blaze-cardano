import type {
  ProtocolParameters,
  Transaction,
  Redeemers,
  TokenMap,
  CostModels,
} from "@blaze-cardano/core";
import {
  Address,
  TransactionUnspentOutput,
  AssetId,
  TransactionInput,
  DatumHash,
  PlutusData,
  TransactionId,
  TransactionOutput,
  HexBlob,
  Value,
  PolicyId,
  AssetName,
  Datum,
  PlutusV1Script,
  Script,
  PlutusV2Script,
  fromHex,
  toHex,
  PlutusLanguageVersion,
  hardCodedProtocolParams,
} from "@blaze-cardano/core";
import type { Provider } from "./types";
import { CardanoQueryClient, CardanoSubmitClient } from "@utxorpc/sdk";
import type * as Cardano from "@utxorpc/spec/lib/utxorpc/v1alpha/cardano/cardano_pb.js";

export class U5C implements Provider {
  private queryClient: CardanoQueryClient;
  private submitClient: CardanoSubmitClient;

  constructor({
    url,
    headers,
  }: {
    url: string;
    headers?: Record<string, string>;
  }) {
    this.queryClient = new CardanoQueryClient({
      uri: url,
      headers,
    });

    this.submitClient = new CardanoSubmitClient({
      uri: url,
      headers,
    });
  }

  async getParameters(): Promise<ProtocolParameters> {
    const rpcPParams = await this.queryClient.readParams();
    if (rpcPParams === undefined || rpcPParams === null) {
      throw new Error(`Error fetching protocol parameters`);
    }
    return this._rpcPParamsToCorePParams(rpcPParams);
  }

  async getUnspentOutputs(
    address: Address
  ): Promise<TransactionUnspentOutput[]> {
    const utxoSearchResult = await this.queryClient.searchUtxosByAddress(
      new Uint8Array(Buffer.from(address.toBytes().toString(), "hex"))
    );

    const utxos = utxoSearchResult.map((item) => {
      const input = new TransactionInput(
        TransactionId(Buffer.from(item.txoRef.hash).toString("hex")),
        BigInt(item.txoRef.index)
      );

      const output = this._rpcTxOutToCoreTxOut(item.parsedValued!);
      return new TransactionUnspentOutput(input, output);
    });

    return utxos;
  }

  async getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId
  ): Promise<TransactionUnspentOutput[]> {
    const addressBytes = new Uint8Array(
      Buffer.from(address.toBytes().toString(), "hex")
    );

    const unitBytes = new Uint8Array(Buffer.from(unit.toString(), "hex"));

    const utxoSearchResult =
      await this.queryClient.searchUtxosByAddressWithAsset(
        addressBytes,
        undefined,
        unitBytes
      );

    return utxoSearchResult.map((item) => {
      const input = new TransactionInput(
        TransactionId(Buffer.from(item.txoRef.hash).toString("hex")),
        BigInt(item.txoRef.index)
      );

      const output = this._rpcTxOutToCoreTxOut(item.parsedValued!);

      return new TransactionUnspentOutput(input, output);
    });
  }

  async getUnspentOutputByNFT(
    unit: AssetId
  ): Promise<TransactionUnspentOutput> {
    const unitBytes = new Uint8Array(Buffer.from(unit.toString(), "hex"));
    const utxoSearchResult = await this.queryClient.searchUtxosByAsset(
      undefined,
      unitBytes
    );

    if (utxoSearchResult.length <= 0) {
      throw new Error(`Error fetching unspent outputs`);
    }

    const item = utxoSearchResult[0];
    if (item === undefined || item === null) {
      throw new Error(`Error fetching unspent outputs`);
    }

    const input = new TransactionInput(
      TransactionId(Buffer.from(item.txoRef.hash).toString("hex")),
      BigInt(item.txoRef.index)
    );

    const output = this._rpcTxOutToCoreTxOut(item.parsedValued!);

    return new TransactionUnspentOutput(input, output);
  }

  async resolveUnspentOutputs(
    txIns: TransactionInput[]
  ): Promise<TransactionUnspentOutput[]> {
    const references = txIns.map((txIn) => {
      const txHashBytes = new Uint8Array(
        Buffer.from(txIn.transactionId().toString(), "hex")
      );
      return {
        txHash: txHashBytes,
        outputIndex: Number(txIn.index().toString()),
      };
    });
    const utxoSearchResult =
      await this.queryClient.readUtxosByOutputRef(references);
    return (
      utxoSearchResult?.map((item) => {
        const input = new TransactionInput(
          TransactionId(Buffer.from(item.txoRef.hash).toString("hex")),
          BigInt(item.txoRef.index)
        );

        const output = this._rpcTxOutToCoreTxOut(item.parsedValued!);

        return new TransactionUnspentOutput(input, output);
      }) ?? []
    );
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    console.log("resolveDatum", datumHash);
    throw new Error("Method not implemented.");
  }

  awaitTransactionConfirmation(
    _txId: TransactionId,
    _timeout?: number
  ): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  async postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    const cbor = fromHex(tx.toCbor());
    const hash = await this.submitClient.submitTx(cbor);
    return TransactionId(toHex(hash));
  }

  evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[]
  ): Promise<Redeemers> {
    console.log("evaluateTransaction", tx, additionalUtxos);
    throw new Error("Method not implemented.");
  }

  private _rpcTxOutToCoreTxOut(
    rpcTxOutput: Cardano.TxOutput
  ): TransactionOutput {
    const output = new TransactionOutput(
      Address.fromBytes(HexBlob.fromBytes(rpcTxOutput.address)),
      this._rpcTxOutToCoreValue(rpcTxOutput)
    );

    if (rpcTxOutput.datum !== undefined) {
      if (
        rpcTxOutput.datum?.originalCbor &&
        rpcTxOutput.datum.originalCbor.length > 0
      ) {
        const inlineDatum = Datum.newInlineData(
          PlutusData.fromCbor(HexBlob.fromBytes(rpcTxOutput.datum.originalCbor))
        );
        output.setDatum(inlineDatum);
      } else if (rpcTxOutput.datum?.hash && rpcTxOutput.datum.hash.length > 0) {
        const datumHash = Datum.newDataHash(
          DatumHash(Buffer.from(rpcTxOutput.datum.hash).toString("hex"))
        );
        output.setDatum(datumHash);
      }
    }

    if (rpcTxOutput.script !== undefined) {
      if (rpcTxOutput.script.script.case === "plutusV1") {
        const cbor = rpcTxOutput.script.script.value;
        output.setScriptRef(
          Script.newPlutusV1Script(
            PlutusV1Script.fromCbor(HexBlob.fromBytes(cbor))
          )
        );
      }
      if (rpcTxOutput.script.script.case === "plutusV2") {
        const cbor = rpcTxOutput.script.script.value;
        output.setScriptRef(
          Script.newPlutusV2Script(
            PlutusV2Script.fromCbor(HexBlob.fromBytes(cbor))
          )
        );
      }
    }

    return output;
  }

  private _rpcTxOutToCoreValue(rpcTxOutput: Cardano.TxOutput): Value {
    return new Value(
      BigInt(rpcTxOutput.coin),
      this._rpcMultiAssetOutputToTokenMap(rpcTxOutput.assets)
    );
  }

  private _rpcMultiAssetOutputToTokenMap(
    multiAsset: Cardano.Multiasset[]
  ): TokenMap {
    const tokenMap: TokenMap = new Map();
    multiAsset.forEach((ma) => {
      ma.assets.forEach((asset) => {
        const assetId = AssetId.fromParts(
          PolicyId(Buffer.from(ma.policyId).toString("hex")),
          AssetName(Buffer.from(asset.name).toString("hex"))
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

  private _rpcPParamsToCorePParams(
    rpcPParams: Cardano.PParams
  ): ProtocolParameters {
    console.log(rpcPParams.costModels);
    return {
      coinsPerUtxoByte: Number(rpcPParams.coinsPerUtxoByte),
      costModels: (new Map() as CostModels)
        .set(
          PlutusLanguageVersion.V1,
          rpcPParams.costModels?.plutusV1?.values.map(v => Number(v.toString())) ?? hardCodedProtocolParams.costModels.get(PlutusLanguageVersion.V1) ?? []
        )
        .set(
          PlutusLanguageVersion.V2,
          rpcPParams.costModels?.plutusV2?.values.map(v => Number(v.toString())) ?? hardCodedProtocolParams.costModels.get(PlutusLanguageVersion.V2) ?? []
        )
        .set(PlutusLanguageVersion.V3, hardCodedProtocolParams.costModels.get(PlutusLanguageVersion.V3) ?? []),
      maxBlockBodySize: Number(rpcPParams.maxBlockBodySize),
      maxBlockHeaderSize: Number(rpcPParams.maxBlockHeaderSize),
      maxCollateralInputs: Number(rpcPParams.maxCollateralInputs),
      maxExecutionUnitsPerBlock: {
        steps: Number(rpcPParams.maxExecutionUnitsPerBlock?.steps),
        memory: Number(rpcPParams.maxExecutionUnitsPerBlock?.memory),
      },
      maxTxSize: Number(rpcPParams.maxTxSize),
      minFeeConstant: Number(rpcPParams.minFeeConstant),
      minFeeCoefficient: Number(rpcPParams.minFeeCoefficient),
      minPoolCost: Number(rpcPParams.minPoolCost),
      poolDeposit: Number(rpcPParams.poolDeposit),
      stakeKeyDeposit: Number(rpcPParams.stakeKeyDeposit),
      poolRetirementEpochBound: Number(rpcPParams.poolRetirementEpochBound),
      desiredNumberOfPools: Number(rpcPParams.desiredNumberOfPools),
      poolInfluence: `${rpcPParams.poolInfluence?.numerator}/${rpcPParams.poolInfluence?.denominator}`,
      monetaryExpansion: `${rpcPParams.monetaryExpansion?.numerator}/${rpcPParams.monetaryExpansion?.denominator}`,
      treasuryExpansion: `${rpcPParams.treasuryExpansion?.numerator}/${rpcPParams.treasuryExpansion?.denominator}`,
      protocolVersion: {
        minor: Number(rpcPParams.protocolVersion?.minor),
        major: Number(rpcPParams.protocolVersion?.major),
      },
      maxValueSize: Number(rpcPParams.maxValueSize),
      collateralPercentage: Number(rpcPParams.collateralPercentage),
      prices: {
        memory: Number(rpcPParams.prices?.memory),
        steps: Number(rpcPParams.prices?.steps),
      },
      maxExecutionUnitsPerTransaction: {
        memory: Number(rpcPParams.maxExecutionUnitsPerTransaction?.memory),
        steps: Number(rpcPParams.maxExecutionUnitsPerTransaction?.steps),
      },
    };
  }
}
