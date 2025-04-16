import type {
  AssetId,
  DatumHash,
  Transaction,
  ProtocolParameters,
  CostModels,
  Credential,
} from "@blaze-cardano/core";
import { NetworkId, RedeemerTag } from "@blaze-cardano/core";
import {
  TransactionUnspentOutput,
  Address,
  TransactionInput,
  PlutusData,
  TransactionId,
  TransactionOutput,
  HexBlob,
  PlutusLanguageVersion,
  fromHex,
  AddressType,
  Redeemers,
  ExUnits,
} from "@blaze-cardano/core";
import { Provider } from "./provider";

export class Maestro extends Provider {
  private url: string;
  private apiKey: string;

  constructor({
    network,
    apiKey,
  }: {
    network: "mainnet" | "preview" | "preprod";
    apiKey: string;
  }) {
    super(network == "mainnet" ? NetworkId.Mainnet : NetworkId.Testnet);
    this.url = `https://${network}.gomaestro-api.org/v1`;
    this.apiKey = apiKey;
  }

  private headers() {
    return { "api-key": this.apiKey };
  }

  /**
   * This method fetches the protocol parameters from the Maestro API.
   * It constructs the query URL, sends a GET request with the appropriate headers, and processes the response.
   * The response is parsed into a ProtocolParameters object, which is then returned.
   * If the response is not in the expected format, an error is thrown.
   * @returns A Promise that resolves to a ProtocolParameters object.
   */
  getParameters(): Promise<ProtocolParameters> {
    const query = `/protocol-parameters`;
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
            params.plutus_cost_models,
          ) as MaestroLanguageVersions[]) {
            costModels.set(
              fromMaestroLanguageVersion(cm),
              params.plutus_cost_models[cm],
            );
          }
          const parseRatio = (ratio: string): number => {
            const [numerator, denominator] = ratio.split("/").map(Number);
            return numerator! / denominator!;
          };

          return {
            coinsPerUtxoByte: params.min_utxo_deposit_coefficient,
            maxTxSize: params.max_transaction_size.bytes,
            minFeeCoefficient: params.min_fee_coefficient,
            minFeeConstant: params.min_fee_constant.ada.lovelace,
            maxBlockBodySize: params.max_block_body_size.bytes,
            maxBlockHeaderSize: params.max_block_header_size.bytes,
            stakeKeyDeposit: params.stake_credential_deposit.ada.lovelace,
            poolDeposit: params.stake_pool_deposit.ada.lovelace,
            poolRetirementEpochBound: params.stake_pool_retirement_epoch_bound,
            desiredNumberOfPools: params.desired_number_of_stake_pools,
            poolInfluence: params.stake_pool_pledge_influence,
            monetaryExpansion: params.monetary_expansion,
            treasuryExpansion: params.treasury_expansion,
            minPoolCost: params.min_stake_pool_cost.ada.lovelace,
            protocolVersion: params.version,
            maxValueSize: params.max_value_size.bytes,
            collateralPercentage: params.collateral_percentage,
            maxCollateralInputs: params.max_collateral_inputs,
            costModels: costModels,
            prices: {
              memory: parseRatio(params.script_execution_prices.memory),
              steps: parseRatio(params.script_execution_prices.cpu),
            },
            maxExecutionUnitsPerTransaction: {
              memory: params.max_execution_units_per_transaction.memory,
              steps: params.max_execution_units_per_transaction.cpu,
            },
            maxExecutionUnitsPerBlock: {
              memory: params.max_execution_units_per_block.memory,
              steps: params.max_execution_units_per_block.cpu,
            },
          } as ProtocolParameters;
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
            paymentPart: address.toCore(),
          }).toBech32()}/`;
    return fetch(`${this.url}${query}utxos?with_cbor=true&count=100`, {
      headers: this.headers(),
    })
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          const response = json as MaestroResponse<MaestroUTxOResponse>;
          if ("message" in response) {
            throw new Error(
              `getUnspentOutputs: Maestro threw "${response.message}"`,
            );
          }
          const utxos: TransactionUnspentOutput[] = [];
          for (const maestroUTxO of response.data) {
            const txIn = new TransactionInput(
              TransactionId(maestroUTxO.tx_hash),
              BigInt(maestroUTxO.index),
            );
            const txOut = TransactionOutput.fromCbor(
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

    return fetch(
      `${this.url}${query}utxos?with_cbor=true&count=100&asset=${asset}`,
      {
        headers: this.headers(),
      },
    )
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          const response = json as MaestroResponse<MaestroUTxOResponse>;
          if ("message" in response) {
            throw new Error(
              `getUnspentOutputs: Maestro threw "${response.message}"`,
            );
          }
          const utxos: TransactionUnspentOutput[] = [];
          for (const maestroUTxO of response.data) {
            const txIn = new TransactionInput(
              TransactionId(maestroUTxO.tx_hash),
              BigInt(maestroUTxO.index),
            );
            const txOut = TransactionOutput.fromCbor(
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
    return fetch(`${this.url}/assets/${unit}/utxos?count=2`, {
      headers: this.headers(),
    })
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          const response = json as MaestroResponse<MaestroUTxOResponse>;
          if ("message" in response) {
            throw new Error(
              `getUnspentOutputs: Maestro threw "${response.message}"`,
            );
          }

          const utxo = response.data[0];
          if (response.data.length !== 1 || !utxo) {
            throw new Error(
              "getUnspentOutputByNFT: Expected 1 UTxO, got " +
                response.data.length,
            );
          }

          return utxo;
        } else {
          throw new Error("getUnspentOutputs: Could not parse response json");
        }
      })
      .then((utxo) => {
        const txIn = new TransactionInput(
          TransactionId(utxo.tx_hash),
          BigInt(utxo.index),
        );
        const query = `/transactions/${utxo.tx_hash}/outputs/${utxo.index}/txo`;

        return fetch(`${this.url}${query}?with_cbor=true`, {
          headers: this.headers(),
        })
          .then((resp) => resp.json())
          .then((json) => {
            if (json) {
              const response = json as MaestroResponse<MaestroOneUTxOResponse>;
              if ("message" in response) {
                throw new Error(
                  `getUnspentOutputs: Maestro threw "${response.message}"`,
                );
              }

              const txOut = TransactionOutput.fromCbor(
                HexBlob(response.data.txout_cbor),
              );
              return new TransactionUnspentOutput(txIn, txOut);
            } else {
              throw new Error(
                "getUnspentOutputByNFT: Could not parse response json",
              );
            }
          });
      })
      .then((x) => x!);
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
    let finalResponse: boolean = false;
    const checkConfirmation = async () => {
      const response = await fetch(`${this.url}/transactions/${txId}/cbor`);
      if (response.ok) {
        finalResponse = true;
      } else if (Date.now() - startTime < (timeout || 0)) {
        await setTimeout(checkConfirmation, 20000);
      }
    };
    await checkConfirmation();
    return Promise.resolve(finalResponse);
  }

  async postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    const query = `/txmanager`;
    console.log("attempting to submit ", tx.toCbor());
    return fetch(`${this.url}${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/cbor",
        Accept: "text/plain",
        ...this.headers(),
      },
      body: fromHex(tx.toCbor()),
    })
      .then(async (resp) => {
        if (!resp.ok) {
          console.log(JSON.stringify(resp));
          const body = await resp.text();
          throw new Error(
            `postTransactionToChain: failed to submit transaction to Maestro endpoint. Status code ${body}`,
          );
        }
        return resp.text();
      })
      .then((result) => TransactionId(result));
  }

  async evaluateTransaction(
    tx: Transaction,
    additionalUtxos: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    const query = `/transactions/evaluate`;
    const request: {
      additional_utxos: MaestroAdditionalUTxO[];
      cbor: string;
    } = {
      additional_utxos: additionalUtxos.map((x) => ({
        txout_cbor: x.output().toCbor(),
        index: Number(x.input().index()),
        tx_hash: x.input().transactionId(),
      })),
      cbor: tx.toCbor(),
    };
    const response = await fetch(`${this.url}${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.headers(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.log(JSON.stringify(response));
      const body = await response.text();
      throw new Error(
        `evaluateTransaction: failed to evaluate transaction with Maestro endpoint. Status code ${body}`,
      );
    }

    const result = await response.json();
    const redeemers = tx.witnessSet().redeemers()?.values();
    if (!redeemers) {
      throw new Error("Cannot evaluate without redeemers!");
    }
    const lightRedeemers = result as MaestroRedeemer[];
    for (const redeemerData of lightRedeemers) {
      const index = BigInt(redeemerData.redeemer_index);
      const purpose = purposeFromTag(redeemerData.redeemer_tag);
      const exUnits = ExUnits.fromCore({
        memory: redeemerData.ex_units.mem,
        steps: redeemerData.ex_units.steps,
      });

      const redeemer = redeemers.find(
        (x) => x.tag() == purpose && x.index() == index,
      );
      if (!redeemer) {
        throw new Error(
          "evaluateTransaction: Maestro endpoint had extraneous redeemer data",
        );
      }
      redeemer.setExUnits(exUnits);
      // For extra verification: could make sure that the set of index,purposes is equal to the input set,
      // this would guarantee no cost calculations are missing
    }
    return Redeemers.fromCore(redeemers.map((x) => x.toCore()));
  }
}

type MaestroLanguageVersions = "plutus_v1" | "plutus_v2" | "plutus_v3";
const fromMaestroLanguageVersion = (
  x: MaestroLanguageVersions,
): PlutusLanguageVersion => {
  if (x == "plutus_v1") {
    return PlutusLanguageVersion.V1;
  } else if (x == "plutus_v2") {
    return PlutusLanguageVersion.V2;
  } else if (x == "plutus_v3") {
    return PlutusLanguageVersion.V3;
  }
  throw new Error("fromMaestroLanguageVersion: Unreachable!");
};

/**
 * Represents the response structure for protocol parameters from the Maestro API.
 * @see https://docs.gomaestro.org/Indexer%20API/Protocol%20Parameters
 */
interface MaestroProtocolParametersResponse {
  data: {
    /** Collateral percentage */
    collateral_percentage: number;
    /** Maximum term length for the constitutional committee */
    constitutional_committee_max_term_length: number;
    /** Minimum size of the constitutional committee */
    constitutional_committee_min_size: number;
    /** Deposit required for delegate representatives */
    delegate_representative_deposit: {
      ada: {
        lovelace: number;
      };
    };
    /** Maximum idle time for delegate representatives */
    delegate_representative_max_idle_time: number;
    /** Voting thresholds for delegate representatives */
    delegate_representative_voting_thresholds: {
      constitution: string;
      constitutional_committee: {
        default: string;
        state_of_no_confidence: string;
      };
      hard_fork_initiation: string;
      no_confidence: string;
      protocol_parameters_update: {
        economic: string;
        governance: string;
        network: string;
        technical: string;
      };
      treasury_withdrawals: string;
    };
    /** Desired number of stake pools */
    desired_number_of_stake_pools: number;
    /** Deposit required for governance actions */
    governance_action_deposit: {
      ada: {
        lovelace: number;
      };
    };
    /** Lifetime of governance actions */
    governance_action_lifetime: number;
    /** Maximum block body size in bytes */
    max_block_body_size: {
      bytes: number;
    };
    /** Maximum block header size in bytes */
    max_block_header_size: {
      bytes: number;
    };
    /** Maximum number of collateral inputs */
    max_collateral_inputs: number;
    /** Maximum execution units per block */
    max_execution_units_per_block: {
      cpu: number;
      memory: number;
    };
    /** Maximum execution units per transaction */
    max_execution_units_per_transaction: {
      cpu: number;
      memory: number;
    };
    /** Maximum size of reference scripts */
    max_reference_scripts_size: {
      bytes: number;
    };
    /** Maximum transaction size in bytes */
    max_transaction_size: {
      bytes: number;
    };
    /** Maximum value size in bytes */
    max_value_size: {
      bytes: number;
    };
    /** Minimum fee coefficient */
    min_fee_coefficient: number;
    /** Minimum fee constant */
    min_fee_constant: {
      ada: {
        lovelace: number;
      };
    };
    /** Minimum fee for reference scripts */
    min_fee_reference_scripts: {
      base: number;
      multiplier: number;
      range: number;
    };
    /** Minimum stake pool cost */
    min_stake_pool_cost: {
      ada: {
        lovelace: number;
      };
    };
    /** Minimum UTxO deposit coefficient */
    min_utxo_deposit_coefficient: number;
    /** Minimum UTxO deposit constant */
    min_utxo_deposit_constant: {
      ada: {
        lovelace: number;
      };
    };
    /** Monetary expansion rate */
    monetary_expansion: string;
    /** Plutus cost models for different versions */
    plutus_cost_models: {
      plutus_v1: number[];
      plutus_v2: number[];
      plutus_v3: number[];
    };
    /** Script execution prices */
    script_execution_prices: {
      cpu: string;
      memory: string;
    };
    /** Stake credential deposit */
    stake_credential_deposit: {
      ada: {
        lovelace: number;
      };
    };
    /** Stake pool deposit */
    stake_pool_deposit: {
      ada: {
        lovelace: number;
      };
    };
    /** Stake pool pledge influence */
    stake_pool_pledge_influence: string;
    /** Stake pool retirement epoch bound */
    stake_pool_retirement_epoch_bound: number;
    /** Stake pool voting thresholds */
    stake_pool_voting_thresholds: {
      constitutional_committee: {
        default: string;
        state_of_no_confidence: string;
      };
      hard_fork_initiation: string;
      no_confidence: string;
      protocol_parameters_update: {
        security: string;
      };
    };
    /** Treasury expansion rate */
    treasury_expansion: string;
    /** Protocol version */
    version: {
      major: number;
      minor: number;
    };
  };
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

interface MaestroRedeemer {
  ex_units: {
    mem: number;
    steps: number;
  };
  redeemer_index: number;
  redeemer_tag: string;
}

interface MaestroAdditionalUTxO {
  index: number;
  tx_hash: string;
  txout_cbor: string;
}

function purposeFromTag(tag: string): RedeemerTag {
  const tagMap: { [key: string]: RedeemerTag } = {
    spend: RedeemerTag.Spend,
    mint: RedeemerTag.Mint,
    cert: RedeemerTag.Cert,
    wdrl: RedeemerTag.Reward,
  };

  const normalizedTag = tag.toLowerCase();

  if (normalizedTag in tagMap) {
    return tagMap[normalizedTag]!;
  } else {
    throw new Error(`Invalid tag: ${tag}.`);
  }
}
