import type {
  AssetId as AssetIdType,
  CostModels,
  Credential,
  DatumHash,
  ProtocolParameters,
  Redeemer,
  TokenMap,
  Transaction,
} from "@blaze-cardano/core";
import {
  Address,
  AddressType,
  AssetId,
  ExUnits,
  fromHex,
  HexBlob,
  PlutusData,
  Redeemers,
  RedeemerTag,
  TransactionId,
  TransactionInput,
  TransactionOutput,
  TransactionUnspentOutput,
  Value,
} from "@blaze-cardano/core";
import { PlutusLanguageVersion } from "@blaze-cardano/core";
import type { Provider } from "./types";

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

  /**
   * This method fetches the protocol parameters from the Blockfrost API.
   * It constructs the query URL, sends a GET request with the appropriate headers, and processes the response.
   * The response is parsed into a ProtocolParameters object, which is then returned.
   * If the response is not in the expected format, an error is thrown.
   * @returns A Promise that resolves to a ProtocolParameters object.
   */
  async getParameters(): Promise<ProtocolParameters> {
    const query = "epochs/latest/parameters";
    const json = await fetch(`${this.url}${query}`, {
      headers: this.headers(),
    }).then((resp) => resp.json());

    if (!json) {
      throw new Error("getParameters: Could not parse response json");
    }

    const response =
      json as BlockfrostResponse<BlockfrostProtocolParametersResponse>;

    if ("message" in response) {
      throw new Error(`getParameters: Blockfrost threw "${response.message}"`);
    }
    // Build cost models
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

    return {
      coinsPerUtxoByte: response.coins_per_utxo_size,
      maxTxSize: response.max_tx_size,
      minFeeCoefficient: response.min_fee_a,
      minFeeConstant: response.min_fee_b,
      maxBlockBodySize: response.max_block_size,
      maxBlockHeaderSize: response.max_block_header_size,
      stakeKeyDeposit: response.key_deposit,
      poolDeposit: response.pool_deposit,
      poolRetirementEpochBound: response.e_max,
      desiredNumberOfPools: response.n_opt,
      poolInfluence: response.a0,
      monetaryExpansion: response.rho,
      treasuryExpansion: response.tau,
      minPoolCost: response.min_pool_cost,
      protocolVersion: {
        major: response.protocol_major_ver,
        minor: response.protocol_minor_ver,
      },
      maxValueSize: response.max_val_size,
      collateralPercentage: response.collateral_percent / 100,
      maxCollateralInputs: response.max_collateral_inputs,
      costModels: costModels,
      prices: {
        memory: parseFloat(response.price_mem),
        steps: parseFloat(response.price_step),
      },
      maxExecutionUnitsPerTransaction: {
        memory: response.max_tx_ex_mem,
        steps: response.max_tx_ex_steps,
      },
      maxExecutionUnitsPerBlock: {
        memory: response.max_block_ex_mem,
        steps: response.max_block_ex_steps,
      },
    };
  }

  /**
   * This method fetches the UTxOs under a given address.
   * The response is parsed into a TransactionUnspentOutput[] type, which is
   * then returned.
   * If the response is not in the expected format, an error is thrown.
   * @param address - The Address or Payment Credential
   * @returns A Promise that resolves to TransactionUnspentOutput[].
   */
  async getUnspentOutputs(
    address: Address | Credential,
  ): Promise<TransactionUnspentOutput[]> {
    // 100 per page is max allowed by Blockfrost
    const maxPageCount = 100;
    let page = 1;

    const bech32 =
      address instanceof Address
        ? address.toBech32()
        : new Address({
            type: AddressType.EnterpriseKey,
            paymentPart: address.toCore(),
          }).toBech32();

    const buildTxUnspentOutput = buildTransactionUnspentOutput(
      Address.fromBech32(bech32),
    );

    const results: Set<TransactionUnspentOutput> = new Set();

    for (;;) {
      const pagination = `count=${maxPageCount}&page=${page}`;
      const query = `/addresses/${bech32}/utxos?${pagination}`;
      const json = await fetch(`${this.url}${query}`, {
        headers: this.headers(),
      }).then((resp) => resp.json());

      if (!json) {
        throw new Error("getUnspentOutputs: Could not parse response json");
      }

      const response = json as BlockfrostResponse<BlockfrostUTxO[]>;

      if ("message" in response) {
        throw new Error(
          `getUnspentOutputs: Blockfrost threw "${response.message}"`,
        );
      }

      for (const blockfrostUTxO of response) {
        results.add(buildTxUnspentOutput(blockfrostUTxO));
      }

      if (response.length < maxPageCount) {
        break;
      } else {
        page = page + 1;
      }
    }

    return Array.from(results);
  }

  /**
   * This method fetches the UTxOs under a given address that hold
   * a particular asset.
   * The response is parsed into a TransactionUnspentOutput[] type, which is
   * then returned.
   * If the response is not in the expected format, an error is thrown.
   * @param address - Address or Payment Credential.
   * @param unit - The AssetId
   * @returns A Promise that resolves to TransactionUnspentOutput[].
   */
  async getUnspentOutputsWithAsset(
    address: Address | Credential,
    unit: AssetIdType,
  ): Promise<TransactionUnspentOutput[]> {
    // 100 per page is max allowed by Blockfrost
    const maxPageCount = 100;
    let page = 1;

    const bech32 =
      address instanceof Address
        ? address.toBech32()
        : new Address({
            type: AddressType.EnterpriseKey,
            paymentPart: address.toCore(),
          }).toBech32();

    const buildTxUnspentOutput = buildTransactionUnspentOutput(
      Address.fromBech32(bech32),
    );

    const asset = AssetId.getPolicyId(unit) + AssetId.getAssetName(unit);

    const results: Set<TransactionUnspentOutput> = new Set();

    for (;;) {
      const pagination = `count=${maxPageCount}&page=${page}`;
      const query = `/addresses/${bech32}/utxos/${asset}?${pagination}`;
      const json = await fetch(`${this.url}${query}`, {
        headers: this.headers(),
      }).then((resp) => resp.json());

      if (!json) {
        throw new Error(
          "getUnspentOutputsWithAsset: Could not parse response json",
        );
      }

      const response = json as BlockfrostResponse<BlockfrostUTxO[]>;

      if ("message" in response) {
        throw new Error(
          `getUnspentOutputsWithAsset: Blockfrost threw "${response.message}"`,
        );
      }

      for (const blockfrostUTxO of response) {
        results.add(buildTxUnspentOutput(blockfrostUTxO));
      }

      if (response.length < maxPageCount) {
        break;
      } else {
        page = page + 1;
      }
    }

    return Array.from(results);
  }

  /**
   * This method fetches the UTxO that holds a particular NFT given as
   * argument.
   * The response is parsed into a TransactionUnspentOutput type, which is
   * then returned.
   * If the response is not in the expected format, an error is thrown.
   * @param nft - The AssetId for the NFT
   * @returns A Promise that resolves to TransactionUnspentOutput.
   */
  async getUnspentOutputByNFT(nft: AssetId): Promise<TransactionUnspentOutput> {
    const asset = AssetId.getPolicyId(nft) + AssetId.getAssetName(nft);
    // Fetch addresses holding the asset. Since it's an NFT, a single
    // address is expected to be returned
    const query = `/assets/${asset}/addresses`;
    const json = await fetch(`${this.url}${query}`, {
      headers: this.headers(),
    }).then((resp) => resp.json());

    if (!json) {
      throw new Error("getUnspentOutputByNFT: Could not parse response json");
    }

    const response = json as BlockfrostResponse<BlockfrostAssetAddress[]>;

    if ("message" in response) {
      throw new Error(
        `getUnspentOutputByNFT: Blockfrost threw "${response.message}"`,
      );
    }
    // Ensures a single asset address is returned
    if (response.length !== 1) {
      throw new Error(
        "getUnspentOutputByNFT: Asset must be held by only one address. Multiple found.",
      );
    }

    const utxo = response[0] as BlockfrostAssetAddress;
    const address = Address.fromBech32(utxo.address);
    // A second call to Blockfrost is needed in order to fetch utxo information
    const utxos = await this.getUnspentOutputsWithAsset(address, nft);
    // Ensures a single UTxO holds the asset
    if (utxos.length !== 1) {
      throw new Error(
        "getUnspentOutputByNFT: Asset must be present in only one UTxO. Multiple found.",
      );
    }

    return utxos[0]!;
  }

  /**
   * This method resolves transaction outputs from a list of transaction
   * inputs given as argument.
   * The response is parsed into a TransactionUnspentOutput[] type, which is
   * then returned.
   * If the response is not in the expected format, an error is thrown.
   * @param txIns - A list of TransactionInput
   * @returns A Promise that resolves to TransactionUnspentOutput[].
   */
  async resolveUnspentOutputs(
    txIns: TransactionInput[],
  ): Promise<TransactionUnspentOutput[]> {
    const results: Set<TransactionUnspentOutput> = new Set();

    for (const txIn of txIns) {
      const query = `/txs/${txIn.transactionId()}/utxos`;
      const json = await fetch(`${this.url}${query}`, {
        headers: this.headers(),
      }).then((resp) => resp.json());

      if (!json) {
        throw new Error("resolveUnspentOutputs: Could not parse response json");
      }

      const response =
        json as BlockfrostResponse<BlockfrostUnspentOutputResolution>;

      if ("message" in response) {
        throw new Error(
          `resolveUnspentOutputs: Blockfrost threw "${response.message}"`,
        );
      }

      const txIndex = BigInt(txIn.index());

      for (const blockfrostUTxO of response.outputs) {
        if (BigInt(blockfrostUTxO.output_index) !== txIndex) {
          // Ignore outputs whose index don't match
          // the index we are looking for
          continue;
        }
        // Blockfrost API does not return tx hash, so it must be manually set
        blockfrostUTxO.tx_hash = txIn.transactionId();

        const buildTxUnspentOutput = buildTransactionUnspentOutput(
          Address.fromBech32(blockfrostUTxO.address),
        );

        results.add(buildTxUnspentOutput(blockfrostUTxO));
      }
    }

    return Array.from(results);
  }

  /**
   * This method returns the datum for the datum hash given as argument.
   * The response is parsed into a PlutusData type, which is then returned.
   * If the response is not in the expected format, an error is thrown.
   * @param datumHash - The hash of a datum
   * @returns A Promise that resolves to PlutusData
   */
  async resolveDatum(datumHash: DatumHash): Promise<PlutusData> {
    const query = `/scripts/datum/${datumHash}/cbor`;
    const json = await fetch(`${this.url}${query}`, {
      headers: this.headers(),
    }).then((resp) => resp.json());

    if (!json) {
      throw new Error("resolveDatum: Could not parse response json");
    }

    const response = json as BlockfrostResponse<BlockfrostDatumHashResolution>;

    if ("message" in response) {
      throw new Error(`resolveDatum: Blockfrost threw "${response.message}"`);
    }

    return PlutusData.fromCbor(HexBlob(response.cbor));
  }

  /**
   * This method awaits confirmation of the transaction given as argument.
   * The response is parsed into a boolean, which is then returned.
   * If tx is not confirmed at first and no value for timeout is provided,
   * then false is returned.
   * If tx is not confirmed at first and a value for timeout (in ms) is given,
   * then subsequent checks will be performed at a 20 second interval until
   * timeout is reached.
   * @param txId - The hash of a transaction
   * @param timeout - An optional timeout for waiting for confirmation. This
   * value should be greater than average block time of 20000 ms
   * @returns A Promise that resolves to a boolean
   */
  async awaitTransactionConfirmation(
    txId: TransactionId,
    timeout?: number,
  ): Promise<boolean> {
    const averageBlockTime = 20_000;

    if (timeout && timeout < averageBlockTime) {
      console.log("Warning: timeout given is less than average block time.");
    }

    const query = `/txs/${txId}/metadata/cbor`;
    const startTime = Date.now();

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const checkConfirmation = async () => {
      const response = await fetch(`${this.url}${query}`, {
        headers: this.headers(),
      });

      return response.ok;
    };

    if (await checkConfirmation()) {
      return true;
    }

    if (timeout) {
      while (Date.now() - startTime < timeout) {
        await delay(averageBlockTime);

        if (await checkConfirmation()) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * This method submits a transaction to the chain.
   * @param tx - The Transaction
   * @returns A Promise that resolves to a TransactionId type
   */
  async postTransactionToChain(tx: Transaction): Promise<TransactionId> {
    const query = "/tx/submit";
    const response = await fetch(`${this.url}${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/cbor",
        Accept: "text/plain",
        ...this.headers(),
      },
      body: fromHex(tx.toCbor()),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `postTransactionToChain: failed to submit transaction to Blockfrost endpoint.\nError ${error}`,
      );
    }

    const txId = await response.text();
    return TransactionId(txId);
  }

  /**
   * This method evaluates how much execution units a transaction requires.
   * Optionally, additional outputs can be provided. These are added to the
   * evaluation without checking for their presence on-chain. This is useful
   * when performing transaction chaining, where some outputs used as inputs
   * to a transaction will have not yet been submitted to the network.
   * @param tx - The Transaction
   * @param additionalUtxos - Optional utxos to be added to the evaluation.
   * @returns A Promise that resolves to a Redeemers type
   */
  async evaluateTransaction(
    tx: Transaction,
    additionalUtxos?: TransactionUnspentOutput[],
  ): Promise<Redeemers> {
    const currentRedeemers = tx.witnessSet().redeemers()?.values();
    if (!currentRedeemers || currentRedeemers.length === 0) {
      throw new Error(
        `evaluateTransaction: No Redeemers found in transaction"`,
      );
    }

    const additionalUtxoSet = new Set();
    for (const utxo of additionalUtxos || []) {
      const txIn = {
        txId: utxo.input().transactionId(),
        index: utxo.input().index(),
      };

      const output = utxo.output();
      const value = output.amount();

      const txOut = {
        address: output.address(),
        value: {
          coins: value.coin(),
          assets: value.multiasset(),
        },
        datum_hash: output.datum()?.asDataHash(),
        datum: output.datum()?.asInlineData()?.toCbor(),
        script: output.scriptRef()?.toCbor(),
      };

      additionalUtxoSet.add([txIn, txOut]);
    }

    const payload = {
      cbor: tx.toCbor(),
      additionalUtxoset: Array.from(additionalUtxoSet),
    };

    const query = "/utils/txs/evaluate/utxos";
    const response = await fetch(`${this.url}${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.headers(),
      },
      body: JSON.stringify(payload, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      ),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `evaluateTransaction: failed to evaluate transaction with additional UTxO set in Blockfrost endpoint.\nError ${error}`,
      );
    }

    const json =
      (await response.json()) as BlockfrostResponse<BlockfrostRedeemer>;
    if ("message" in json) {
      throw new Error(
        `evaluateTransaction: Blockfrost threw "${json.message}"`,
      );
    }

    const evaledRedeemers: Set<Redeemer> = new Set();

    if (!("EvaluationResult" in json.result)) {
      throw new Error(
        `evaluateTransaction: Blockfrost endpoint returned evaluation failure.`,
      );
    }
    const result = json.result.EvaluationResult;
    for (const redeemerPointer in result) {
      const [pTag, pIndex] = redeemerPointer.split(":");
      const purpose = purposeFromTag(pTag!);
      const index = BigInt(pIndex!);
      const data = result[redeemerPointer]!;
      const exUnits = ExUnits.fromCore({
        memory: data.memory,
        steps: data.steps,
      });

      const redeemer = currentRedeemers!.find(
        (x: Redeemer) => x.tag() == purpose && x.index() == index,
      );

      if (!redeemer) {
        throw new Error(
          "evaluateTransaction: Blockfrost endpoint had extraneous redeemer data",
        );
      }
      // Manually set exUnits for redeemer
      redeemer.setExUnits(exUnits);
      // Add redeemer to result set
      evaledRedeemers.add(redeemer);
    }

    // Build return value from evaluated result set
    return Redeemers.fromCore(
      Array.from(evaledRedeemers).map((x) => x.toCore()),
    );
  }
}

// builds proper type from string result from Blockfrost API
function purposeFromTag(tag: string): RedeemerTag {
  const tagMap: { [key: string]: RedeemerTag } = {
    spend: RedeemerTag.Spend,
    mint: RedeemerTag.Mint,
    cert: RedeemerTag.Cert,
    reward: RedeemerTag.Reward,
    voting: RedeemerTag.Voting,
    proposing: RedeemerTag.Proposing,
  };

  const normalizedTag = tag.toLowerCase();

  if (normalizedTag in tagMap) {
    return tagMap[normalizedTag]!;
  } else {
    throw new Error(`Invalid tag: ${tag}.`);
  }
}

// Partially applies address in order to avoid sending it
// as argument repeatedly when building TransactionUnspentOutput
function buildTransactionUnspentOutput(
  address: Address,
): (blockfrostUTxO: BlockfrostUTxO) => TransactionUnspentOutput {
  return (blockfrostUTxO) => {
    const txIn = new TransactionInput(
      TransactionId(blockfrostUTxO.tx_hash),
      BigInt(blockfrostUTxO.output_index),
    );
    // No tx output CBOR available from Blockfrost,
    // so TransactionOutput must be manually constructed.
    const tokenMap: TokenMap = new Map<AssetId, bigint>();
    let lovelace = 0n;
    for (const { unit, quantity } of blockfrostUTxO.amount) {
      if (unit === "lovelace") {
        lovelace = BigInt(quantity);
      } else {
        tokenMap.set(unit as AssetId, BigInt(quantity));
      }
    }
    const txOut = new TransactionOutput(address, new Value(lovelace, tokenMap));
    return new TransactionUnspentOutput(txIn, txOut);
  };
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
  key_deposit: number;
  pool_deposit: number;
  e_max: number;
  n_opt: number;
  a0: string;
  rho: string;
  tau: string;
  decentralisation_param: number;
  extra_entropy: null;
  protocol_major_ver: number;
  protocol_minor_ver: number;
  min_utxo: string;
  min_pool_cost: number;
  nonce: string;
  cost_models: Record<BlockfrostLanguageVersions, { [key: string]: number }>;
  price_mem: string;
  price_step: string;
  max_tx_ex_mem: number;
  max_tx_ex_steps: number;
  max_block_ex_mem: number;
  max_block_ex_steps: number;
  max_val_size: number;
  collateral_percent: number;
  max_collateral_inputs: number;
  coins_per_utxo_size: number;
}

type BlockfrostResponse<SomeResponse> = SomeResponse | { message: string };

interface BlockfrostUTxO {
  address: string;
  tx_hash: string;
  output_index: number;
  amount: {
    unit: string;
    quantity: string;
  }[];
  block: string;
  data_hash?: string;
  inline_datum?: string;
  reference_script_hash?: string;
}

interface BlockfrostAssetAddress {
  address: string;
  quantity: string;
}

interface BlockfrostUnspentOutputResolution {
  outputs: BlockfrostUTxO[];
}

interface BlockfrostDatumHashResolution {
  cbor: string;
}

interface BlockfrostRedeemer {
  result:
    | {
        EvaluationResult: {
          [key: string]: {
            memory: number;
            steps: number;
          };
        };
      }
    | {
        CannotCreateEvaluationContext: any;
      };
}
