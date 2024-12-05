import type {
  TransactionUnspentOutput,
  TransactionWitnessPlutusData,
  Script,
  ScriptHash,
  Ed25519KeyHashHex,
  Hash32ByteBase16,
  PolicyId,
  AssetName,
  TokenMap,
  RewardAccount,
  ProtocolParameters,
  Datum,
  Evaluator,
  Slot,
  PoolId,
  StakeDelegationCertificate,
  NetworkId,
  AuxiliaryData,
} from "@blaze-cardano/core";
import { Hash28ByteBase16 } from "@blaze-cardano/core";
import {
  CborSet,
  TransactionInput,
  TransactionBody,
  Transaction,
  Value,
  TransactionOutput,
  PlutusData,
  Redeemers,
  Redeemer,
  RedeemerPurpose,
  Address,
  Ed25519PublicKeyHex,
  Credential,
  CredentialType,
  Ed25519SignatureHex,
  PlutusLanguageVersion,
  TransactionWitnessSet,
  AssetId,
  NativeScript,
  PlutusV1Script,
  PlutusV2Script,
  PlutusV3Script,
  VkeyWitness,
  Costmdls,
  CostModel,
  CborWriter,
  Hash,
  HashAsPubKeyHex,
  PolicyIdToHash,
  getPaymentAddress,
  Certificate,
  StakeDelegation,
  CertificateType,
  blake2b_256,
  RedeemerTag,
  StakeRegistration,
  getBurnAddress,
} from "@blaze-cardano/core";
import * as value from "./value";
import { micahsSelector, type SelectionResult } from "./coinSelection";
import { calculateReferenceScriptFee } from "./utils";

/*
methods we want to implement somewhere in new blaze (from haskell codebase):

provider:
    submitTx
    balanceTx
    isTxConfirmed
    awaitTxOutStatusChange
    awaitUtxoProduced
    awaitUtxoSpent
    txsFromTxIds
    watchAddressUntilTime
    fundsAtAddressGeq
    fundsAtAddressGt
    fundsAtAddressCondition
    txoRefsAt
    txsAt
    utxosTxOutTxFromTx
    utxosTxOutTxAt
    utxosAt
    findReferenceValidatorScripByHash
    queryUnspentTxOutsAt
    utxoRefsWithCurrency

constraints:
    mustValidateIn
    mustValidateInTimeRange
*/

/**
 * A builder class for constructing Cardano transactions with various components like inputs, outputs, and scripts.
 */
export class TxBuilder {
  readonly params: ProtocolParameters;
  private preCompleteHooks: ((tx: TxBuilder) => Promise<void>)[] = [];
  private body: TransactionBody; // The main body of the transaction containing inputs, outputs, etc.
  private auxiliaryData?: AuxiliaryData;
  private redeemers: Redeemers = Redeemers.fromCore([]); // A collection of redeemers for script validation.
  private utxos: Set<TransactionUnspentOutput> =
    new Set<TransactionUnspentOutput>(); // A set of unspent transaction outputs.
  private utxoScope: Set<TransactionUnspentOutput> =
    new Set<TransactionUnspentOutput>(); // A scoped set of UTxOs for the transaction.
  private collateralUtxos: Set<TransactionUnspentOutput> =
    new Set<TransactionUnspentOutput>(); // A set of unspent transaction outputs specifically reserved for collateral, if any.
  private scriptScope: Set<Script> = new Set(); // A set of scripts included in the transaction.
  private scriptSeen: Set<ScriptHash> = new Set(); // A set of script hashes that have been processed.
  private changeAddress?: Address; // The address to send change to, if any.
  private collateralChangeAddress?: Address; // The address to send collateral change to, if any.
  private rewardAddress?: Address; // The reward address to delegate from, if any.
  private networkId?: NetworkId; // The network ID for the transaction.
  private changeOutputIndex?: number; // The index of the change output in the transaction.
  private plutusData: TransactionWitnessPlutusData = new Set(); // A set of Plutus data for witness purposes.
  private requiredWitnesses: Set<Ed25519PublicKeyHex> = new Set(); // A set of public keys required for witnessing the transaction.
  private requiredNativeScripts: Set<Hash28ByteBase16> = new Set(); // A set of native script hashes required by the transaction.
  private requiredPlutusScripts: Set<Hash28ByteBase16> = new Set(); // A set of Plutus script hashes required by the transaction.
  private usedLanguages: Record<PlutusLanguageVersion, boolean> = {
    [0]: false, // Indicates whether Plutus V1 is used.
    [1]: false, // Indicates whether Plutus V2 is used.
    [2]: false, // Indicates whether Plutus V3 is used.
  };
  private extraneousDatums: Set<PlutusData> = new Set(); // A set of extraneous Plutus data not directly used in the transaction.
  private fee: bigint = 0n; // The fee for the transaction.
  private additionalSigners = 0;
  private evaluator?: Evaluator;

  private consumedMintHashes: Hash28ByteBase16[] = [];
  private consumedWithdrawalHashes: Hash28ByteBase16[] = [];
  private consumedSpendInputs: string[] = [];
  private minimumFee: bigint = 0n; // minimum fee for the transaction, in lovelace. For script eval purposes!
  private feePadding: bigint = 0n; // A padding to add onto the fee; use only in emergencies, and open a ticket so we can fix the fee calculation please!
  private coinSelector: (
    inputs: TransactionUnspentOutput[],
    dearth: Value,
  ) => SelectionResult = micahsSelector;
  private _burnAddress?: Address;

  /**
   * Constructs a new instance of the TxBuilder class.
   * Initializes a new transaction body with an empty set of inputs, outputs, and no fee.
   */
  constructor(params: ProtocolParameters) {
    this.params = params;
    this.body = new TransactionBody(
      CborSet.fromCore([], TransactionInput.fromCore),
      [],
      0n,
      undefined,
    );
  }

  get burnAddress(): Address {
    if (!this._burnAddress) {
      this._burnAddress = getBurnAddress(this.networkId!);
    }
    return this._burnAddress;
  }

  private insertSorted<T extends string>(arr: T[], el: T) {
    const index = arr.findIndex((x) => x.localeCompare(el) > 0);
    if (index == -1) {
      arr.push(el);
    } else {
      arr.splice(index, 0, el);
    }
    return index == -1 ? arr.length - 1 : index;
  }

  /**
   * Sets the change address for the transaction.
   * This address will receive any remaining funds not allocated to outputs or fees.
   *
   * @param {Address} address - The address to receive the change.
   * @param {boolean} [override=true] - Whether to override the change address if one is already set.
   * @returns {TxBuilder} The same transaction builder
   */
  setChangeAddress(address: Address, override = true): TxBuilder {
    if (override || !this.changeAddress) {
      this.changeAddress = address;
    }
    return this;
  }

  /**
   * Sets the collateral change address for the transaction.
   * This address will receive the collateral change if there is any.
   *
   * @param {Address} address - The address to receive the collateral change.
   * @returns {TxBuilder} The same transaction builder
   */
  setCollateralChangeAddress(address: Address): TxBuilder {
    this.collateralChangeAddress = address;
    return this;
  }

  /**
   * Sets the reward address for the transaction.
   * This address will be used for delegation purposes and also stake key component of the transaction.
   *
   * @param {Address} address - The reward address
   * @returns {TxBuilder} The same transaction builder
   */
  setRewardAddress(address: Address): TxBuilder {
    this.rewardAddress = address;
    return this;
  }

  /**
   * Sets the evaluator for the transaction builder.
   * The evaluator is used to execute Plutus scripts during transaction building.
   *
   * @param {Evaluator} evaluator - The evaluator to be used for script execution.
   * @param {boolean} [override=true] - Whether to override the evaluator if one is already set.
   * @returns {TxBuilder} The same transaction builder
   */
  useEvaluator(evaluator: Evaluator, override = true): TxBuilder {
    if (override || !this.evaluator) {
      this.evaluator = evaluator;
    }
    return this;
  }

  /**
   * Sets a custom coin selector function for the transaction builder.
   * This function will be used to select inputs during the transaction building process.
   *
   * @param {(inputs: TransactionUnspentOutput[], dearth: Value): SelectionResult} selector - The coin selector function to use.
   * @returns {TxBuilder} The same transaction builder
   */
  useCoinSelector(
    selector: (
      inputs: TransactionUnspentOutput[],
      dearth: Value,
    ) => SelectionResult,
  ): TxBuilder {
    this.coinSelector = selector;
    return this;
  }

  /**
   * Sets the network ID for the transaction builder.
   * The network ID is used to determine which network the transaction is intended for.
   *
   * @param {NetworkId} networkId - The network ID to set.
   * @returns {TxBuilder} The same transaction builder
   */
  setNetworkId(networkId: NetworkId): TxBuilder {
    this.networkId = networkId;
    return this;
  }

  /**
   * The additional signers field is used to add additional signing counts for fee calculation.
   * These will be included in the signing phase at a later stage.
   * This is needed due to native scripts signees being non-deterministic.
   * @param {number} amount - The amount of additional signers
   * @returns {TxBuilder} The same transaction builder
   */
  addAdditionalSigners(amount: number): TxBuilder {
    this.additionalSigners += amount;
    return this;
  }

  /**
   * Sets the minimum fee for the transaction.
   * This fee will be used during the transaction building process.
   *
   * @param {bigint} fee - The minimum fee to be set.
   * @returns {TxBuilder} The same transaction builder
   */
  setMinimumFee(fee: bigint): TxBuilder {
    this.minimumFee = fee;
    return this;
  }

  /**
   * Sets an additional padding to add onto the transactions.
   * Use this only in emergencies, and please open a ticket at https://github.com/butaneprotocol/blaze-cardano so we can correct the fee calculation!
   *
   * @param {bigint} pad - The padding to add onto the transaction fee
   * @returns {TxBuilder} the same transaction builder
   */
  setFeePadding(pad: bigint): TxBuilder {
    this.feePadding = pad;
    return this;
  }

  /**
   * Adds a reference input to the transaction. Reference inputs are used to refer to outputs from previous transactions
   * without spending them, allowing scripts to read their data. This can be useful for various contract logic, such as
   * checking the state of a datum without consuming the UTxO that holds it.
   *
   * @param {TransactionUnspentOutput} utxo - The unspent transaction output to add as a reference input.
   * @returns {TxBuilder} The same transaction builder
   * @throws {Error} If the input to be added is already present in the list of reference inputs, to prevent duplicates.
   */
  addReferenceInput(utxo: TransactionUnspentOutput): TxBuilder {
    // Attempt to retrieve existing reference inputs from the transaction body, or initialize a new set if none exist.
    const referenceInputs =
      this.body.referenceInputs() ??
      CborSet.fromCore([], TransactionInput.fromCore);
    // Convert the set of reference inputs to an array for easier manipulation.
    const values = [...referenceInputs.values()];
    // Check if the input to be added already exists in the array of reference inputs.
    if (
      values.find(
        (val) =>
          val.index() == utxo.input().index() &&
          val.transactionId() == utxo.input().transactionId(),
      )
    ) {
      // If a duplicate is found, throw an error to prevent adding it.
      throw new Error(
        "Cannot add duplicate reference input to the transaction",
      );
    }
    // If no duplicate is found, add the input to the array of reference inputs.
    values.push(utxo.input());
    // Update the reference inputs in the transaction body with the new array.
    referenceInputs.setValues(values);
    // Add the UTxO to the scope of UTxOs considered by the transaction.
    this.utxoScope.add(utxo);
    // If the UTxO has an associated script reference, add it to the script scope and mark the script as seen.
    const scriptRef = utxo.output().scriptRef();
    if (scriptRef) {
      this.scriptScope.add(scriptRef);
      this.scriptSeen.add(scriptRef.hash());
    }
    // Update the transaction body with the new set of reference inputs.
    this.body.setReferenceInputs(referenceInputs);
    return this;
  }

  /**
   * Adds an input to the transaction. This method is responsible for including a new input, which represents
   * a reference to an unspent transaction output (UTxO) that will be consumed by the transaction. Optionally,
   * a redeemer and an unhashed datum can be provided for script validation purposes.
   *
   * @param {TransactionUnspentOutput} utxo - The UTxO to be consumed as an input.
   * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation, required for spending Plutus script-locked UTxOs.
   * @param {PlutusData} [unhashDatum] - Optional. The unhashed datum, required if the UTxO being spent includes a datum hash instead of inline datum.
   * @returns {TxBuilder} The same transaction builder
   * @throws {Error} If attempting to add a duplicate input, if the UTxO payment key is missing, if attempting to spend with a redeemer for a KeyHash credential,
   *                 if attempting to spend without a datum when required, or if providing both an inline datum and an unhashed datum.
   */
  addInput(
    utxo: TransactionUnspentOutput,
    redeemer?: PlutusData,
    unhashDatum?: PlutusData,
  ): TxBuilder {
    // Retrieve the current inputs from the transaction body for manipulation.
    const inputs = this.body.inputs();
    const values = [...inputs.values()];
    // Check for and prevent the addition of duplicate inputs.
    if (
      values.find(
        (val) =>
          val.index() == utxo.input().index() &&
          val.transactionId() == utxo.input().transactionId(),
      )
    ) {
      throw new Error("Cannot add duplicate input to the transaction");
    }
    // Add the new input to the array of inputs and update the transaction body.
    values.push(utxo.input());
    inputs.setValues(values);
    this.utxoScope.add(utxo);
    this.body.setInputs(inputs);

    const oref = utxo.input().transactionId() + utxo.input().index().toString();
    const insertIdx = this.insertSorted(this.consumedSpendInputs, oref);

    const redeemers = [...this.redeemers.values()];
    for (const redeemer of redeemers) {
      if (
        redeemer.tag() == RedeemerTag.Spend &&
        redeemer.index() >= BigInt(insertIdx)
      ) {
        redeemer.setIndex(redeemer.index() + 1n);
      }
    }

    // Process the redeemer and datum logic for Plutus script-locked UTxOs.
    const key = utxo.output().address().getProps().paymentPart;
    if (!key) {
      throw new Error("addInput: Somehow the UTxO payment key is missing!");
    }
    if (redeemer !== undefined) {
      if (key.type == CredentialType.KeyHash) {
        throw new Error(
          "addInput: Cannot spend with redeemer for KeyHash credential!",
        );
      }
      this.requiredPlutusScripts.add(key.hash);
      const datum = utxo.output().datum();
      if (!datum) {
        throw new Error(
          "addInput: Cannot spend with redeemer when datum is missing!",
        );
      }
      if (datum?.asInlineData() && unhashDatum) {
        throw new Error(
          "addInput: Cannot have inline datum and also provided datum (3rd arg).",
        );
      }
      if (datum?.asDataHash()) {
        if (!unhashDatum) {
          throw new Error(
            "addInput: When spending datum hash, must provide datum (3rd arg).",
          );
        }
        this.plutusData.add(unhashDatum!);
      }
      // Prepare and add the redeemer to the transaction, including execution units estimation.
      redeemers.push(
        Redeemer.fromCore({
          index: insertIdx,
          purpose: RedeemerPurpose["spend"],
          data: redeemer.toCore(),
          executionUnits: {
            memory: this.params.maxExecutionUnitsPerTransaction.memory,
            steps: this.params.maxExecutionUnitsPerTransaction.steps,
          },
        }),
      );
      this.redeemers.setValues(redeemers);
    } else {
      // Handle the required scripts or witnesses for non-Plutus script-locked UTxOs.
      if (key.type == CredentialType.ScriptHash) {
        this.requiredNativeScripts.add(key.hash);
      } else {
        this.requiredWitnesses.add(HashAsPubKeyHex(key.hash));
      }
    }

    const scriptRef = utxo.output().scriptRef();
    if (scriptRef) {
      this.scriptScope.add(scriptRef);
      this.scriptSeen.add(scriptRef.hash());
    }

    return this;
  }

  /**
   * Adds unspent transaction outputs (UTxOs) to the set of UTxOs available for this transaction.
   * These UTxOs can then be used for balancing the transaction, ensuring that inputs and outputs are equal.
   *
   * @param {TransactionUnspentOutput[]} utxos - The unspent transaction outputs to add.
   * @returns {TxBuilder} The same transaction builder
   */
  addUnspentOutputs(utxos: TransactionUnspentOutput[]): TxBuilder {
    for (const utxo of utxos) {
      this.utxos.add(utxo);
    }
    return this;
  }

  /**
   * Adds unspent transaction outputs (UTxOs) to the set of collateral UTxOs available for this transaction.
   * These UTxOs can then be used to provide collateral for the transaction, if necessary. If provided, they will b
   * If there are specific, valid collateral UTxOs provided, Blaze will use them before using any other UTxO.
   *
   * @param {TransactionUnspentOutput[]} utxos - the UTxOs to add as collateral
   * @returns {TxBuilder} The same transaction builder
   */
  provideCollateral(utxos: TransactionUnspentOutput[]) {
    for (const utxo of utxos) {
      this.collateralUtxos.add(utxo);
    }

    return this;
  }

  /**
   * Adds minting information to the transaction. This includes specifying the policy under which assets are minted,
   * the assets to be minted, and an optional redeemer for Plutus scripts.
   *
   * @param {PolicyId} policy - The policy ID under which the assets are minted.
   * @param {Map<AssetName, bigint>} assets - A map of asset names to the amounts being minted.
   * @param {PlutusData} [redeemer] - Optional. A redeemer to be used if the minting policy requires Plutus script validation.
   */
  addMint(
    policy: PolicyId,
    assets: Map<AssetName, bigint>,
    redeemer?: PlutusData,
  ) {
    const insertIdx = this.insertSorted(
      this.consumedMintHashes,
      PolicyIdToHash(policy),
    );
    // Retrieve the current mint map from the transaction body, or initialize a new one if none exists.
    const mint: TokenMap = this.body.mint() ?? new Map();
    // Sanity check  duplicates
    for (const asset of mint.keys()) {
      if (AssetId.getPolicyId(asset) == policy) {
        throw new Error("addMint: Duplicate policy!");
      }
    }
    // Iterate over the assets map and add each asset to the mint map under the specified policy.
    for (const [key, amount] of assets.entries()) {
      mint.set(AssetId.fromParts(policy, key), amount);
    }
    // Update the transaction body with the modified mint map.
    this.body.setMint(mint);

    // If a redeemer is provided, handle Plutus script requirements.
    if (redeemer) {
      // Add the policy ID hash to the set of required Plutus scripts.
      this.requiredPlutusScripts.add(PolicyIdToHash(policy));
      // Retrieve the current list of redeemers and prepare to add a new one.
      const redeemers = [...this.redeemers.values()];
      for (const redeemer of redeemers) {
        if (
          redeemer.tag() == RedeemerTag.Mint &&
          redeemer.index() >= BigInt(insertIdx)
        ) {
          redeemer.setIndex(redeemer.index() + 1n);
        }
      }
      // Create and add a new redeemer for the minting action, specifying execution units.
      // Note: Execution units are placeholders and are replaced with actual values during the evaluation phase.
      redeemers.push(
        Redeemer.fromCore({
          index: insertIdx,
          purpose: RedeemerPurpose["mint"], // Specify the purpose of the redeemer as minting.
          data: redeemer.toCore(), // Convert the provided PlutusData redeemer to its core representation.
          executionUnits: {
            memory: this.params.maxExecutionUnitsPerTransaction.memory, // Placeholder memory units, replace with actual estimation.
            steps: this.params.maxExecutionUnitsPerTransaction.steps, // Placeholder step units, replace with actual estimation.
          },
        }),
      );
      // Update the transaction's redeemers with the new list.
      this.redeemers.setValues(redeemers);
    } else {
      // If no redeemer is provided, assume minting under a native script and add the policy ID hash to the required native scripts.
      this.requiredNativeScripts.add(PolicyIdToHash(policy));
    }
    return this;
  }

  /**
   * This methods calculates the minimum ada required for a transaction output.
   * @param {TransactionOutput} output - The transaction output to calculate the minimum ada for.
   * @returns {bigint} The minimum ada required for the output.
   */
  private calculateMinAda(output: TransactionOutput): bigint {
    const byteLength = BigInt(output.toCbor().length / 2);
    return BigInt(this.params.coinsPerUtxoByte) * (byteLength + 160n);
  }
  /**
   * This method checks and alters the output of a transaction.
   * It ensures that the output meets the minimum ada requirements and does not exceed the maximum value size.
   *
   * @param {TransactionOutput} output - The transaction output to be checked and altered.
   * @returns {TransactionOutput} The altered transaction output.
   * @throws {Error} If the output does not meet the minimum ada requirements or exceeds the maximum value size.
   */

  private checkAndAlterOutput(output: TransactionOutput): TransactionOutput {
    {
      let minAda = this.calculateMinAda(output);
      let coin = output.amount().coin();
      while (coin < minAda) {
        const amount = output.amount();
        amount.setCoin(minAda);
        const datum = output.datum();
        const scriptRef = output.scriptRef();
        output = new TransactionOutput(output.address(), amount);
        if (datum) {
          output.setDatum(datum);
        }
        if (scriptRef) {
          output.setScriptRef(scriptRef);
        }
        minAda = this.calculateMinAda(output);
        coin = output.amount().coin();
      }
    }

    const byteLength = BigInt(output.toCbor().length / 2);
    if (
      output.amount().coin() <
      BigInt(this.params.coinsPerUtxoByte) * (byteLength + 160n)
    ) {
      throw new Error("addOutput: Failed due to min ada!");
    }
    const valueByteLength = output.amount().toCbor().length / 2;
    if (valueByteLength > this.params.maxValueSize) {
      throw new Error("addOutput: Failed due to max value size!");
    }
    return output;
  }

  /**
   * Adds a transaction output to the current transaction body. This method also ensures that the minimum ada
   * requirements are met for the output. After adding the output, it updates the transaction body's outputs.
   * It also checks if the output value exceeds the maximum value size.
   *
   * @param {TransactionOutput} output - The transaction output to be added.
   * @returns {TxBuilder} The same transaction builder
   */
  addOutput(output: TransactionOutput): TxBuilder {
    output = this.checkAndAlterOutput(output);
    // Retrieve the current list of outputs from the transaction body.
    const outputs = this.body.outputs();
    // Add the new output to the list and update the transaction body's outputs.
    outputs.push(output);
    this.body.setOutputs(outputs);
    return this;
  }

  /**
   * Returns the number of transaction outputs in the current transaction body.
   *
   * @returns {number} The number of transaction outputs.
   */
  get outputsCount(): number {
    return this.body.outputs().length;
  }

  /**
   * Adds a payment in lovelace to the transaction output.
   * This method ensures that the address is valid and the payment is added to the transaction output.
   *
   * @param {Address} address - The address to send the payment to.
   * @param {bigint} lovelace - The amount of lovelace to send.
   * @param {Datum} [datum] - Optional datum to be associated with the paid assets.
   * @returns {TxBuilder} The same transaction builder
   */
  payLovelace(address: Address, lovelace: bigint, datum?: Datum): TxBuilder {
    assertPaymentsAddress(address);
    const paymentAddress = getPaymentAddress(address);
    const datumData = typeof datum == "object" ? datum.toCore() : undefined;
    const datumHash = typeof datum == "string" ? datum : undefined;

    this.addOutput(
      TransactionOutput.fromCore({
        address: paymentAddress,
        value: { coins: lovelace },
        datum: datumData,
        datumHash,
      }),
    );
    return this;
  }

  /**
   * Adds a payment in assets to the transaction output.
   * This method ensures that the address is valid and the payment is added to the transaction output.
   *
   * @param {Address} address - The address to send the payment to.
   * @param {Value} value - The value of the assets to send.
   * @param {Datum} [datum] - Optional datum to be associated with the paid assets.
   * @returns {TxBuilder} The same transaction builder
   */
  payAssets(address: Address, value: Value, datum?: Datum): TxBuilder {
    assertPaymentsAddress(address);
    const paymentAddress = getPaymentAddress(address);
    const datumData = typeof datum == "object" ? datum.toCore() : undefined;
    const datumHash = typeof datum == "string" ? datum : undefined;

    this.addOutput(
      TransactionOutput.fromCore({
        address: paymentAddress,
        value: value.toCore(),
        datum: datumData,
        datumHash,
      }),
    );
    return this;
  }

  /**
   * Locks a specified amount of lovelace to a script.
   * The difference between 'pay' and 'lock' is that you pay to a public key/user,
   * and you lock at a script.
   * This method ensures that the address is valid and the lovelace is locked to the script.
   *
   * @param {Address} address - The address to lock the lovelace to.
   * @param {bigint} lovelace - The amount of lovelace to lock.
   * @param {Datum} datum - The datum to be associated with the locked lovelace.
   * @param {Script} scriptReference - The reference to the script to lock the lovelace to.
   * @returns {TxBuilder} The same transaction builder
   */
  lockLovelace(
    address: Address,
    lovelace: bigint,
    datum: Datum,
    scriptReference?: Script,
  ): TxBuilder {
    return this.lockAssets(
      address,
      new Value(lovelace),
      datum,
      scriptReference,
    );
  }

  /**
   * Locks a specified amount of assets to a script.
   * The difference between 'pay' and 'lock' is that you pay to a public key/user,
   * and you lock at a script.
   * This method ensures that the address is valid and the assets are locked to the script.
   *
   * @param {Address} address - The address to lock the assets to.
   * @param {Value} value - The value of the assets to lock.
   * @param {Datum} datum - The datum to be associated with the locked assets.
   * @param {Script} scriptReference - The reference to the script to lock the assets to.
   * @returns {TxBuilder} The same transaction builder
   */
  lockAssets(
    address: Address,
    value: Value,
    datum: Datum,
    scriptReference?: Script,
  ): TxBuilder {
    const datumData = typeof datum == "object" ? datum.toCore() : undefined;
    const datumHash = typeof datum == "string" ? datum : undefined;
    assertLockAddress(address);
    const paymentAddress = getPaymentAddress(address);
    return this.addOutput(
      TransactionOutput.fromCore({
        address: paymentAddress,
        value: value.toCore(),
        datum: datumData,
        datumHash,
        scriptReference: scriptReference?.toCore(),
      }),
    );
  }

  /**
   * Deploys a script by creating a new UTxO with the script as its reference.
   *
   * @param {Script} script - The script to be deployed.
   * @param {Address} [address] - The address to lock the script to. Defaults to a burn address where the UTxO will be unspendable.
   * @returns {TxBuilder} The same transaction builder.
   *
   *
   * @example
   * ```typescript
   * const myScript = Script.newPlutusV2Script(new PlutusV2Script("..."));
   * txBuilder.deployScript(myScript);
   * // or
   * txBuilder.deployScript(myScript, someAddress);
   * ```
   */
  deployScript(script: Script, address: Address = this.burnAddress): TxBuilder {
    const out = new TransactionOutput(address, new Value(0n));
    out.setScriptRef(script);
    out.amount().setCoin(this.calculateMinAda(out));
    this.addOutput(out);
    return this;
  }

  /**
   * Adds a Plutus datum to the transaction. This datum is not directly associated with any particular output but may be used
   * by scripts during transaction validation. This method is useful for including additional information that scripts may
   * need to validate the transaction without requiring it to be attached to a specific output.
   *
   * @param {PlutusData} datum - The Plutus datum to be added to the transaction.
   * @returns {TxBuilder} The same transaction builder
   */
  provideDatum(datum: PlutusData): TxBuilder {
    this.extraneousDatums.add(datum);
    return this;
  }

  /**
   * Evaluates the scripts for the given draft transaction and calculates the execution units and fees required.
   * This function iterates over all UTXOs within the transaction's scope, simulates the execution of associated scripts,
   * and aggregates the execution units. It then calculates the total fee based on the execution units and updates the
   * transaction's redeemers with the new execution units.
   *
   * @param {Transaction} draft_tx - The draft transaction to evaluate.
   * @returns {Promise<bigint>} The total fee calculated based on the execution units of the scripts.
   */
  private async evaluate(draft_tx: Transaction): Promise<bigint> {
    // Collect all UTXOs from the transaction's scope.
    const allUtxos: TransactionUnspentOutput[] = Array.from(
      this.utxoScope.values(),
    );
    // todo: filter utxoscope to only include inputs, reference inputs, collateral inputs, not excess junk

    const redeemers = await this.evaluator!(draft_tx, allUtxos);
    let fee = 0;
    // Iterate over the results from the UPLC evaluator.
    for (const redeemer of redeemers.values()) {
      const exUnits = redeemer.exUnits();

      // Calculate the fee contribution from this redeemer and add it to the total fee.
      fee += this.params.prices.memory * Number(exUnits.mem());
      fee += this.params.prices.steps * Number(exUnits.steps());
    }

    // Create a new Redeemers object and set its values to the updated redeemers.
    this.redeemers = redeemers; // Update the transaction's redeemers with the new set.

    return BigInt(Math.ceil(fee)); // Return the total fee, rounded up to the nearest whole number.
  }

  /**
   * Builds the transaction witness set required for the transaction.
   * This includes collecting all necessary scripts (native, Plutus V1, V2, V3),
   * vkey witnesses, redeemers, and Plutus data required for script validation.
   * It organizes these components into a structured format that can be
   * serialized and included in the transaction.
   *
   * @returns {TransactionWitnessSet} A constructed transaction witness set.
   * @throws {Error} If a required script cannot be resolved by its hash.
   */
  private buildTransactionWitnessSet(): TransactionWitnessSet {
    const tw = new TransactionWitnessSet();
    // Script lookup table to map script hashes to script objects
    const scriptLookup: Record<ScriptHash, Script> = {};
    for (const script of this.scriptScope) {
      scriptLookup[script.hash()] = script;
    }
    // Arrays to hold scripts of different types
    const sn: NativeScript[] = [];
    const s1: PlutusV1Script[] = [];
    const s2: PlutusV2Script[] = [];
    const s3: PlutusV3Script[] = [];
    // Populate script arrays based on required script hashes
    for (const requiredScriptHash of this.requiredPlutusScripts) {
      if (!this.scriptSeen.has(requiredScriptHash)) {
        const script = scriptLookup[requiredScriptHash];
        if (!script) {
          throw new Error(
            `complete: Could not resolve script hash ${requiredScriptHash}`,
          );
        } else {
          if (script.asNative() != undefined) {
            sn.push(script.asNative()!);
          }
          if (script.asPlutusV1() != undefined) {
            s1.push(script.asPlutusV1()!);
          }
          if (script.asPlutusV2() != undefined) {
            s2.push(script.asPlutusV2()!);
          }
          if (script.asPlutusV3() != undefined) {
            s3.push(script.asPlutusV3()!);
          }
        }
      }
      // Mark the script language versions used in the transaction
      const lang = scriptLookup[requiredScriptHash]?.language();
      if (lang == 1) {
        this.usedLanguages[PlutusLanguageVersion.V1] = true;
      } else if (lang == 2) {
        this.usedLanguages[PlutusLanguageVersion.V2] = true;
      } else if (lang == 3) {
        this.usedLanguages[PlutusLanguageVersion.V3] = true;
      } else if (!lang) {
        throw new Error(
          "buildTransactionWitnessSet: lang script lookup failed",
        );
      }
    }
    // do native script check too
    for (const requiredScriptHash of this.requiredNativeScripts) {
      if (!this.scriptSeen.has(requiredScriptHash)) {
        const script = scriptLookup[requiredScriptHash];
        if (!script) {
          throw new Error(
            `complete: Could not resolve script hash ${requiredScriptHash}`,
          );
        } else {
          if (script.asNative() != undefined) {
            sn.push(script.asNative()!);
          } else {
            throw new Error(
              "complete: Could not resolve script hash (was not native script)",
            );
          }
        }
      }
    }
    // Add scripts to the transaction witness set
    if (sn.length != 0) {
      const cborSet = CborSet.fromCore([], NativeScript.fromCore);
      cborSet.setValues(sn);
      tw.setNativeScripts(cborSet);
    }
    if (s1.length != 0) {
      const cborSet = CborSet.fromCore([], PlutusV1Script.fromCore);
      cborSet.setValues(s1);
      tw.setPlutusV1Scripts(cborSet);
    }
    if (s2.length != 0) {
      const cborSet = CborSet.fromCore([], PlutusV2Script.fromCore);
      cborSet.setValues(s2);
      tw.setPlutusV2Scripts(cborSet);
    }
    if (s3.length != 0) {
      const cborSet = CborSet.fromCore([], PlutusV3Script.fromCore);
      cborSet.setValues(s3);
      tw.setPlutusV3Scripts(cborSet);
    }
    // Process vkey witnesses
    // const vkeyWitnesses = CborSet.fromCore([], VkeyWitness.fromCore);
    const requiredWitnesses: [Ed25519PublicKeyHex, Ed25519SignatureHex][] =
      Array.from(
        { length: this.requiredWitnesses.size + this.additionalSigners },
        (_, i) => [
          Ed25519PublicKeyHex(i.toString(16).padStart(64, "0")),
          Ed25519SignatureHex(i.toString(16).padStart(128, "0")),
        ],
      );

    tw.setVkeys(CborSet.fromCore(requiredWitnesses, VkeyWitness.fromCore));
    tw.setRedeemers(this.redeemers);
    // Process Plutus data
    const plutusData = CborSet.fromCore([], PlutusData.fromCore);
    const plutusDataList: PlutusData[] = [];
    for (const p of this.plutusData.values()) {
      plutusDataList.push(p);
    }
    for (const p of this.extraneousDatums.values()) {
      plutusDataList.push(p);
    }
    plutusData.setValues(plutusDataList);
    tw.setPlutusData(plutusData);
    return tw;
  }

  /**
   * Calculates the net value difference between the inputs and outputs of a transaction,
   * including minted values, withdrawals, and subtracting a fixed fee amount.
   * This function is used to determine the excess value that needs to be returned as change.
   *
   * @returns {Value} The net value that represents the transaction's pitch.
   * @throws {Error} If a corresponding UTxO for an input cannot be found.
   */
  private getPitch(spareAmount: bigint = 0n): Value {
    // Calculate withdrawal amounts.
    let withdrawalAmount = 0n;
    const withdrawals = this.body.withdrawals();
    if (withdrawals !== undefined) {
      for (const account of withdrawals.keys()) {
        withdrawalAmount += withdrawals.get(account)!;
      }
    }
    // Initialize values for input, output, and minted amounts.
    let inputValue = new Value(withdrawalAmount);
    let outputValue = new Value(bigintMax(this.fee, this.minimumFee));
    const mintValue = new Value(0n, this.body.mint());

    // Aggregate the total input value from all inputs.
    for (const input of this.body.inputs().values()) {
      let utxo: TransactionUnspentOutput | undefined;
      // Find the matching UTxO for the input.
      for (const iterUtxo of this.utxoScope.values()) {
        if (
          iterUtxo.input().transactionId() == input.transactionId() &&
          iterUtxo.input().index() == input.index()
        ) {
          utxo = iterUtxo;
        }
      }
      // Throw an error if a matching UTxO cannot be found.
      if (!utxo) {
        throw new Error("Unreachable! UTxO missing!");
      }
      // Merge the UTxO's output amount into the total input value.
      inputValue = value.merge(inputValue, utxo.output().amount());
    }

    // Aggregate the total output value from all outputs.
    for (const output of this.body.outputs().values()) {
      outputValue = value.merge(outputValue, output.amount());
    }

    for (const cert of this.body.certs()?.values() || []) {
      switch (cert.kind()) {
        case 0: // Stake Registration
          outputValue = value.merge(
            outputValue,
            new Value(BigInt(this.params.stakeKeyDeposit)),
          );
          break;
        case 1: // Stake Deregistration
          inputValue = value.merge(
            inputValue,
            new Value(BigInt(this.params.stakeKeyDeposit)),
          );
          break;
        case 3: // Pool Registration
          if (this.params.poolDeposit) {
            outputValue = value.merge(
              outputValue,
              new Value(BigInt(this.params.poolDeposit)),
            );
          }
          break;
        case 4: // Pool Retirement
          if (this.params.poolDeposit) {
            inputValue = value.merge(
              inputValue,
              new Value(BigInt(this.params.poolDeposit)),
            );
          }
          break;
      }
    }

    // Calculate the net value by merging input, output (negated), and mint values.
    // Subtract a fixed fee amount (5 ADA) to ensure enough is allocated for transaction fees.
    const tilt = value.merge(
      value.merge(inputValue, value.negate(outputValue)),
      mintValue,
    );
    if (spareAmount != 0n) {
      return value.merge(tilt, new Value(-spareAmount)); // Subtract 5 ADA from the excess.
    }
    return value.merge(
      tilt,
      this.body.outputs()[this.changeOutputIndex!]!.amount(),
    );
  }

  private balanced() {
    let withdrawalAmount = 0n;
    const withdrawals = this.body.withdrawals();
    if (withdrawals !== undefined) {
      for (const account of withdrawals.keys()) {
        withdrawalAmount += withdrawals.get(account)!;
      }
    }
    // Initialize values for input, output, and minted amounts.
    let inputValue = new Value(withdrawalAmount);
    let outputValue = new Value(bigintMax(this.fee, this.minimumFee));
    const mintValue = new Value(0n, this.body.mint());

    // Aggregate the total input value from all inputs.
    for (const input of this.body.inputs().values()) {
      let utxo: TransactionUnspentOutput | undefined;
      // Find the matching UTxO for the input.
      for (const iterUtxo of this.utxoScope.values()) {
        if (
          iterUtxo.input().transactionId() == input.transactionId() &&
          iterUtxo.input().index() == input.index()
        ) {
          utxo = iterUtxo;
        }
      }
      // Throw an error if a matching UTxO cannot be found.
      if (!utxo) {
        throw new Error("Unreachable! UTxO missing!");
      }
      // Merge the UTxO's output amount into the total input value.
      inputValue = value.merge(inputValue, utxo.output().amount());
    }
    for (const output of this.body.outputs().values()) {
      outputValue = value.merge(outputValue, output.amount());
    }

    for (const cert of this.body.certs()?.values() || []) {
      switch (cert.kind()) {
        case 0: // Stake Registration
          outputValue = value.merge(
            outputValue,
            new Value(BigInt(this.params.stakeKeyDeposit)),
          );
          break;
        case 1: // Stake Deregistration
          inputValue = value.merge(
            inputValue,
            new Value(BigInt(this.params.stakeKeyDeposit)),
          );
          break;
        case 3: // Pool Registration
          if (this.params.poolDeposit) {
            outputValue = value.merge(
              outputValue,
              new Value(BigInt(this.params.poolDeposit)),
            );
          }
          break;
        case 4: // Pool Retirement
          if (this.params.poolDeposit) {
            inputValue = value.merge(
              inputValue,
              new Value(BigInt(this.params.poolDeposit)),
            );
          }
          break;
      }
    }
    const tilt = value.merge(
      value.merge(inputValue, value.negate(outputValue)),
      mintValue,
    );
    return tilt.toCbor() == value.zero().toCbor();
  }

  /**
   * Generates a script data hash for the transaction if there are any datums or redeemers present.
   * This hash is crucial for the validation of Plutus scripts in the transaction.
   *
   * @param {TransactionWitnessSet} tw - The transaction witness set containing Plutus data.
   * @returns {Hash32ByteBase16 | undefined} The script data hash if datums or redeemers are present, otherwise undefined.
   */
  private getScriptDataHash(
    tw: TransactionWitnessSet,
  ): Hash32ByteBase16 | undefined {
    // Extract redeemers and datums from the transaction witness set.
    const redeemers = [...this.redeemers.values()];
    const datums = tw.plutusData()?.values().slice() || [];
    // Proceed only if there are datums or redeemers to process.
    if (datums.length > 0 || redeemers.length > 0) {
      // Initialize a CBOR writer to encode the script data.
      const writer = new CborWriter();
      // Encode redeemers and datums into CBOR format.
      // In the conway era, the format changes
      const conway = this.params.protocolVersion.major === 9;
      if (conway && redeemers.length === 0) {
        // An empty redeemer set is always an empty map, as of conway
        writer.writeStartMap(0);
      } else {
        // TODO: in the conway era, this will support array, or map
        // but in the next era, it will only support maps
        // So, we should switch this to encoding as maps when we switch the witness set to encoding as maps
        writer.writeStartArray(redeemers.length);
        for (const redeemer of redeemers) {
          writer.writeEncodedValue(Buffer.from(redeemer.toCbor(), "hex"));
        }
      }
      if (datums && datums.length > 0) {
        writer.writeStartArray(datums.length);
        for (const datum of datums) {
          writer.writeEncodedValue(Buffer.from(datum.toCbor(), "hex"));
        }
      }
      // Initialize a container for used cost models.
      const usedCostModels = new Costmdls();
      // Populate the used cost models based on the languages used in the transaction.
      for (let i = 0; i <= Object.keys(this.usedLanguages).length; i++) {
        if (this.usedLanguages[i as PlutusLanguageVersion]) {
          // Retrieve the cost model for the current language version.
          const cm = this.params.costModels.get(i);
          // Throw an error if the cost model is missing.
          if (cm == undefined) {
            throw new Error(
              `complete: Could not find cost model for Plutus Language Version ${i}`,
            );
          }
          // Insert the cost model into the used cost models container.
          usedCostModels.insert(new CostModel(i, cm));
        }
      }
      // Encode the used cost models into CBOR format.
      writer.writeEncodedValue(
        Buffer.from(usedCostModels.languageViewsEncoding(), "hex"),
      );
      // Generate and return the script data hash.
      return blake2b_256(writer.encodeAsHex());
    }
    // Return undefined if there are no datums or redeemers.
    return undefined;
  }

  /**
   * Adjusts the balance of the transaction by creating or updating a change output.
   * This method takes the excess value from the transaction, removes any zero-valued
   * tokens from the multiasset map, and then either creates a new change output or
   * updates an existing one with the adjusted value.
   *
   * @param {Value} excessValue - The excess value that needs to be returned as change.
   */
  private balanceChange(excessValue: Value) {
    // Retrieve the multiasset map from the excess value.
    const tokenMap = excessValue.multiasset();
    // If the multiasset map exists, iterate over its keys.
    if (tokenMap) {
      for (const key of tokenMap.keys()) {
        // Delete any tokens with a zero value to clean up the multiasset map.
        if (tokenMap.get(key) == 0n) {
          tokenMap.delete(key);
        }
      }
      // Update the excess value with the cleaned-up multiasset map.
      excessValue.setMultiasset(tokenMap);
    }
    // Create a new transaction output with the change address and the adjusted excess value.
    const output = new TransactionOutput(this.changeAddress!, excessValue);
    // If there is no existing change output index, add the new output to the transaction
    // and store its index. Otherwise, update the existing change output with the new output.
    if (undefined === this.changeOutputIndex) {
      this.addOutput(output);
      this.changeOutputIndex = this.outputsCount - 1;
    } else {
      const outputs = this.body.outputs();
      outputs[this.changeOutputIndex] = this.checkAndAlterOutput(output);
      this.body.setOutputs(outputs);
    }
  }

  /**
   * Calculates the transaction fees based on the transaction size and parameters.
   * It updates the transaction body with the calculated fee.
   *
   * @param {Transaction} draft_tx - The draft transaction to calculate fees for.
   */
  private calculateFees(draft_tx: Transaction) {
    // Calculate the fee based on the transaction size and minimum fee parameters.
    let minFee =
      this.params.minFeeConstant +
      (draft_tx.toCbor().length / 2) * this.params.minFeeCoefficient;

    if (this.params.minFeeReferenceScripts) {
      const utxoScope = [...this.utxoScope.values()];
      const allInputs = [
        ...draft_tx.body().inputs().values(),
        ...(draft_tx.body().referenceInputs()?.values() ?? []),
      ];
      const refScripts = allInputs
        .map((x) =>
          utxoScope
            .find((y) => y.input().toCbor() == x.toCbor())!
            .output()
            .scriptRef(),
        )
        .filter((x) => x !== undefined);
      if (refScripts.length > 0) {
        minFee += calculateReferenceScriptFee(refScripts, this.params);
      }
    }

    const redeemers = draft_tx.witnessSet().redeemers();
    if (redeemers) {
      for (const redeemer of redeemers.values()) {
        const exUnits = redeemer.exUnits();

        // Calculate the fee contribution from this redeemer and add it to the total fee.
        minFee += this.params.prices.memory * Number(exUnits.mem());
        minFee += this.params.prices.steps * Number(exUnits.steps());
      }
    }

    this.fee = BigInt(Math.ceil(minFee));
    // Update the transaction body with the calculated fee.
    this.body.setFee(bigintMax(this.fee, this.minimumFee) + this.feePadding);
  }

  /**
   * Prepares the collateral for the transaction by selecting suitable UTXOs.
   * Throws an error if suitable collateral cannot be found or if some inputs cannot be resolved.
   */
  private prepareCollateral() {
    // Retrieve provided collateral inputs
    const providedCollateral = [...this.collateralUtxos.values()].sort(
      (a, b) =>
        a.output().amount().coin() < b.output().amount().coin() ? -1 : 1,
    );
    // Retrieve inputs from the transaction body and available UTXOs within scope.
    const inputs = [...this.body.inputs().values()];
    const scope = [...this.utxoScope.values()];
    // Initialize variables to track the best UTXO for collateral and its ranking.
    let [best, rank]: [TransactionUnspentOutput[] | undefined, number] = [
      undefined,
      99,
    ];
    // if there are provided collateral UTxOs, use them first
    if (providedCollateral.length > 0) {
      for (const utxo of providedCollateral) {
        const coinAmount = this.getUtxoEffectiveCoin(utxo);
        if (
          coinAmount >= 5_000_000 &&
          utxo.output().address().getProps().paymentPart?.type ==
            CredentialType.KeyHash
        ) {
          const ranking = value.assetTypes(utxo.output().amount());
          if (ranking < rank) {
            rank = ranking;
            best = [utxo];
          }
        }
      }
    } else {
      // If no provided collateral inputs, iterate over the inputs to find the best candidate.
      for (const input of inputs) {
        const utxo = scope.find(
          (x) =>
            x.input().transactionId() === input.transactionId() &&
            x.input().index() === input.index(),
        );

        if (utxo) {
          // Check if the UTXO amount is sufficient for collateral.
          const coinAmount = this.getUtxoEffectiveCoin(utxo);
          if (
            coinAmount >= 5_000_000 &&
            utxo.output().address().getProps().paymentPart?.type ==
              CredentialType.KeyHash
          ) {
            const ranking = value.assetTypes(utxo.output().amount());
            // Update the best UTXO and its ranking if it's a better candidate.
            if (ranking < rank) {
              rank = ranking;
              best = [utxo];
            }
          }
        } else {
          throw new Error("prepareCollateral: could not resolve some input");
        }
      }
    }
    // If there is no best fit still, iterate over all UTXOs to find the best candidate.
    if (!best) {
      for (const utxo of this.utxos.values()) {
        const coinAmount = this.getUtxoEffectiveCoin(utxo);
        if (
          coinAmount >= 5_000_000n &&
          utxo.output().address().getProps().paymentPart?.type ==
            CredentialType.KeyHash
        ) {
          const ranking = value.assetTypes(utxo.output().amount());
          if (ranking < rank) {
            rank = ranking;
            best = [utxo];
          }
        }
      }
      if (best) {
        for (const bestUtxo of best) {
          this.utxoScope.add(bestUtxo);
        }
      } else {
        const collateral: TransactionUnspentOutput[] = [];
        let adaAmount = 0n;
        // Check the provided collateral inputs to see if we can build valid collateral
        for (
          let i = 0;
          i <
          Math.min(this.params.maxCollateralInputs, providedCollateral.length);
          i++
        ) {
          adaAmount += providedCollateral[i]!.output().amount().coin();
          collateral.push(providedCollateral[i]!);
          if (adaAmount >= 5_000_000n) {
            break;
          }
        }
        // If we still haven't reached the necessary collateral amount, try to use any available UTxO
        if (adaAmount < 5_000_000n) {
          // create a sorted list of utxos by ada amount
          const adaUtxos = [...this.utxos.values()].sort((a, b) => {
            const aCoinAmount = this.getUtxoEffectiveCoin(a);
            const bCoinAmount = this.getUtxoEffectiveCoin(b);
            return aCoinAmount < bCoinAmount ? -1 : 1;
          });
          for (
            let i = 0;
            i < Math.min(this.params.maxCollateralInputs, adaUtxos.length);
            i++
          ) {
            adaAmount += this.getUtxoEffectiveCoin(adaUtxos[i]!);
            collateral.push(adaUtxos[i]!);
            if (adaAmount >= 5_000_000n) {
              break;
            }
          }
        }
        if (adaAmount <= 5_000_000) {
          throw new Error(
            "prepareCollateral: could not find enough collateral (5 ada minimum)",
          );
        }
        best = collateral;
      }
    }
    // Set the selected UTXO as collateral in the transaction body.
    const tis = CborSet.fromCore([], TransactionInput.fromCore);
    tis.setValues(best.map((x) => x.input()));
    this.body.setCollateral(tis);

    for (const bestUtxo of best) {
      const key = bestUtxo.output().address().getProps().paymentPart!;
      if (key.type == CredentialType.ScriptHash) {
        this.requiredNativeScripts.add(key.hash);
      } else {
        this.requiredWitnesses.add(HashAsPubKeyHex(key.hash));
      }
    }
    // Also set the collateral return to the output of the selected UTXO.
    const ret = new TransactionOutput(
      this.collateralChangeAddress ?? this.changeAddress!,
      best.reduce(
        (acc, x) => value.merge(acc, x.output().amount()),
        value.zero(),
      ),
    );
    this.body.setCollateralReturn(ret);
  }

  /**
   * Returns the effective coin value of the utxo substracting the min utxo needed for the multiasset in the utxo
   *
   * @param {TransactionUnspentOutput} utxo - The utxo to calculate the effective coin value
   * @returns {bigint} The effective coin value of the utxo
   * */
  private getUtxoEffectiveCoin(utxo: TransactionUnspentOutput): bigint {
    const output = utxo.output();
    const multiasset = output.amount().multiasset();
    const hasMultiasset = multiasset && multiasset.size > 0;
    const outputMinAda = this.calculateMinAda(output);
    return hasMultiasset
      ? output.amount().coin() - outputMinAda
      : output.amount().coin();
  }

  /**
   * Adjusts the balance of the transaction by creating or updating a change output.
   * This method takes only the native assets from excess value from the transaction, removes any zero-valued
   * tokens from the multiasset map, and then creates change outputs that don't exceed the minValueSize.
   *
   * Updates the changeOutputIndex to the index of the last change output.
   *
   * @param {Value} excessValue - The excess value that needs to be returned as change.
   * returns {Value} The remaining excess value after creating change outputs. (Which should only be ADA)
   */
  private balanceMultiAssetChange(excessValue: Value): Value {
    const tokenMap = excessValue.multiasset();
    if (tokenMap) {
      for (const key of tokenMap.keys()) {
        if (tokenMap.get(key) == 0n) {
          tokenMap.delete(key);
        }
      }
      excessValue.setMultiasset(tokenMap);
    }
    let changeExcess = excessValue;
    const multiAsset = excessValue.multiasset();
    if (!multiAsset || multiAsset.size == 0) return excessValue;
    let output = new TransactionOutput(this.changeAddress!, value.zero());
    for (const [asset, qty] of Array.from(multiAsset.entries())) {
      const newOutputValue = value.merge(
        output.amount(),
        value.makeValue(0n, [asset, qty]),
      );
      const newOutputValueByteLength = newOutputValue.toCbor().length / 2;
      //We need to check if the new output value is too large
      //We leave a small buffer for the change ADA. Also we don't need such a big output so 10% is fine
      if (newOutputValueByteLength > this.params.maxValueSize * 0.9) {
        this.addOutput(output);
        changeExcess = value.sub(changeExcess, output.amount());
        output = new TransactionOutput(
          this.changeAddress!,
          value.makeValue(0n, [asset, qty]),
        );
      } else {
        output = new TransactionOutput(this.changeAddress!, newOutputValue);
      }
    }
    this.addOutput(output);
    changeExcess = value.sub(changeExcess, output.amount());
    return changeExcess;
  }

  /**
   * Balances the collateral change by creating a transaction output that returns the excess collateral.
   * Throws an error if the change address is not set.
   */
  private balanceCollateralChange() {
    // Ensure a change address is set before proceeding.
    if (!this.changeAddress) {
      throw new Error("balanceCollateralChange: change address not set");
    }
    const collateral = this.body.collateral();
    if (!collateral || collateral.size() == 0) {
      return;
    }
    // Retrieve available UTXOs within scope.
    const scope = [
      ...this.utxoScope.values(),
      ...this.collateralUtxos.values(),
    ];
    // Calculate the total collateral based on the transaction fee and collateral percentage.
    const totalCollateral = BigInt(
      Math.ceil(
        (this.params.collateralPercentage / 100) *
          Number(bigintMax(this.fee, this.minimumFee) + this.feePadding),
      ),
    );
    // Calculate the collateral value by summing up the amounts from collateral inputs.
    const collateralValue = this.body
      .collateral()!
      .values()
      .reduce((acc: Value, input: TransactionInput) => {
        const utxo = scope.find(
          (x) =>
            x.input().transactionId() === input.transactionId() &&
            x.input().index() === input.index(),
        );
        if (!utxo) {
          throw new Error(
            "balanceCollateralChange: Could not resolve some collateral input",
          );
        }
        return value.merge(utxo.output().amount(), acc);
      }, value.zero());
    // Create a transaction output for the change address with the adjusted collateral value.
    this.body.setCollateralReturn(
      new TransactionOutput(
        this.changeAddress,
        value.merge(collateralValue, new Value(-totalCollateral)),
      ),
    );
    // Update the transaction body with the total collateral amount.
    this.body.setTotalCollateral(totalCollateral);
  }

  /**
   * Prints the transaction cbor in its current state without trying to complete it
   * @returns {string} The CBOR representation of the transaction
   * */
  toCbor(): string {
    const tw = this.buildTransactionWitnessSet();
    return new Transaction(this.body, tw, this.auxiliaryData).toCbor();
  }

  /**
   * Completes the transaction by performing several key operations:
   * - Verifies the presence of a change address.
   * - Gathers inputs and performs coin selection if necessary.
   * - Balances the change output.
   * - Builds the transaction witness set.
   * - Calculates the script data hash.
   * - Estimates and sets the transaction fee.
   * - Merges the fee value with the excess value and rebalances the change.
   *
   * @throws {Error} If the change address is not set, or if the coin selection fails to eliminate negative values,
   *                 or if balancing the change output fails.
   * @returns {Promise<Transaction>} A new Transaction object with all components set and ready for submission.
   */
  async complete(): Promise<Transaction> {
    // Execute pre-complete hooks
    if (this.preCompleteHooks && this.preCompleteHooks.length > 0) {
      for (const hook of this.preCompleteHooks) {
        await hook(this);
      }
    }
    // Ensure a change address has been set before proceeding.
    if (!this.changeAddress) {
      throw new Error(
        "Cannot complete transaction without setting change address",
      );
    }
    if (this.networkId === undefined) {
      throw new Error(
        "Cannot complete transaction without setting a network id",
      );
    }
    // TODO: Potential bug with js SDK where setting the network to testnet causes the tx body CBOR to fail
    // this.body.setNetworkId(this.networkId);

    // Gather all inputs from the transaction body.
    const inputs = [...this.body.inputs().values()];
    // Perform initial checks and preparations for coin selection.
    const preliminaryDraftTx = new Transaction(
      this.body,
      new TransactionWitnessSet(),
    );
    const preliminaryFee =
      this.params.minFeeConstant +
      (preliminaryDraftTx.toCbor().length / 2) * this.params.minFeeCoefficient;
    let excessValue = this.getPitch(
      bigintMax(BigInt(Math.ceil(preliminaryFee)), this.minimumFee),
    );
    let spareInputs: TransactionUnspentOutput[] = [];
    for (const [utxo] of this.utxos.entries()) {
      if (!inputs.includes(utxo.input())) {
        spareInputs.push(utxo);
      }
    }
    // Perform coin selection to cover any negative excess value.
    const selectionResult = this.coinSelector(
      spareInputs,
      value.negate(value.negatives(excessValue)),
    );
    // Update the excess value and spare inputs based on the selection result.
    excessValue = value.merge(excessValue, selectionResult.selectedValue);
    spareInputs = selectionResult.inputs;
    // Add selected inputs to the transaction.
    if (selectionResult.selectedInputs.length > 0) {
      for (const input of selectionResult.selectedInputs) {
        this.addInput(input);
      }
    } else {
      if (this.body.inputs().size() == 0) {
        if (!spareInputs[0]) {
          throw new Error(
            "No spare inputs available to add to the transaction",
          );
        }
        // Select the input with the least number of different multiassets from spareInputs
        const [inputWithLeastMultiAssets] = spareInputs.reduce(
          ([minInput, minMultiAssetCount], currentInput) => {
            const currentMultiAssetCount = value.assetTypes(
              currentInput.output().amount(),
            );
            return currentMultiAssetCount < minMultiAssetCount
              ? [currentInput, minMultiAssetCount]
              : [minInput, value.assetTypes(minInput.output().amount())];
          },
          [spareInputs[0], value.assetTypes(spareInputs[0].output().amount())],
        );
        this.addInput(inputWithLeastMultiAssets);
        // Remove the selected input from spareInputs
        spareInputs = spareInputs.filter(
          (input) => input !== inputWithLeastMultiAssets,
        );
      }
    }
    if (this.body.inputs().values().length == 0) {
      throw new Error(
        "TxBuilder: resolved empty input set, cannot construct transaction!",
      );
    }
    // Ensure the coin selection has eliminated all negative values.
    if (!value.empty(value.negatives(excessValue))) {
      throw new Error(
        "Unreachable! Somehow coin selection succeeded but still failed.",
      );
    }

    // We first balance the native assets  to avoid issues with the max value size being exceeded
    excessValue = this.balanceMultiAssetChange(excessValue);
    // Balance the change output with the updated excess value.
    this.balanceChange(excessValue);
    // Ensure a change output index has been set after balancing.
    if (this.changeOutputIndex === undefined) {
      throw new Error(
        "Unreachable! Somehow change balancing succeeded but still failed.",
      );
    }
    // Build the transaction witness set for fee estimation and script validation.
    //excessValue = this.getPitch(false)
    let tw = this.buildTransactionWitnessSet();
    // Calculate and set the script data hash if necessary.
    {
      const scriptDataHash = this.getScriptDataHash(tw);
      if (scriptDataHash) {
        this.body.setScriptDataHash(scriptDataHash);
      }
    }
    // Verify and set the auxiliary data
    const auxiliaryData = this.auxiliaryData;
    if (auxiliaryData) {
      const auxiliaryDataHash = this.getAuxiliaryDataHash(auxiliaryData);
      if (auxiliaryDataHash != this.body.auxiliaryDataHash()) {
        throw new Error(
          "TxBuilder complete: auxiliary data somehow didn't match auxiliary data hash",
        );
      }
    } else {
      if (this.body.auxiliaryDataHash() != undefined) {
        throw new Error(
          "TxBuilder complete: auxiliary data somehow didn't match auxiliary data hash",
        );
      }
    }
    this.balanceChange(excessValue);
    // Create a draft transaction for fee calculation.
    const draft_tx = new Transaction(this.body, tw, this.auxiliaryData);
    // Calculate and set the transaction fee.
    let draft_size = draft_tx.toCbor().length / 2;
    this.calculateFees(draft_tx);
    excessValue = value.merge(
      excessValue,
      new Value(
        -(bigintMax(this.fee, this.minimumFee) + this.feePadding) +
          BigInt(preliminaryFee),
      ),
    );
    this.balanceChange(excessValue);
    let evaluationFee: bigint = 0n;
    if (this.redeemers.size() > 0) {
      this.prepareCollateral();
      tw = this.buildTransactionWitnessSet();
      try {
        evaluationFee = await this.evaluate(draft_tx);
      } catch (e) {
        console.log(
          `An error occurred when trying to evaluate this transaction. Full CBOR: ${draft_tx.toCbor()}`,
        );
        throw e;
      }
      tw.setRedeemers(this.redeemers);
      draft_tx.setWitnessSet(tw);
      this.calculateFees(draft_tx);
      if (this.fee > this.minimumFee) {
        if (this.fee - evaluationFee > this.minimumFee) {
          excessValue = value.merge(excessValue, new Value(-evaluationFee));
          this.balanceChange(excessValue);
        } else {
          const feeChange = this.fee - this.minimumFee;
          excessValue = value.merge(excessValue, new Value(-feeChange));
          this.balanceChange(excessValue);
        }
      }
    }
    {
      const scriptDataHash = this.getScriptDataHash(tw);
      if (scriptDataHash) {
        this.body.setScriptDataHash(scriptDataHash);
      }
    }
    if (this.feePadding > 0n) {
      console.warn(
        "A transaction was built using fee padding. This is useful for working around changes to fee calculation, but ultimately is a bandaid. If you find yourself needing this, please open a ticket at https://github.com/butaneprotocol/blaze-cardano so we can fix the underlying inaccuracy!",
      );
    }
    let final_size = draft_size;
    do {
      const oldEvaluationFee = evaluationFee;
      const newTW = this.buildTransactionWitnessSet();
      const redeemers = tw.redeemers();
      if (redeemers) newTW.setRedeemers(redeemers);
      tw = newTW;
      draft_tx.setWitnessSet(tw);
      this.calculateFees(draft_tx);
      excessValue = this.getPitch();

      this.balanceChange(Value.fromCore(excessValue.toCore()));
      const changeOutput = this.body.outputs()[this.changeOutputIndex!]!;
      if (changeOutput.amount().coin() > excessValue.coin()) {
        const excessDifference = value.merge(
          changeOutput!.amount(),
          value.negate(excessValue),
        );
        // we must add more inputs, to cover the difference
        if (spareInputs.length == 0) {
          throw new Error("Tx builder could not satisfy coin selection");
        }
        const selectionResult = this.coinSelector(
          spareInputs,
          excessDifference,
        );
        spareInputs = selectionResult.inputs;
        for (const input of selectionResult.selectedInputs) {
          this.addInput(input);
        }
        draft_tx.setBody(this.body);
        if (evaluationFee > 0) {
          await this.evaluate(draft_tx);
          tw.setRedeemers(this.redeemers);
          draft_tx.setWitnessSet(tw);
          this.calculateFees(draft_tx);
          {
            const scriptDataHash = this.getScriptDataHash(tw);
            if (scriptDataHash) {
              this.body.setScriptDataHash(scriptDataHash);
            }
          }
          if (evaluationFee > oldEvaluationFee) {
            continue;
          }
        }
      }
      if (this.body.collateral()) {
        this.balanceCollateralChange();
      }
      draft_tx.setBody(this.body);
      draft_size = final_size;
      final_size = draft_tx.toCbor().length / 2;
    } while (final_size != draft_size || !this.balanced());
    // Return the fully constructed transaction.
    tw.setVkeys(CborSet.fromCore([], VkeyWitness.fromCore));
    return new Transaction(this.body, tw, this.auxiliaryData);
  }

  /**
   * Adds a certificate to delegate a staker to a pool
   *
   * @param {Credential} delegator - The credential of the staker to delegate.
   * @param {PoolId} poolId - The ID of the pool to delegate to.
   * @param {PlutusData} [redeemer] - Optional. A redeemer to be used if the delegation requires Plutus script validation.
   * @returns {TxBuilder} The updated transaction builder.
   */
  addDelegation(
    delegator: Credential,
    poolId: PoolId,
    redeemer?: PlutusData,
  ): TxBuilder {
    const stakeDelegation: StakeDelegationCertificate = {
      __typename: CertificateType.StakeDelegation,
      stakeCredential: delegator.toCore(),
      poolId: poolId,
    };
    const delegationCertificate: Certificate = Certificate.newStakeDelegation(
      StakeDelegation.fromCore(stakeDelegation),
    );
    const certs =
      this.body.certs() ?? CborSet.fromCore([], Certificate.fromCore);
    const vals = [...certs.values(), delegationCertificate];
    certs.setValues(vals);
    this.body.setCerts(certs);
    const delegatorCredential = delegator.toCore();
    if (delegatorCredential.type == CredentialType.ScriptHash) {
      if (redeemer) {
        this.requiredPlutusScripts.add(delegatorCredential.hash);
        const redeemers = [...this.redeemers.values()];
        redeemers.push(
          Redeemer.fromCore({
            index: 256, // todo: fix
            purpose: RedeemerPurpose["certificate"],
            data: redeemer.toCore(),
            executionUnits: {
              memory: this.params.maxExecutionUnitsPerTransaction.memory,
              steps: this.params.maxExecutionUnitsPerTransaction.steps,
            },
          }),
        );
        this.redeemers.setValues(redeemers);
      } else {
        this.requiredNativeScripts.add(delegatorCredential.hash);
      }
    } else if (redeemer) {
      throw new Error(
        "TxBuilder addDelegation: failing to attach redeemer to a non-script delegation!",
      );
    } else {
      this.requiredWitnesses.add(HashAsPubKeyHex(delegatorCredential.hash));
    }
    return this;
  }

  /**
   * This method delegates the selected reward address to a pool.
   * It first checks if the reward address is set and if it has a stake component.
   * If both conditions are met, it adds a delegation to the transaction.
   *
   * @param {PoolId} poolId - The ID of the pool to delegate the reward address to.
   * @throws {Error} If the reward address is not set or if the method is unimplemented.
   */
  delegate(poolId: PoolId, redeemer?: PlutusData) {
    if (!this.rewardAddress) {
      throw new Error("TxBuilder delegate: Reward address must be set!");
    }
    const credential = this.rewardAddress!.getProps().delegationPart;
    if (!credential) {
      throw new Error(
        "TxBuilder delegate: Somehow the reward address had no stake component",
      );
    }
    this.addDelegation(Credential.fromCore(credential), poolId, redeemer);
    return this;
  }

  /**
   * Adds a certificate to register a staker.
   * @param {Credential} credential - The credential to register.
   * @throws {Error} Method not implemented.
   */
  addRegisterStake(credential: Credential) {
    const stakeRegistration: StakeRegistration = new StakeRegistration(
      credential.toCore(),
    );
    const registrationCertificate: Certificate =
      Certificate.newStakeRegistration(stakeRegistration);
    const certs =
      this.body.certs() ?? CborSet.fromCore([], Certificate.fromCore);
    const vals = [...certs.values(), registrationCertificate];
    certs.setValues(vals);
    this.body.setCerts(certs);
    return this;
  }

  /**
   * Adds a certificate to deregister a staker.
   * @throws {Error} Method not implemented.
   */
  addDeregisterStake() {
    throw new Error("Method not implemented.");
  }

  /**
   * Adds a certificate to register a pool.
   * @throws {Error} Method not implemented.
   */
  addRegisterPool() {
    throw new Error("Method not implemented.");
  }

  /**
   * Adds a certificate to retire a pool.
   * @throws {Error} Method not implemented.
   */
  addRetirePool() {
    throw new Error("Method not implemented.");
  }

  /**
   * Specifies the exact time when the transaction becomes valid.
   *
   * @param {Slot} validFrom - The slot from which the transaction becomes valid.
   * @throws {Error} If the validity start interval is already set.
   * @returns {TxBuilder} The instance of this TxBuilder for chaining.
   */
  setValidFrom(validFrom: Slot): TxBuilder {
    if (this.body.validityStartInterval() !== undefined) {
      throw new Error(
        "TxBuilder setValidFrom: Validity start interval is already set",
      );
    }
    this.body.setValidityStartInterval(validFrom);
    return this;
  }

  /**
   * Specifies the exact time when the transaction expires.
   *
   * @param {Slot} validUntil - The slot until which the transaction is valid.
   * @throws {Error} If the time to live is already set.
   * @returns {TxBuilder} The instance of this TxBuilder for chaining.
   */
  setValidUntil(validUntil: Slot): TxBuilder {
    if (this.body.ttl() !== undefined) {
      throw new Error("TxBuilder setValidUntil: Time to live is already set");
    }
    this.body.setTtl(validUntil);
    return this;
  }

  /**
   * Adds a withdrawal to the transaction. This method allows for the withdrawal of funds from a staking reward account.
   * Optionally, a redeemer can be provided for script validation purposes.
   *
   * @param {C.Cardano.RewardAccount} address - The reward account from which to withdraw.
   * @param {bigint} amount - The amount of ADA to withdraw.
   * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation.
   * @returns {TxBuilder} The same transaction builder
   * @throws {Error} If the reward account does not have a stake credential or if any other error occurs.
   */
  addWithdrawal(
    address: RewardAccount,
    amount: bigint,
    redeemer?: PlutusData,
  ): TxBuilder {
    const withdrawalHash =
      Address.fromBech32(address).getProps().paymentPart?.hash;
    if (!withdrawalHash) {
      throw new Error(
        "addWithdrawal: The RewardAccount provided does not have an associated stake credential.",
      );
    }
    const insertIdx = this.insertSorted(
      this.consumedWithdrawalHashes,
      withdrawalHash,
    );
    // Retrieve existing withdrawals or initialize a new map if none exist.
    const withdrawals: Map<RewardAccount, bigint> =
      this.body.withdrawals() ?? new Map();
    // Sanity check duplicates
    if (withdrawals.has(address)) {
      throw new Error(
        "addWithdrawal: Withdrawal for this address already exists.",
      );
    }
    // Set the withdrawal amount for the specified address.
    withdrawals.set(address, amount);
    // Update the transaction body with the new or updated withdrawals map.
    this.body.setWithdrawals(withdrawals);
    // If a redeemer is provided, process it for script validation.
    if (redeemer) {
      this.requiredPlutusScripts.add(withdrawalHash);
      const redeemers = [...this.redeemers.values()];
      for (const redeemer of redeemers) {
        if (
          redeemer.tag() == RedeemerTag.Reward &&
          redeemer.index() >= BigInt(insertIdx)
        ) {
          redeemer.setIndex(redeemer.index() + 1n);
        }
      }
      // Add the redeemer to the list of redeemers with execution units based on transaction parameters.
      redeemers.push(
        Redeemer.fromCore({
          index: insertIdx,
          purpose: RedeemerPurpose["withdrawal"], // TODO: Confirm the purpose of the redeemer.
          data: redeemer.toCore(),
          executionUnits: {
            memory: this.params.maxExecutionUnitsPerTransaction.memory,
            steps: this.params.maxExecutionUnitsPerTransaction.steps,
          },
        }),
      );
      // Update the transaction with the new list of redeemers.
      this.redeemers.setValues(redeemers);
    } else {
      // If no redeemer is provided, process the address for required scripts or witnesses.
      const key = Address.fromBech32(address).getProps().paymentPart;
      if (!key) {
        throw new Error(
          "addWithdrawal: The RewardAccount provided does not have an associated stake credential.",
        );
      }
      // Add the required scripts or witnesses based on the type of the stake credential.
      if (key.type == CredentialType.ScriptHash) {
        this.requiredNativeScripts.add(key.hash);
      } else {
        this.requiredWitnesses.add(HashAsPubKeyHex(key.hash));
      }
    }
    return this;
  }

  /**
   * Adds a required signer to the transaction. This is necessary for transactions that must be explicitly signed by a particular key.
   *
   * @param {Ed25519KeyHashHex} signer - The hash of the Ed25519 public key that is required to sign the transaction.
   * @returns {TxBuilder} The same transaction builder
   */
  addRequiredSigner(signer: Ed25519KeyHashHex): TxBuilder {
    // Retrieve existing required signers or initialize a new CBOR set if none exist.
    const signers: CborSet<
      Ed25519KeyHashHex,
      Hash<Ed25519KeyHashHex>
    > = this.body.requiredSigners() ?? CborSet.fromCore([], Hash.fromCore);
    this.requiredWitnesses.add(
      HashAsPubKeyHex(Hash28ByteBase16.fromEd25519KeyHashHex(signer)),
    );
    // Convert the signer to a hash and add it to the set of required signers.
    const values = [...signers.values()];
    values.push(Hash.fromCore(signer));
    signers.setValues(values);
    // Update the transaction body with the new set of required signers.
    this.body.setRequiredSigners(signers);
    return this;
  }

  /**
   * Computes the hash of the auxiliary data if it exists.
   *
   * @param {AuxiliaryData} auxiliaryData - The auxiliary data to hash.
   * @returns {Hash32ByteBase16 | undefined} The hash of the auxiliary data or undefined if no auxiliary data is provided.
   */
  private getAuxiliaryDataHash(
    auxiliaryData: AuxiliaryData,
  ): Hash32ByteBase16 | undefined {
    return auxiliaryData ? blake2b_256(auxiliaryData.toCbor()) : undefined;
  }

  /**
   * Sets the auxiliary data for the transaction and updates the transaction's auxiliary data hash.
   *
   * @param {AuxiliaryData} auxiliaryData - The auxiliary data to set.
   * @returns {TxBuilder} The same transaction builder
   */
  setAuxiliaryData(auxiliaryData: AuxiliaryData): TxBuilder {
    const auxiliaryDataHash = this.getAuxiliaryDataHash(auxiliaryData);
    if (auxiliaryDataHash) {
      this.body.setAuxiliaryDataHash(auxiliaryDataHash);
    }
    this.auxiliaryData = auxiliaryData;
    return this;
  }

  /**
   * Adds a script to the transaction's script scope. If the script is already provided via a reference script,
   * it will not be explicitly used again. This method ensures that each script is only included once in the
   * transaction, either directly or by reference, to optimize the transaction size and processing.
   *
   * @param {Script} script - The script to be added to the transaction's script scope.
   * @returns {TxBuilder} The same transaction builder
   */
  provideScript(script: Script): TxBuilder {
    this.scriptScope.add(script);
    return this;
  }

  /**
   * Adds a pre-complete hook to the transaction builder. This hook will be executed
   * before the transaction is finalized.
   *
   * Pre-complete hooks are useful for performing last-minute modifications or
   * validations on the transaction before it's completed. Multiple hooks can be
   * added, and they will be executed in the order they were added.
   *
   * @param {(tx: TxBuilder) => Promise<void>} hook - A function that takes the TxBuilder
   * instance as an argument and performs some operation. The hook should be asynchronous.
   * @returns {TxBuilder} The same transaction builder instance for method chaining.
   */
  addPreCompleteHook(hook: (tx: TxBuilder) => Promise<void>): TxBuilder {
    if (!this.preCompleteHooks) {
      this.preCompleteHooks = [];
    }
    this.preCompleteHooks.push(hook);
    return this;
  }
}

/**
 * Asserts that the given address is a valid payment address.
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is a script hash.
 */
function assertPaymentsAddress(address: Address) {
  const props = address.getProps();
  if (!props.paymentPart) {
    throw new Error("assertPaymentsAddress: address has no payment part!");
  }
  if (props.paymentPart.type == CredentialType.ScriptHash) {
    throw new Error(
      "assertPaymentsAddress: address payment credential cannot be a script hash!",
    );
  }
}

/**
 * Asserts that the given address is a valid lock address.
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is not a script hash.
 */
function assertLockAddress(address: Address) {
  const props = address.getProps();
  if (!props.paymentPart) {
    throw new Error("assertLockAddress: address has no payment part!");
  }
  if (props.paymentPart.type != CredentialType.ScriptHash) {
    throw new Error(
      "assertLockAddress: address payment credential must be a script hash!",
    );
  }
}

/**
 * Returns the maximum of two BigInt values.
 * @param {bigint} a - The first bigint value.
 * @param {bigint} b - The second bigint value.
 * @returns {bigint} The maximum value.
 */
function bigintMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}
