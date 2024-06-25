import type {
  ProtocolParameters,
  DatumHash,
  PlutusData,
  Transaction,
  Redeemers,
  TokenMap,
} from "@blaze-cardano/core";

import {
  TransactionUnspentOutput,
  Address,
  AssetId,
  TransactionInput,
  TransactionId,
  TransactionOutput,
  Value,
} from "@blaze-cardano/core";
import WebSocket from "ws";
import type { QueryLedgerStateProtocolParametersResponse } from "@cardano-ogmios/schema";
import type { Provider } from "./types";

export class Kupmios implements Provider {
  kupoUrl: string;
  ogmiosUrl: string;
  headers?: any;

  /**
   * Constructor to initialize Kupmios instance.
   * @param kupoUrl - URL of the Kupo service.
   * @param ogmiosUrl - URL of the Ogmios service.
   * @param headers - Optional headers for requests.
   */
  constructor(kupoUrl: string, ogmiosUrl: string, headers?: any) {
    this.kupoUrl = kupoUrl;
    this.ogmiosUrl = ogmiosUrl;
    this.headers = headers;
  }

  /**
   * Creates a WebSocket client to communicate with Ogmios.
   * @param method - JSON-RPC method name.
   * @param params - Parameters for the JSON-RPC method.
   * @returns A promise that resolves to a WebSocket client.
   */
  private createWebSocketClient(
    method: string,
    params: object,
  ): Promise<WebSocket> {
    const client = new WebSocket(this.ogmiosUrl);
    return new Promise((resolve, reject) => {
      client.once("open", () => {
        client.send(
          JSON.stringify({
            jsonrpc: "2.0",
            method,
            params,
          }),
        );
        resolve(client);
      });
      client.once("error", reject);
    });
  }

  /**
   * Parses a fractional string into a number.
   * @param fraction - Fractional string in the format "numerator/denominator".
   * @returns The parsed fraction as a number.
   */
  private parseFraction(fraction: string): number {
    const [numerator, denominator] = fraction.split("/").map(Number);
    return numerator! / denominator!;
  }

  /**
   * Handles the WebSocket response, parses it and returns the parsed data.
   * @param client - WebSocket client instance.
   * @param parseResponse - Function to parse the response data.
   * @returns A promise that resolves to the parsed data.
   */
  private async handleWebSocketResponse<T, R>(
    client: WebSocket,
    parseResponse: (data: T) => R,
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      client.once("message", (msg: string | Buffer) => {
        try {
          const response = JSON.parse(
            typeof msg === "string" ? msg : msg.toString(),
          );
          resolve(parseResponse(response));
        } catch (e) {
          reject(e);
        } finally {
          client.close();
        }
      });
    });
  }

  /**
   * Fetches unspent outputs from Kupo.
   * @param prefix - Prefix for the URL.
   * @param postfix - Postfix for the URL.
   * @returns A promise that resolves to an array of unspent outputs.
   */
  private async _getUnspentOutputs(
    prefix: string | null,
    postfix: string | null,
  ): Promise<TransactionUnspentOutput[]> {
    const url = `${this.kupoUrl}/matches/${prefix ? prefix : "*"}?unspent${postfix ? postfix : ""}`;
    console.log(`Fetching unspent outputs from ${url}`);
    const result: any = await fetch(url).then((res) => res.json());

    return result.map((utxo: any) => {
      const transactionId = utxo.transaction_id;
      const outputIndex = BigInt(utxo.output_index);
      const address = Address.fromBech32(utxo.address);
      const coins = BigInt(utxo.value.coins);
      const assets = utxo.value.assets;

      const tokenMap: TokenMap = new Map();
      for (const unit in assets) {
        if (Object.prototype.hasOwnProperty.call(assets, unit)) {
          tokenMap.set(AssetId(unit), BigInt(assets[unit]));
        }
      }

      const value = new Value(coins, tokenMap);

      return new TransactionUnspentOutput(
        new TransactionInput(TransactionId(transactionId), outputIndex),
        new TransactionOutput(address, value),
      );
    });
  }

  /**
   * Gets unspent outputs for a given address.
   * @param address - Address to fetch unspent outputs for.
   * @returns A promise that resolves to an array of unspent outputs.
   */
  async getUnspentOutputs(
    address: Address,
  ): Promise<TransactionUnspentOutput[]> {
    const prefix = address.toBech32();
    return this._getUnspentOutputs(prefix, null);
  }

  /**
   * Gets unspent outputs containing a specific asset.
   * @param address - Address to fetch unspent outputs for.
   * @param unit - Asset ID to filter by.
   * @returns A promise that resolves to an array of unspent outputs.
   */
  async getUnspentOutputsWithAsset(
    address: Address | null,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    const policyId = unit.slice(0, 56);
    const assetName = unit.slice(56);
    const prefix = address ? address.toBech32() : `${policyId}.${assetName}`;
    const postfix = address
      ? `&policy_id=${policyId}&asset_name=${assetName}`
      : "";
    return this._getUnspentOutputs(prefix, postfix);
  }

  /**
   * Gets an unspent output containing a specific NFT.
   * @param unit - Asset ID of the NFT.
   * @returns A promise that resolves to the unspent output.
   */
  async getUnspentOutputByNFT(
    unit: AssetId,
  ): Promise<TransactionUnspentOutput> {
    const res = await this.getUnspentOutputsWithAsset(null, unit);
    if (res.length === 1) {
      return res[0]!;
    } else {
      throw new Error(`Error fetching unspent outputs`);
    }
  }

  /**
   * Resolves unspent outputs for given transaction inputs.
   * @param txIns - Array of transaction inputs.
   * @returns A promise that resolves to an array of unspent outputs.
   */
  async resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    const results: Set<TransactionUnspentOutput> = new Set();

    await Promise.all(
      txIns.map(async (txIn) => {
        const prefix = `${txIn.index()}@${txIn.transactionId()}`;
        const outputs = await this._getUnspentOutputs(prefix, null);
        if (outputs.length === 1) {
          results.add(outputs[0]!);
        }
      }),
    );

    const resultArray = Array.from(results);
    if (txIns.length !== resultArray.length) {
      throw new Error("Inconsistent transaction inputs");
    }

    return resultArray;
  }

  /**
   * Gets the protocol parameters from the blockchain.
   * @returns A promise that resolves to the protocol parameters.
   */
  async getParameters(): Promise<ProtocolParameters> {
    const client = await this.createWebSocketClient(
      "queryLedgerState/protocolParameters",
      {},
    );

    return this.handleWebSocketResponse<
      QueryLedgerStateProtocolParametersResponse,
      ProtocolParameters
    >(client, (response) => {
      const result = response.result;
      const createCostModels = (version: string) => (result: any) => ({
        [version]: result.plutusCostModels?.[version]
          ? Object.fromEntries(
              result.plutusCostModels[version].map(
                (val: number, idx: string) => [idx, val],
              ),
            )
          : {},
      });

      const costModels = Object.assign(
        {},
        ...["plutus:v1", "plutus:v2", "plutus:v3"].map((version) =>
          createCostModels(version)(result),
        ),
      );

      return {
        coinsPerUtxoByte: result.minUtxoDepositCoefficient,
        maxTxSize: result.maxTransactionSize?.bytes || 0,
        minFeeCoefficient: result.minFeeCoefficient,
        minFeeConstant: Number(result.minFeeConstant.ada.lovelace),
        maxBlockBodySize: result.maxBlockBodySize.bytes,
        maxBlockHeaderSize: result.maxBlockHeaderSize.bytes,
        stakeKeyDeposit: Number(result.stakeCredentialDeposit.ada.lovelace),
        poolDeposit: result.stakePoolDeposit
          ? Number(result.stakePoolDeposit.ada.lovelace)
          : null,
        poolRetirementEpochBound: result.stakePoolRetirementEpochBound,
        desiredNumberOfPools: result.desiredNumberOfStakePools,
        poolInfluence: result.stakePoolPledgeInfluence.toString(),
        monetaryExpansion: result.monetaryExpansion.toString(),
        treasuryExpansion: result.treasuryExpansion.toString(),
        minPoolCost: Number(result.minStakePoolCost.ada.lovelace),
        protocolVersion: {
          major: result.version.major,
          minor: result.version.minor,
        },
        maxValueSize: result.maxValueSize?.bytes || 0,
        collateralPercentage: result.collateralPercentage || 0,
        maxCollateralInputs: result.maxCollateralInputs || 0,
        costModels: costModels || {},
        prices: {
          steps: this.parseFraction(result.scriptExecutionPrices!.cpu),
          memory: this.parseFraction(result.scriptExecutionPrices!.memory),
        },
        maxExecutionUnitsPerTransaction: {
          steps: result.maxExecutionUnitsPerTransaction!.cpu,
          memory: result.maxExecutionUnitsPerTransaction!.memory,
        },
        maxExecutionUnitsPerBlock: {
          steps: result.maxExecutionUnitsPerBlock!.cpu,
          memory: result.maxExecutionUnitsPerBlock!.memory,
        },
      } as ProtocolParameters;
    });
  }

  /**
   * Resolves the datum for a given datum hash.
   * @param datumHash - Hash of the datum to resolve.
   * @returns A promise that resolves to the Plutus data.
   */
  async resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    const url = `${this.kupoUrl}/datums/${datumHash}`;
    const result: any = await fetch(url).then((res) => res.json());
    if (!result || !result.datum) {
      throw new Error(`No datum found for datum hash: ${datumHash}`);
    }
    return result.datum;
  }

  /**
   * Awaits confirmation of a transaction.
   * @param txId - ID of the transaction to await confirmation for.
   * @param timeout - Optional timeout in milliseconds.
   * @returns A promise that resolves to a boolean indicating confirmation status.
   */
  async awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {
    const startTime = Date.now();
    let confirmed = false;

    const checkConfirmation = async () => {
      const response = await fetch(`${this.kupoUrl}/matches/0@${txId}`);
      if (response.ok) {
        confirmed = true;
      } else if (Date.now() - startTime < (timeout || 0)) {
        setTimeout(checkConfirmation, 20000);
      }
    };

    await checkConfirmation();
    return confirmed;
  }

  /**
   * Posts a transaction to the blockchain.
   * @param tx - Transaction to post.
   * @returns A promise that resolves to the transaction ID.
   */
  async postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    const client = await this.createWebSocketClient("submitTransaction", {
      transaction: { cbor: tx.toCbor() },
    });

    return this.handleWebSocketResponse<any, any>(client, (response) => {
      if ("result" in response) {
        return response.result.transaction.id;
      } else {
        throw response.error;
      }
    });
  }

  /**
   * Evaluates a transaction.
   * @param _tx - Transaction to evaluate.
   * @param _additionalUtxos - Additional UTXOs to consider.
   * @returns A promise that resolves to the redeemers.
   */
  async evaluateTransaction(
    _tx: Transaction,
    _additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    // Implementation logic to evaluate the transaction
    // Placeholder implementation
    return {} as Redeemers;
  }
}
