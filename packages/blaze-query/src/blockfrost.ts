/* big todo. likely leave this for an external contributor! */

import type {
  Address,
  AssetId,
  CostModels,
  Credential,
  DatumHash,
  PlutusData,
  ProtocolParameters,
  Redeemers,
  Transaction,
  TransactionId,
  TransactionInput,
  TransactionUnspentOutput,
} from "@blaze-cardano/core";
import { PlutusLanguageVersion } from "@blaze-cardano/core";
import type { Provider } from "./types";
import {
  hardCodedProtocolParams,
  PlutusLanguageVersion,
} from "@blaze-cardano/core";

export class Blockfrost implements Provider {
  url: string;
  private projectId: string;

  constructor({
    network,
    projectId,
  }: {
    network:
      | "cardano-preview"
      | "cardano-preprod"
      | "cardano-mainnet"
      | "cardano-sanchonet";
    projectId: string;
  }) {
    this.url = `https://${network}.blockfrost.io/api/v0/`;
    this.projectId = projectId;
  }

  headers() {
    return { project_id: this.projectId };
  }

  getParameters(): Promise<ProtocolParameters> {
    const query = "epochs/latest/parameters";
    return fetch(`${this.url}${query}`, { headers: this.headers() })
      .then((resp) => resp.json())
      .then((json) => {
        if (json) {
          const response =
            json as BlockfrostResponse<BlockfrostProtocolParametersResponse>;
          if ("message" in response) {
            throw new Error(
              `getParameters: Blockfrost threw "${response.message}"`,
            );
          }
          const costModels: CostModels = new Map();
          for (const cm of Object.keys(
            response.cost_models,
          ) as BlockfrostLanguageVersions[]) {
            const costModel: number[] = [];
            const keys = Object.keys(response.cost_models[cm]).sort();
            for (const key of keys) {
              costModel.push(response.cost_models[cm][key]!);
            }
            costModels.set(fromBlockfrostLanguageVersion(cm), costModel);
          }

          // Return whatever for now
          return Object.assign(hardCodedProtocolParams, { costModels });
        }
        throw new Error("getParameters: Could not parse response json");
      });
  }

  getUnspentOutputs(
    _address: Address | Credential,
  ): Promise<TransactionUnspentOutput[]> {
    /* todo: paginate */
    throw new Error("unimplemented");
  }

  getUnspentOutputsWithAsset(
    _address: Address,
    _unit: AssetId,
  ): Promise<TransactionUnspentOutput[]> {
    throw new Error("unimplemented");
  }

  getUnspentOutputByNFT(_unit: AssetId): Promise<TransactionUnspentOutput> {
    throw new Error("unimplemented");
  }

  async resolveUnspentOutputs(
    _txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    throw new Error("unimplemented");
  }

  resolveDatum(_datumHash: DatumHash): Promise<PlutusData> {
    throw new Error("unimplemented");
  }

  async awaitTransactionConfirmation(
    _txId: TransactionId,
    _timeout?: number,
  ): Promise<boolean> {
    throw new Error("unimplemented");
  }

  async postTransactionToChain(_tx: Transaction): Promise<TransactionId> {
    throw new Error("unimplemented");
  }

  async evaluateTransaction(_tx: Transaction): Promise<Redeemers> {
    throw new Error("unimplemented");
  }
}

type BlockfrostLanguageVersions = "PlutusV1" | "PlutusV2" | "PlutusV3";
export const fromBlockfrostLanguageVersion = (
  x: BlockfrostLanguageVersions,
): PlutusLanguageVersion => {
  if (x == "PlutusV1") {
    return PlutusLanguageVersion.V1;
  } else if (x == "PlutusV2") {
    return PlutusLanguageVersion.V2;
  } else if (x == "PlutusV3") {
    return PlutusLanguageVersion.V3;
  }
  throw new Error("fromBlockfrostLanguageVersion: Unreachable!");
};

export interface BlockfrostProtocolParametersResponse {
  epoch: number;
  min_fee_a: number;
  min_fee_b: number;
  max_block_size: number;
  max_tx_size: number;
  max_block_header_size: number;
  key_deposit: string;
  pool_deposit: string;
  e_max: number;
  n_opt: number;
  a0: number;
  rho: number;
  tau: number;
  decentralisation_param: number;
  extra_entropy: null;
  protocol_major_ver: number;
  protocol_minor_ver: number;
  min_utxo: string;
  min_pool_cost: string;
  nonce: string;
  cost_models: Record<BlockfrostLanguageVersions, { [key: string]: number }>;
  price_mem: number;
  price_step: number;
  max_tx_ex_mem: string;
  max_tx_ex_steps: string;
  max_block_ex_mem: string;
  max_block_ex_steps: string;
  max_val_size: string;
  collateral_percent: number;
  max_collateral_inputs: number;
  coins_per_utxo_size: string;
}

type BlockfrostResponse<SomeResponse> = SomeResponse | { message: string };
