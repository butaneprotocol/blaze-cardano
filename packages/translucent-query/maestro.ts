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
} from "../translucent-core";
import { Provider } from "./types";

export class Maestro implements Provider {
  private url: string;
  private apiKey: string;

  constructor({ network, apiKey }: { network: string; apiKey: string }) {
    this.url = `https://${network}.gomaestro-api.org/v1`;
    this.apiKey = apiKey;
  }

  private headers() {
    return { "api-key": this.apiKey };
  }

  getParameters(): Promise<ProtocolParameters> {
    const query = `/protocol-params`;
    return fetch(`${this.url}${query}`, { headers: this.headers() })
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          const response =
            json as MaestroResponse<MaestroProtocolParametersResponse>;
          if ("message" in response) {
            throw new Error(
              `getUnspentOutputs: Maestro threw "${response.message}"`,
            );
          }
          const params = response.data;
          const costModels: CostModels = new Map();
          for (const cm of Object.keys(
            params.cost_models,
          ) as MaestroLanguageVersions[]) {
            let costModel: number[] = [];
            let keys = Object.keys(params.cost_models[cm]).sort();
            for (const key of keys) {
              costModel.push(params.cost_models[cm][key]);
            }
            costModels.set(fromMaestroLanguageVersion(cm), costModel);
          }
          return {
            coinsPerUtxoByte: params.coins_per_utxo_byte,
            maxTxSize: params.max_tx_size,
            minFeeCoefficient: params.min_fee_coefficient,
            minFeeConstant: params.min_fee_constant,
            maxBlockBodySize: params.max_block_body_size,
            maxBlockHeaderSize: params.max_block_header_size,
            stakeKeyDeposit: params.stake_key_deposit,
            poolDeposit: params.pool_deposit,
            poolRetirementEpochBound: params.pool_retirement_epoch_bound,
            desiredNumberOfPools: params.desired_number_of_pools,
            poolInfluence: params.pool_influence,
            monetaryExpansion: params.monetary_expansion,
            treasuryExpansion: params.treasury_expansion,
            minPoolCost: params.min_pool_cost,
            protocolVersion: params.protocol_version,
            maxValueSize: params.max_value_size,
            collateralPercentage: params.collateral_percentage / 100,
            maxCollateralInputs: params.max_collateral_inputs,
            costModels: costModels,
            prices: {
              memory: parseFloat(params.prices.memory) / 10000,
              steps: parseFloat(params.prices.steps) / 10000,
            },
            maxExecutionUnitsPerTransaction:
              params.max_execution_units_per_transaction,
            maxExecutionUnitsPerBlock: params.max_execution_units_per_block,
          };
        }
        throw new Error("getParameters: Could not parse response json");
      });
  }

  getUnspentOutputs(
    address: Address | Credential,
  ): Promise<TransactionUnspentOutput[]> {
    /* todo: paginate */
    const query =
      address instanceof Address
        ? `/addresses/${address.toBech32()}/`
        : `/addresses/cred/${new Address({
            type: AddressType.EnterpriseKey,
            paymentPart: address,
          }).toBech32()}/`;
    return fetch(`${this.url}${query}utxos?with_cbor=true&count=100`, {
      headers: this.headers(),
    })
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          let response = json as MaestroResponse<MaestroUTxOResponse>;
          if ("message" in response) {
            throw new Error(
              `getUnspentOutputs: Maestro threw "${response.message}"`,
            );
          }
          let utxos: TransactionUnspentOutput[] = [];
          for (const maestroUTxO of response.data) {
            let txIn = new TransactionInput(
              TransactionId(maestroUTxO.tx_hash),
              BigInt(maestroUTxO.index),
            );
            let txOut = TransactionOutput.fromCbor(
              HexBlob(maestroUTxO.txout_cbor),
            );
            utxos.push(new TransactionUnspentOutput(txIn, txOut));
          }
          return utxos;
        }
        throw new Error("getUnspentOutputs: Could not parse response json");
      });
  }

  getUnspentOutputsWithAsset(
    address: Address,
    unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    const query =
      address instanceof Address
        ? `/addresses/${address.toBech32()}/`
        : `/addresses/cred/${new Address({
            type: AddressType.EnterpriseKey,
            paymentPart: address,
          }).toBech32()}/`;

    // Not sure if unit is fine as is to use as a String or I need
    // to pull out PolicyId and AssetName from it and concatenate them
    const asset = unit;

    console.log("asset", asset);

    return fetch(
      `${this.url}${query}utxos?with_cbor=true&count=100&asset=${asset}`,
      {
        headers: this.headers(),
      },
    )
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          let response = json as MaestroResponse<MaestroUTxOResponse>;
          if ("message" in response) {
            throw new Error(
              `getUnspentOutputs: Maestro threw "${response.message}"`,
            );
          }
          let utxos: TransactionUnspentOutput[] = [];
          for (const maestroUTxO of response.data) {
            let txIn = new TransactionInput(
              TransactionId(maestroUTxO.tx_hash),
              BigInt(maestroUTxO.index),
            );
            let txOut = TransactionOutput.fromCbor(
              HexBlob(maestroUTxO.txout_cbor),
            );
            utxos.push(new TransactionUnspentOutput(txIn, txOut));
          }
          return utxos;
        }
        throw new Error("getUnspentOutputs: Could not parse response json");
      });
  }

  getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput> {
    const asset = unit;
    const query = `/assets/${asset}/`;

    return fetch(`${this.url}${query}utxos?count=100`, {
      headers: this.headers(),
    })
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          let response = json as MaestroResponse<MaestroUTxOResponse>;
          if ("message" in response) {
            throw new Error(
              `getUnspentOutputs: Maestro threw "${response.message}"`,
            );
          }
          let utxos: TransactionUnspentOutput[] = [];
          for (const maestroUTxO of response.data) {
            const txIn = new TransactionInput(
              TransactionId(maestroUTxO.tx_hash),
              BigInt(maestroUTxO.index),
            );

            const query2 = `/transactions/${maestroUTxO.tx_hash}/outputs/${maestroUTxO.index}/txo`;

            fetch(`${this.url}${query2}?with_cbor=true`, {
              headers: this.headers(),
            })
              .then((resp) => resp.json())
              .then((json) => {
                if (json) {
                  let response =
                    json as MaestroResponse<MaestroOneUTxOResponse>;
                  if ("message" in response) {
                    throw new Error(
                      `getUnspentOutputs: Maestro threw "${response.message}"`,
                    );
                  }

                  const txOut = TransactionOutput.fromCbor(
                    HexBlob(response.data.txout_cbor),
                  );
                  utxos.push(new TransactionUnspentOutput(txIn, txOut));
                } else {
                  throw new Error(
                    "getUnspentOutputByNFT: Could not parse response json",
                  );
                }
              });
          }

          if (utxos.length !== 1) {
            throw new Error(
              "getUnspentOutputByNFT: Expected 1 UTxO, got " + utxos.length,
            );
          }

          return utxos[0];
        }
        throw new Error("getUnspentOutputs: Could not parse response json");
      });
  }

  async resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    const query = `/transactions/outputs?with_cbor=true`;
    const txInStrings = txIns.map(
      (txIn) => `${txIn.transactionId()}#${txIn.index()}`,
    );

    try {
      const response = await fetch(`${this.url}${query}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...this.headers(),
        },
        body: JSON.stringify(txInStrings),
      });

      if (!response.ok) {
        throw new Error(
          `resolveUnspentOutputs: Failed to resolve unspent outputs from Maestro endpoint. Status code ${response.status}`,
        );
      }

      const json =
        (await response.json()) as MaestroResponse<MaestroUnspentOutputResolution>;

      if ("message" in json) {
        throw new Error(
          `resolveUnspentOutputs: Maestro threw "${json.message}"`,
        );
      }

      const resolvedOutputs: TransactionUnspentOutput[] = json.data.map(
        (output) => {
          const txIn = new TransactionInput(
            TransactionId(output.tx_hash),
            BigInt(output.index),
          );
          const txOut = TransactionOutput.fromCbor(HexBlob(output.txout_cbor));

          return new TransactionUnspentOutput(txIn, txOut);
        },
      );

      return resolvedOutputs;
    } catch (error) {
      console.error("resolveUnspentOutputs:", error);
      throw new Error("resolveUnspentOutputs: Unexpected error occurred");
    }
  }

  resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    const query = `/datums/${datumHash}`;
    return fetch(`${this.url}${query}`, {
      headers: this.headers(),
    })
      .then((resp) => resp.json() as Promise<MaestroDatumHashResolution>)
      .then((json) => {
        if (json) {
          return PlutusData.fromCbor(HexBlob(json.data.bytes));
        }
        throw new Error("resolveDatum: Could not parse response json");
      });
  }

  async awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {
    const startTime = Date.now();
    const checkConfirmation = async () => {
      const response = await fetch(`${this.url}/transactions/${txId}/cbor`);
      if (response.ok) {
        return true;
      } else if (Date.now() - startTime < (timeout || 0)) {
        setTimeout(checkConfirmation, 20000);
      } else {
        return false;
      }
    };
    let result = await checkConfirmation();
    if (!result) {
      throw new Error("awaitTransactionConfirmation: unexpected error!");
    }
    return Promise.resolve(result);
  }

  postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    const query = `/submit/tx`;
    return fetch(`${this.url}${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/cbor",
        Accept: "text/plain",
        ...this.headers(),
      },
      body: fromHex(tx.toCbor()),
    })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error(
            `postTransactionToChain: failed to submit transaction to Maestro endpoint. Status code ${resp.status}`,
          );
        }
        return resp.text();
      })
      .then((result) => TransactionId(result));
  }
}

type MaestroLanguageVersions = "plutus:v1" | "plutus:v2";
const fromMaestroLanguageVersion = (
  x: MaestroLanguageVersions,
): PlutusLanguageVersion => {
  if (x == "plutus:v1") {
    return PlutusLanguageVersion.V1;
  } else if (x == "plutus:v2") {
    return PlutusLanguageVersion.V2;
  }
  throw new Error("fromMaestroLanguageVersion: Unreachable!");
};

interface MaestroProtocolParametersResponse {
  data: {
    min_fee_coefficient: number;
    min_fee_constant: number;
    max_block_body_size: number;
    max_block_header_size: number;
    max_tx_size: number;
    stake_key_deposit: number;
    pool_deposit: number;
    pool_retirement_epoch_bound: number;
    desired_number_of_pools: number;
    pool_influence: string;
    monetary_expansion: string;
    treasury_expansion: string;
    protocol_version: {
      major: number;
      minor: number;
    };
    min_pool_cost: number;
    coins_per_utxo_byte: number;
    cost_models: Record<MaestroLanguageVersions, { [key: string]: number }>;
    prices: {
      memory: string;
      steps: string;
    };
    max_execution_units_per_transaction: {
      memory: number;
      steps: number;
    };
    max_execution_units_per_block: {
      memory: number;
      steps: number;
    };
    max_value_size: number;
    collateral_percentage: number;
    max_collateral_inputs: number;
  };
  last_updated: MaestroLastUpdated;
}

type MaestroResponse<SomeResponse> = SomeResponse | { message: string };

interface MaestroUTxOResponse {
  data: MaestroTransaction[];
  last_updated: MaestroLastUpdated;
  next_cursor: null;
}

interface MaestroOneUTxOResponse {
  data: MaestroUtxoCbor;
  last_updated: MaestroLastUpdated;
  next_cursor: null;
}

interface MaestroTransaction {
  tx_hash: string;
  index: number;
  slot: number;
  txout_cbor: string;
}

interface MaestroUtxoCbor {
  txout_cbor: string;
}

interface MaestroLastUpdated {
  timestamp: string;
  block_hash: string;
  block_slot: number;
}

interface MaestroDatumHashResolution {
  data: {
    json: any;
    bytes: string;
  };
  last_updated: MaestroLastUpdated;
}

interface MaestroUnspentOutputResolution {
  data: {
    tx_hash: string;
    index: number;
    assets: {
      unit: string;
      amount: string;
    }[];
    address: string;
    datum?: {
      type: "inline";
      hash: string;
      bytes: string;
      json: any;
    };
    reference_script?: string;
    txout_cbor: string;
  }[];
  last_updated: MaestroLastUpdated;
  next_cursor: null;
}
