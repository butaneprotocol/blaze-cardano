import type {
  ProtocolParameters,
  DatumHash,
  HexBlob,
  ScriptHash,
  Redeemer,
  Transaction,
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
  Redeemers,
  PlutusData,
  Datum,
  ExUnits,
  Script,
  NativeScript,
  PlutusV1Script,
  PlutusV2Script,
  PlutusV3Script,
} from "@blaze-cardano/core";
import WebSocket from "ws";
import type * as ogmios from "@cardano-ogmios/schema";
import { purposeToTag, type Provider } from "./types";

export class Kupmios implements Provider {
  kupoUrl: string;
  ogmiosUrl: string;

  static readonly plutusVersions: string[] = [
    "plutus:v1",
    "plutus:v2",
    "plutus:v3",
  ];

  static readonly confirmationTimeout: number = 20_000;

  /**
   * Constructor to initialize Kupmios instance.
   * @param kupoUrl - URL of the Kupo service.
   * @param ogmiosUrl - URL of the Ogmios service.
   */
  constructor(kupoUrl: string, ogmiosUrl: string) {
    this.kupoUrl = kupoUrl;
    this.ogmiosUrl = ogmiosUrl;
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
          JSON.stringify(
            {
              jsonrpc: "2.0",
              method,
              params,
            },
            // Todo: Will `Number(bigint)` work properly in browser or node? Not sure.
            (_, value: any) =>
              typeof value === "bigint" ? Number(value) : value,
          ),
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
   * Fetches unspent outputs using Kupo API.
   * @param prefix - Prefix for the URL.
   * @param postfix - Postfix for the URL.
   * @returns A promise that resolves to an array of fully resolved unspent outputs.
   */
  private async _getUnspentOutputs(
    prefix: string | null,
    postfix: string | null,
  ): Promise<TransactionUnspentOutput[]> {
    const url = `${this.kupoUrl}/matches/${prefix ? prefix : "*"}?unspent${postfix ? postfix : ""}`;
    // Debug: console.log(`Fetching unspent outputs from ${url}`);
    const result: any = await fetch(url).then((res) => res.json());

    return await Promise.all(
      result.map(async (utxo: any) => {
        // Input params
        const transactionId = utxo.transaction_id;
        const outputIndex = BigInt(utxo.output_index);

        // Output params
        const address = Address.fromBech32(utxo.address);
        const coins = BigInt(utxo.value.coins);
        const assets = utxo.value.assets;

        const tokenMap: TokenMap = Object.keys(assets).reduce((map, unit) => {
          map.set(AssetId(unit), BigInt(assets[unit]));
          return map;
        }, new Map());

        const value = new Value(coins, tokenMap);

        const output = new TransactionOutput(address, value);

        // Handle datums
        // Todo: check if utxo has a datum_hash in the case when plutus's script is used.
        if (utxo.datum_hash) {
          const datum =
            utxo.datum_type === "hash"
              ? new Datum(utxo.datum_hash, undefined)
              : new Datum(undefined, await this.resolveDatum(utxo.datum_hash));

          output.setDatum(datum);
        }

        // Handle script references
        // Todo: this is a quite expensive operation.
        if (utxo.script_hash) {
          const scriptRef = await this.resolveScript(utxo.script_hash);
          output.setScriptRef(scriptRef);
        }

        // Return resolved unspent output
        return new TransactionUnspentOutput(
          new TransactionInput(TransactionId(transactionId), outputIndex),
          output,
        );
      }),
    );
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
      ogmios.QueryLedgerStateProtocolParametersResponse,
      ProtocolParameters
    >(client, (response) => {
      const result = response.result;

      const createCostModels = (versions: string[], result: any) => {
        const costModels = new Map<number, number[]>();
        versions.forEach((version, index) => {
          costModels.set(
            index,
            result.plutusCostModels?.[version]
              ? result.plutusCostModels[version].map((val: number) => val)
              : [],
          );
        });
        return costModels;
      };

      const costModels = createCostModels(Kupmios.plutusVersions, result);

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
    return PlutusData.fromCbor(result.datum);
  }

  /**
   * Awaits confirmation of a transaction.
   * @param txId - ID of the transaction to await confirmation for.
   * @param timeout - Optional timeout in milliseconds.
   * @returns A promise that resolves to a boolean indicating confirmation status.
   */
  async awaitTransactionConfirmation(
    txId: TransactionId,
    // 5 times the Ogmios timeout.
    timeout: number = 5 * Kupmios.confirmationTimeout,
  ): Promise<boolean> {
    const startTime = Date.now();

    const checkConfirmation = async (): Promise<boolean> => {
      const response = await fetch(`${this.kupoUrl}/matches/0@${txId}`);
      if (response.ok) {
        return true;
      } else if (Date.now() - startTime < timeout) {
        await new Promise((resolve) =>
          setTimeout(resolve, Kupmios.confirmationTimeout),
        );
        return checkConfirmation();
      }
      return false;
    };

    return await checkConfirmation();
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
   * Resolves the scripts for a given script hash.
   * @param scriptHash - Hash of the script to resolve.
   * @returns A promise that resolves to the JSON represenation of the scrip.
   * Note: we should reconsider creating a class for this as it could be expensive operation
   */
  private async resolveScript(scriptHash: ScriptHash): Promise<Script> {
    const url = `${this.kupoUrl}/scripts/${scriptHash}`;
    const result: any = await fetch(url).then((res) => res.json());
    if (!result || !result.language || !result.script) {
      throw new Error(`No script found for script hash: ${scriptHash}`);
    }

    switch (result.language) {
      case "native":
        return Script.newNativeScript(NativeScript.fromCbor(result.script));
      case "plutus:v1":
        return Script.newPlutusV1Script(new PlutusV1Script(result.script));
      case "plutus:v2":
        return Script.newPlutusV2Script(new PlutusV2Script(result.script));
      case "plutus:v3":
        return Script.newPlutusV3Script(new PlutusV3Script(result.script));

      default:
        throw new Error(`Unsupported script language: ${result.language}`);
    }
  }

  /**
   * Evaluates a transaction.
   * @param tx - Transaction to evaluate.
   * @param additionalUtxos - Additional UTXOs to consider.
   * @returns A promise that resolves to the redeemers.
   */
  async evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    try {
      // Quick fail if there are no redeemers
      const redeemers = tx.witnessSet().redeemers()?.values();
      if (!redeemers) {
        throw new Error("Cannot evaluate without redeemers!");
      }

      // Serialize additional UTXOs to JSON format
      const additional_utxos = Kupmios.serializeUtxos(additionalUtxos);
      const client = await this.createWebSocketClient("evaluateTransaction", {
        transaction: { cbor: tx.toCbor() },
        additional_utxos,
      });

      // Handle the response
      return this.handleWebSocketResponse<any, any>(client, (response) => {
        if ("result" in response) {
          // Example results: [{"validator":{"index":0,"purpose":"spend"},"budget":{"memory":2301,"cpu":586656}}]
          const results: Array<any> = response.result;

          // TODO: check whether all redeemers are required to be returned.
          if (results.length !== redeemers.length) {
            throw new Error(
              "Kupmios endpoint returned inconsistent length of the redeemers",
            );
          }

          const updatedRedeemers = results.map((redeemerData: any): any => {
            const exUnits = ExUnits.fromCore({
              memory: redeemerData.budget.memory,
              steps: redeemerData.budget.cpu,
            });

            const redeemer: Redeemer | undefined = redeemers.find(
              (x: Redeemer) =>
                Number(x.index()) === redeemerData.validator.index &&
                // TODO: RedeemerPurpose enum's indexes are still inconsistent. They are not the same as RedeemerTag values.
                x.tag() === purposeToTag[redeemerData.validator.purpose],
            );

            if (!redeemer) {
              throw new Error(
                "Kupmios endpoint returned extraneous redeemer data",
              );
            }

            redeemer.setExUnits(exUnits);
            return redeemer.toCore();
          });

          return Redeemers.fromCore(updatedRedeemers);
        } else {
          throw response.error;
        }
      });
    } catch (error) {
      console.error("Error evaluating transaction:", error);
      throw error;
    }
  }

  /**
   * Serialize unspent outputs to JSON format.
   * @param unspentOutputs - Unspent outputs to serialize.
   * @returns the serialized unspent outputs.
   */
  static serializeUtxos(unspentOutputs: TransactionUnspentOutput[]): any[] {
    return unspentOutputs.map((output) => {
      const out = output.output();
      const address = out.address().toBech32();

      // Output parameters
      const ada = out.amount().coin().valueOf();

      const value: { [key: string]: any } = { ada: { lovelace: ada } };
      const multiAsset = out.amount().multiasset?.();
      multiAsset?.forEach((assets, assetId) => {
        const policyID = AssetId.getPolicyId(assetId);
        const assetName = AssetId.getAssetName(assetId);

        value[policyID] ??= {};
        value[policyID][assetName] = assets;
      });

      // Handle optional datum and datumHash
      const datumHash = out.datum()?.asDataHash()?.toString();
      const datum = out.datum()?.asInlineData()?.toCbor();

      // Handle optional script
      const scriptRef = out.scriptRef();

      let script:
        | {
            language: string;
            cbor: HexBlob;
            json?: { clause: string; from: string };
          }
        | undefined;
      if (scriptRef) {
        const language = Kupmios.plutusVersions[scriptRef.language()];

        script = {
          language: language || "native",
          cbor: scriptRef.toCbor(),
        };
        if (!language) {
          // Todo: handle native scripts properly.
          throw new Error("unimplemented");
        }
      }
      return {
        transaction: {
          id: output.input().transactionId().toString(),
        },
        index: Number(output.input().index()),
        address,
        value,
        datumHash,
        datum,
        script,
      };
    });
  }
}
