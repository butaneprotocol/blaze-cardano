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
  Hash,
  HashAsPubKeyHex,
  PolicyIdToHash,
  getPaymentAddress,
  Certificate,
  StakeDelegation,
  CertificateType,
  RedeemerTag,
  StakeRegistration,
  StakeDeregistration,
  getBurnAddress,
  setInConwayEra,
} from "@blaze-cardano/core";
import * as value from "./value";
import { micahsSelector } from "./coinSelectors/micahsSelector";
import type {
  IScriptData,
  SelectionResult,
  CoinSelectionFunc,
  UseCoinSelectionArgs,
} from "./types";
import {
  calculateMinAda,
  calculateReferenceScriptFee,
  calculateRequiredCollateral,
  computeScriptData,
  getAuxiliaryDataHash,
  insertSorted,
  isEqualInput,
  stringifyBigint,
  assertPaymentsAddress,
  assertLockAddress,
  bigintMax,
} from "./utils";

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

  private consumedDelegationHashes: Hash28ByteBase16[] = [];
  private consumedMintHashes: Hash28ByteBase16[] = [];
  private consumedWithdrawalHashes: Hash28ByteBase16[] = [];
  private consumedDeregisterHashes: Hash28ByteBase16[] = [];
  private consumedSpendInputs: string[] = [];
  private minimumFee: bigint = 0n; // minimum fee for the transaction, in lovelace. For script eval purposes!
  private feePadding: bigint = 0n; // A padding to add onto the fee; use only in emergencies, and open a ticket so we can fix the fee calculation please!
  private coinSelector: CoinSelectionFunc = micahsSelector;
  private _burnAddress?: Address;

  /**
   * Constructs a new instance of the TxBuilder class.
   * Initializes a new transaction body with an empty set of inputs, outputs, and no fee.
   */
  constructor(
    params: ProtocolParameters,
    private tracing: boolean = false,
  ) {
    setInConwayEra(true);
    this.params = params;
    this.body = new TransactionBody(
      CborSet.fromCore([], TransactionInput.fromCore),
      [],
      0n,
      undefined,
    );
  }

  /**
   * Returns the burn address.
   *
   * @returns {Address}
   */
  get burnAddress(): Address {
    if (!this._burnAddress) {
      this._burnAddress = getBurnAddress(this.networkId!);
    }
    return this._burnAddress;
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
   * Internal tracing functiong to log.
   *
   * @param {string} msg Describe message.
   * @param {any[]} extra Extra variables you want to print in the trace message.
   */
  private trace(msg: string, ...extra: any[]): void {
    if (!this.tracing) {
      return;
    }

    console.log(msg, ...extra);
  }

  /**
   * Hook to allow an existing instance to turn on tracing.
   *
   * @param {boolean} enabled Whether to enable tracing.
   * @returns {TxBuilder}
   */
  public enableTracing(enabled: boolean): TxBuilder {
    this.tracing = enabled;
    return this;
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
   * Sets the donation to the treasury in lovelace
   *
   * @param {bigint} donation - The amount of lovelace to donate back to the treasury
   * @returns {TxBuilder} The same transaction builder
   */
  setDonation(donation: bigint): TxBuilder {
    this.body.setDonation(donation);
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
    const insertIdx = insertSorted(this.consumedSpendInputs, oref);

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
        // TODO: as of chang, this is no longer true
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
  provideCollateral(utxos: TransactionUnspentOutput[]): TxBuilder {
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
    const insertIdx = insertSorted(
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
    return calculateMinAda(output, this.params.coinsPerUtxoByte);
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
   * Builds a full witness set with the provided signatures
   *
   * This includes collecting all necessary scripts (native, Plutus V1, V2, V3),
   * vkey signatures, redeemers, and Plutus data required for script validation.
   *
   * It organizes these components into a structured format that can be
   * serialized and included in the transaction.
   *
   * @returns {TransactionWitnessSet} A constructed transaction witness set.
   * @throws {Error} If a required script cannot be resolved by its hash.
   */
  protected buildFinalWitnessSet(
    signatures: [Ed25519PublicKeyHex, Ed25519SignatureHex][],
  ): TransactionWitnessSet {
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
              `complete: Could not resolve script hash: ${script.hash()} (was not native script). Did you forget to add a redeemer, attach a reference input, or call provideScript?`,
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

    tw.setVkeys(CborSet.fromCore(signatures, VkeyWitness.fromCore));
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
   * Recalculates the internal tracking of required signatures/redeemers
   * by looping through existing inputs and certificates.
   *
   * @return {void}
   */
  private updateRequiredWitnesses(): void {
    this.body
      .inputs()
      .values()
      .forEach((input) => {
        const output = [...this.utxoScope.values()]
          .find((utxo) => isEqualInput(utxo.input(), input))
          ?.output();
        if (!output) {
          return;
        }

        const key = output.address().getProps().paymentPart;
        if (!key) {
          return;
        }

        if (key.type == CredentialType.ScriptHash) {
          const nativeScript = output.scriptRef()?.asNative() !== undefined;
          if (nativeScript) {
            this.requiredNativeScripts.add(key.hash);
          } else {
            this.requiredPlutusScripts.add(key.hash);
          }
        } else {
          this.requiredWitnesses.add(HashAsPubKeyHex(key.hash));
        }
      });

    for (const cert of this.body.certs()?.values() || []) {
      switch (cert.kind()) {
        case 0: // Stake Registration
          this.requiredWitnesses.add(
            HashAsPubKeyHex(cert.asStakeRegistration()!.stakeCredential().hash),
          );
          break;
        case 1: // Stake Deregistration
          this.requiredWitnesses.add(
            HashAsPubKeyHex(
              cert.asStakeDeregistration()!.stakeCredential().hash,
            ),
          );
          break;
        case 2: // Stake Delegation
          this.requiredWitnesses.add(
            HashAsPubKeyHex(cert.asStakeDelegation()!.stakeCredential().hash),
          );
          break;
        case 3: // Pool Registration
          this.requiredWitnesses.add(
            Ed25519PublicKeyHex(
              cert.asPoolRegistration()!.poolParameters().operator(),
            ),
          );
          break;
        case 4: // Pool Retirement
          this.requiredWitnesses.add(
            Ed25519PublicKeyHex(cert.asPoolRetirement()!.poolKeyHash()),
          );
          break;
        case 16: // dRep Registration
          this.requiredWitnesses.add(
            HashAsPubKeyHex(
              cert.asRegisterDelegateRepresentativeCert()!.credential().hash,
            ),
          );
          break;
        case 17: // dRep Unregstration
          this.requiredWitnesses.add(
            HashAsPubKeyHex(
              cert.asUnregisterDelegateRepresentativeCert()!.credential().hash,
            ),
          );
          break;
        case 18: // dRep Update
          this.requiredWitnesses.add(
            HashAsPubKeyHex(
              cert.asUpdateDelegateRepresentativeCert()!.credential().hash,
            ),
          );
          break;
      }
    }
  }

  /**
   * Builds a placeholder transaction witness set required for the transaction.
   *
   * This includes collecting all necessary scripts (native, Plutus V1, V2, V3),
   * redeemers, and Plutus data required for script validation.
   *
   * Includes placeholder signatures for the known required signers, so we estimate the transaction size accurately
   *
   * It organizes these components into a structured format that can be
   * serialized and included in the transaction.
   *
   * @returns {TransactionWitnessSet} A constructed transaction witness set.
   * @throws {Error} If a required script cannot be resolved by its hash.
   */
  protected buildPlaceholderWitnessSet(): TransactionWitnessSet {
    this.updateRequiredWitnesses();

    const placeholderSignatures: [Ed25519PublicKeyHex, Ed25519SignatureHex][] =
      Array.from(
        {
          length:
            this.requiredWitnesses.size +
            this.additionalSigners +
            this.requiredPlutusScripts.size,
        },
        (_, i) => [
          Ed25519PublicKeyHex(i.toString(16).padStart(64, "0")),
          Ed25519SignatureHex(i.toString(16).padStart(128, "0")),
        ],
      );

    return this.buildFinalWitnessSet(placeholderSignatures);
  }

  /**
   * Calculates the total net change of assets from a transaction.
   * That is, all sources of assets (inputs, withrawal certificates, etc) minus all destinations (outputs, minting, fees, etc)
   * In a balanced / well-formed transaction, this should be zero
   *
   * @returns {Value} The net value that represents the transaction's pitch.
   * @throws {Error} If a corresponding UTxO for an input cannot be found.
   */
  private getAssetSurplus(): Value {
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
    let outputValue = new Value(
      bigintMax(this.fee, this.minimumFee) + (this.body.donation() ?? 0n),
    );
    const mintValue = new Value(0n, this.body.mint());

    // Aggregate the total input value from all inputs.
    for (const input of this.body.inputs().values()) {
      let utxo: TransactionUnspentOutput | undefined;
      // Find the matching UTxO for the input.
      for (const iterUtxo of this.utxoScope.values()) {
        if (isEqualInput(iterUtxo.input(), input)) {
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

    return tilt;
  }

  /**
   * Generates a script data hash for the transaction if there are any datums or redeemers present.
   * This hash is crucial for the validation of Plutus scripts in the transaction.
   *
   * @param {TransactionWitnessSet} tw - The transaction witness set containing Plutus data.
   * @returns {IScriptData | undefined} The full lscript data if datums or redeemers are present, otherwise undefined.
   */
  protected getScriptData(tw: TransactionWitnessSet): IScriptData | undefined {
    // Initialize a container for used cost models.
    const usedCostModels = new Costmdls();
    // Populate the used cost models based on the languages used in the transaction.
    for (let i = 0; i <= Object.keys(this.usedLanguages).length; i++) {
      if (this.usedLanguages[i as PlutusLanguageVersion]) {
        // Retrieve the cost model for the current language version.
        const cm = this.params.costModels.get(i);
        // Throw an error if the cost model is missing. Note that we add one to the language version for the sake of the error message
        if (cm == undefined) {
          throw new Error(
            `complete: Could not find cost model for Plutus Language Version ${i + 1}`,
          );
        }
        // Insert the cost model into the used cost models container.
        usedCostModels.insert(new CostModel(i, cm));
      }
    }

    return computeScriptData(this.redeemers, tw.plutusData(), usedCostModels);
  }

  /**
   * Helper method to just get the script data hash from a TransactionWitnessSet.
   *
   * @param {TransactionWitnessSet} tw - The transaction witness set containing Plutus data.
   * @returns {Hash32ByteBase16 | undefined} The script data hash if datums or redeemers are present, otherwise undefined.
   */
  private getScriptDataHash(
    tw: TransactionWitnessSet,
  ): Hash32ByteBase16 | undefined {
    return this.getScriptData(tw)?.scriptDataHash;
  }

  /**
   * We may have overcommitted some lovelace from our inputs just as part of balance change;
   * On the next time around, we may want to "recover" that lovelace to cover the slightly increased fee, etc.
   */
  private recoverLovelaceFromChangeOutput(lovelace: bigint): bigint {
    if (this.changeOutputIndex === undefined) {
      return 0n;
    }
    const outputs = this.body.outputs();
    const changeOutput = outputs[this.changeOutputIndex]!;
    const minLovelace = this.calculateMinAda(changeOutput);
    if (minLovelace > changeOutput.amount().coin()) {
      throw new Error(
        `Unreachable! Somehow we created a change output with less than the minimum required lovelace: ${minLovelace}, ${changeOutput.amount().coin()}`,
      );
    }
    const newCoin = bigintMax(
      minLovelace,
      changeOutput.amount().coin() - lovelace,
    );
    const recoveredAmount = changeOutput.amount().coin() - newCoin;
    changeOutput.amount().setCoin(newCoin);
    outputs[this.changeOutputIndex] = changeOutput;
    this.body.setOutputs(outputs);
    return recoveredAmount;
  }

  /**
   * Given some excess value on a transaction, ensure this is returned as change to the change address
   *
   * @param {Value | undefined} surplusValue The excess value to balance into the change output(s)
   */
  private adjustChangeOutput(surplusValue?: Value) {
    // For convenience, if someone calls adjustChangeOutput without a value,
    // we use the delta between the inputs and outputs
    surplusValue ??= this.getAssetSurplus();
    // If the transaction is already balanced, we don't need to do anything
    // This avoids creating an "empty" change output, for example on Hydra which has 0 fees, etc.
    // NOTE: it's important to check value.empty here, and not just the excessValue.coin() because
    // there may only be excess native assets
    if (value.empty(surplusValue)) {
      this.trace("No surplus value to distribute to change");
      return;
    }
    this.trace(`Distributing surplus value to the change output`);
    // First, identify an existing or create a new change output
    const outputs = this.body.outputs();
    const changeOutput = this.getOrCreateChangeOutput();
    // Add the excess value to that output
    const newChangeOutput = new TransactionOutput(
      this.changeAddress!,
      value.merge(changeOutput.amount(), surplusValue),
    );
    // Split it, in case it's too large
    const changeOutputs = this.splitOutputIfNeeded(newChangeOutput);
    if (changeOutputs.length > 1) {
      this.trace(
        `Change output split into ${changeOutputs.length} outputs because of size`,
      );
    }
    for (const output of changeOutputs) {
      this.trace(` - ${output.amount().coin()}`);
    }
    // And then, add those back into the body, updating the changeOutputIndex for any new outputs we add
    for (let idx = 0; idx < changeOutputs.length; idx++) {
      // In most cases, the output won't be split, so the first time through the loop, we just overwrite the existing output
      if (idx === 0) {
        outputs[this.changeOutputIndex!] = changeOutputs[idx]!;
      } else {
        // But, we might have split into multiple! so now, the last added change output should become the new change output index
        this.changeOutputIndex = outputs.length;
        outputs.push(changeOutputs[idx]!);
      }
    }

    // Set those back to the body
    this.body.setOutputs(outputs);
  }

  private getOrCreateChangeOutput(): TransactionOutput {
    if (this.changeOutputIndex === undefined) {
      this.changeOutputIndex = this.body.outputs().length;
      this.addOutput(
        this.checkAndAlterOutput(
          new TransactionOutput(this.changeAddress!, value.zero()),
        ),
      );
    }
    const outputs = this.body.outputs();
    return outputs[this.changeOutputIndex]!;
  }

  private splitOutputIfNeeded(output: TransactionOutput): TransactionOutput[] {
    const outputSize = output.toCbor().length / 2;
    if (outputSize < this.params.maxValueSize) {
      return [this.checkAndAlterOutput(output)];
    }

    // This method wouldn't know what to do with datums and reference scripts, so
    // throw an error if they are set
    if (output.datum() !== undefined || output.scriptRef() !== undefined) {
      throw new Error(
        "Invariant Violated: Don't know how to split output with datums or script references",
      );
    }

    const outputs: TransactionOutput[] = [];
    let nextOutput = new TransactionOutput(output.address(), value.zero());
    let remainingLovelace = output.amount().coin();

    for (const [asset, quantity] of Array.from(
      output.amount().multiasset()?.entries() ?? [],
    )) {
      const prospectiveValue = value.merge(
        nextOutput.amount(),
        value.makeValue(0n, [asset, quantity]),
      );
      const prospectiveOutput = new TransactionOutput(
        nextOutput.address(),
        prospectiveValue,
      );
      const prospectiveSize = prospectiveOutput.toCbor().length / 2;
      // We might end up with some lovelace left over after accounting for all the minUTxO of each split UTxO
      // So, we leave a little buffer to hold that ADA; Nobody is going to worry about a UTxO that is only
      // 90% of the size it could be...
      if (prospectiveSize > this.params.maxValueSize * 0.9) {
        const correctedOutput = this.checkAndAlterOutput(nextOutput);
        outputs.push(correctedOutput);
        remainingLovelace -= correctedOutput.amount().coin();
        nextOutput = new TransactionOutput(
          output.address(),
          value.makeValue(0n, [asset, quantity]),
        );
      } else {
        nextOutput = prospectiveOutput;
      }
    }
    if (!value.empty(nextOutput.amount())) {
      const correctedOutput = this.checkAndAlterOutput(nextOutput);
      outputs.push(correctedOutput);
      remainingLovelace -= correctedOutput.amount().coin();
    }
    if (remainingLovelace > 0n) {
      const lastOutput = outputs.length - 1;
      outputs[lastOutput]!.amount().setCoin(
        outputs[lastOutput]!.amount().coin() + remainingLovelace,
      );
    }
    return outputs;
  }

  /**
   * Calculates the transaction fees based on the transaction size and parameters.
   * It updates the transaction body with the calculated fee.
   *
   * @param {Transaction} draft_tx - The draft transaction to calculate fees for.
   */
  protected calculateFees() {
    const draft_ws = this.buildPlaceholderWitnessSet();
    const draft_tx = new Transaction(this.body, draft_ws, this.auxiliaryData);

    // Get the transaction's size in bytes.
    // NOTE: This will over-estimate the fee by 176 lovelace,
    // which is derived from wrapping the vkeywitnesses in a 258 tag.
    // This produces 4 extra bytes in the transaction, but some wallets (after signing)
    // Don't include this wrapper, and thus *can* accept a lower fee.
    // However, nodes in the future will not support this and will require a 258 tag wrapper,
    // so we leave this alone and accept the slightly higher fee for future compatability.
    const txSize = draft_tx.toCbor().length / 2;

    // Calculate the fee based on the transaction size and minimum fee parameters.
    let minFee = Math.ceil(
      this.params.minFeeConstant + txSize * this.params.minFeeCoefficient,
    );

    let refScriptFee = 0;
    if (this.params.minFeeReferenceScripts) {
      // The minFeeReferenceScripts parameter governs the cost of *reference scripts*, not to be confused with *reference inputs*
      // The cardano-node parses the reference script, even if it's on the inputs, and so that extra parsing cost needs to be paid for
      const utxoScope = [...this.utxoScope.values()];
      const allInputs = [
        ...draft_tx.body().inputs().values(),
        ...(draft_tx.body().referenceInputs()?.values() ?? []),
      ];

      const refScripts = allInputs
        .map((x) =>
          utxoScope
            .find((y) => isEqualInput(y.input(), x))!
            .output()
            .scriptRef(),
        )
        .filter((x) => x !== undefined);

      if (refScripts.length > 0) {
        refScriptFee += calculateReferenceScriptFee(refScripts, this.params);
      }
    }

    minFee += Math.ceil(refScriptFee);

    let evalFee = 0;
    const redeemers = draft_tx.witnessSet().redeemers();
    if (redeemers) {
      for (const redeemer of redeemers.values()) {
        const exUnits = redeemer.exUnits();

        // Calculate the fee contribution from this redeemer and add it to the total fee.
        evalFee += this.params.prices.memory * Number(exUnits.mem());
        evalFee += this.params.prices.steps * Number(exUnits.steps());
      }
    }

    minFee += Math.ceil(evalFee);

    // Warn if we're using minimumFee or feePadding, as the goal is for blaze to perfectly estimate the transaction fees
    if (this.minimumFee > 0n || this.feePadding > 0n) {
      console.warn(
        "A transaction was built using fee padding. This is useful for working around changes to fee calculation, but ultimately is a bandaid. If you find yourself needing this, please open a ticket at https://github.com/butaneprotocol/blaze-cardano so we can fix the underlying inaccuracy!",
      );
    }

    const fee =
      bigintMax(BigInt(Math.ceil(minFee)), this.minimumFee) + this.feePadding;
    // Update the variosu places we store the fee
    // TODO: why is this duplicated in so many places? can we simplify?
    this.fee = fee;
    this.body.setFee(fee);
  }

  /**
   * Prepares the collateral for the transaction by selecting suitable UTXOs.
   * Throws an error if suitable collateral cannot be found or if some inputs cannot be resolved.{boolean}
   */
  protected prepareCollateral(
    { useCoinSelection = true }: UseCoinSelectionArgs = {
      useCoinSelection: true,
    },
  ) {
    if (this.redeemers.size() === 0) {
      this.trace(
        "prepareCollateral: No redeemers, skipping collateral preparation.",
      );
      return;
    }

    if (!useCoinSelection) {
      // Retrieve provided collateral inputs
      const providedCollateral = [...this.collateralUtxos.values()].sort(
        (a, b) =>
          a.output().amount().coin() < b.output().amount().coin() ? -1 : 1,
      );

      const totalValue = value.sum(
        providedCollateral.map((pc) => pc.output().amount()),
      );

      const requiredCollateral = calculateRequiredCollateral(
        this.fee,
        this.params.collateralPercentage,
      );

      const collateralReturn = value.merge(
        totalValue,
        value.negate(new Value(requiredCollateral)),
      );

      this.trace(`Preparing collateral...`, {
        requiredCollateral,
        providedCollateral: totalValue.coin(),
        collateralReturn: collateralReturn.coin(),
      });

      const tis = CborSet.fromCore([], TransactionInput.fromCore);
      tis.setValues(
        providedCollateral.map((pc) => {
          this.utxoScope.add(pc);
          return pc.input();
        }),
      );
      this.body.setCollateral(tis);
      this.body.setTotalCollateral(requiredCollateral);
      this.body.setCollateralReturn(
        new TransactionOutput(
          this.collateralChangeAddress ?? this.changeAddress!,
          collateralReturn,
        ),
      );
    } else {
      const requiredCollateral = calculateRequiredCollateral(
        this.body.fee(),
        this.params.collateralPercentage,
      );
      this.body.setTotalCollateral(requiredCollateral);

      let providedCollateral = value.sum(
        [...this.collateralUtxos.values()].map((c) => c.output().amount()),
      );
      let collateralReturn = value.sub(
        providedCollateral,
        new Value(requiredCollateral),
      );

      this.trace(`Preparing collateral with coin selection...`, {
        requiredCollateral,
        providedCollateral: providedCollateral.coin(),
        collateralReturn: collateralReturn.coin(),
      });

      if (providedCollateral.coin() < requiredCollateral) {
        // TODO: filter this.utxos to exclude those already on the inputs
        const { selectedInputs } = this.coinSelector(
          [...this.utxos.values()],
          new Value(requiredCollateral),
          Number(this.fee),
        );

        if (selectedInputs.length > this.params.maxCollateralInputs) {
          // TODO: custom error type so dApps can respond to this specifically
          throw new Error(
            `prepareCollateral: In order to satisfy the collateral requirement of ${requiredCollateral.toString()} lovelace, we would need more than ${this.params.maxCollateralInputs} collateral inputs.` +
              ` This can happen if the wallet consists of many UTxOs with a very small amount of ADA.`,
          );
        }

        // TODO: investigate this weird type issue
        const collateralSet = CborSet.fromCore([], TransactionInput.fromCore);
        collateralSet.setValues(selectedInputs.map((si) => si.input()));

        providedCollateral = value.sum(
          selectedInputs.map((si) => si.output().amount()),
        );

        collateralReturn = value.sub(
          providedCollateral,
          new Value(requiredCollateral),
        );

        this.collateralUtxos = new Set(selectedInputs);
        this.body.setCollateral(collateralSet);
      }

      this.body.setCollateralReturn(
        new TransactionOutput(
          this.collateralChangeAddress ?? this.changeAddress!,
          collateralReturn,
        ),
      );
    }
  }

  /**
   * Prints the transaction cbor in its current state without trying to complete it
   * @returns {string} The CBOR representation of the transaction
   * */
  toCbor(): string {
    const tw = this.buildPlaceholderWitnessSet();
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
  async complete(
    { useCoinSelection = true }: UseCoinSelectionArgs = {
      useCoinSelection: true,
    },
  ): Promise<Transaction> {
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
    let iterations = 0;
    let lastFee = 0n;
    while (iterations < 10) {
      this.trace(`Starting iteration ${iterations}`);
      iterations += 1;
      // Gather all inputs from the transaction body.
      const inputs = [...this.body.inputs().values()];

      // Build the transaction witness set for fee estimation and script validation.
      // NOTE: redeemer budgets might be off, so they'll be corrected by the second time through the loop
      const witnessSet = this.buildPlaceholderWitnessSet();

      // Verify and set the auxiliary data
      const auxiliaryData = this.auxiliaryData;
      if (auxiliaryData) {
        const auxiliaryDataHash = getAuxiliaryDataHash(auxiliaryData);
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

      // Evaluate each of the scripts to determine a evaluation fee
      if (
        this.redeemers.size() > 0 &&
        this.body.inputs().size() > 0 &&
        this.body.outputs().length > 0
      ) {
        // Evaluating the scripts may update the budgets in the redeemer, so we do this early to get a good cost estimate
        const tx = new Transaction(this.body, witnessSet, this.auxiliaryData);

        try {
          // TODO: in practice, this seems to be *slightly* overestimating the CPU steps
          this.trace(`Evaluating transaction CBOR: ${tx.toCbor()}`);
          await this.evaluate(tx);
        } catch (e) {
          // TODO: just throw a custom error type with the traces + txCbor
          this.trace(
            `An error occurred when trying to evaluate the above transaction CBOR.`,
          );

          throw e;
        }
      }

      // Perform initial checks and preparations for coin selection.
      this.calculateFees();
      this.trace(`Fee calculated to be ${this.fee.toString()}`);

      // Compute the update script data hash now that we have the witness set
      const scriptDataHash = this.getScriptDataHash(witnessSet);
      if (scriptDataHash) {
        // TODO: can we collapse draftTx into body?
        this.body.setScriptDataHash(scriptDataHash);
      }

      // Classify inputs as either part of the transaction, or "spare" for UTxO selection
      let spareInputs: TransactionUnspentOutput[] = [];
      for (const utxo of this.utxos.values()) {
        let hasInput = false;
        for (const input of inputs) {
          if (isEqualInput(input, utxo.input())) {
            hasInput = true;
            break;
          }
        }

        if (!hasInput) {
          spareInputs.push(utxo);
        }
      }
      this.trace(
        `Identified ${spareInputs.length} spare inputs: ${stringifyBigint(spareInputs.map((si) => si.toCore()))}`,
      );

      // Compute the unspent surplus from the inputs, and the deficit spending from the outputs
      // i.e. Sum(inputs) - (fee + Sum(outputs))
      let surplusAndDeficits = this.getAssetSurplus();
      const deficit = value.negatives(surplusAndDeficits);
      this.trace("SAD Coin: ", surplusAndDeficits.coin());
      this.trace("Deficit Coin: ", deficit.coin());
      for (const output of this.body.outputs()) {
        this.trace(" - ", output.amount().coin());
      }

      // If we have a deficit in ADA, try to pull that from the change UTxO, which may have been over-committed
      if (deficit.coin() < 0n) {
        const recoveredAmount = this.recoverLovelaceFromChangeOutput(
          -deficit.coin(),
        );
        this.trace(
          `Recovered ${recoveredAmount} lovelace from the change output.`,
        );
        deficit.setCoin(deficit.coin() + recoveredAmount);
        surplusAndDeficits.setCoin(surplusAndDeficits.coin() + recoveredAmount);
      }
      this.trace("SAD Coin: ", surplusAndDeficits.coin());
      this.trace("Deficit Coin: ", deficit.coin());
      for (const output of this.body.outputs()) {
        this.trace(" - ", output.amount().coin());
      }

      // Prepare and balance the collateral.
      this.prepareCollateral({ useCoinSelection });

      if (!value.empty(surplusAndDeficits)) {
        this.trace(`Transaction is imbalanced`, surplusAndDeficits.toCore());
        if (useCoinSelection && !value.empty(deficit)) {
          this.trace(`Running coin selection to satisfy imbalance`);
          // Perform coin selection to cover any negative excess value.
          const selectionResult = this.coinSelector(
            spareInputs,
            value.negate(deficit),
          );
          this.trace(
            `Selected ${selectionResult.selectedInputs.length} inputs`,
            selectionResult.selectedInputs.map((si) => si.input().toCore()),
          );
          spareInputs = selectionResult.leftoverInputs;
          // Add selected inputs to the transaction.
          if (selectionResult.selectedInputs.length > 0) {
            for (const input of selectionResult.selectedInputs) {
              this.addInput(input);
            }
          } else {
            if (this.body.inputs().size() == 0) {
              // TODO: this is a weird fallback coin selection; we should just let coin selection fail here,
              // rather than trying to do something smart
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
                [
                  spareInputs[0],
                  value.assetTypes(spareInputs[0].output().amount()),
                ],
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
          // excessValue is the unspent surplus from the inputs (or negative for the deficits)
          // so we add in the selected value which should now represent the new assetDelta
          // alternatively, this should just equal this.getAssetSurplus() now that we've added all
          // these inputs
          surplusAndDeficits = value.merge(
            surplusAndDeficits,
            selectionResult.selectedValue,
          );
          // Ensure the coin selection has eliminated all negative values.
          if (!value.empty(value.negatives(surplusAndDeficits))) {
            throw new Error(
              "Unreachable! CoinSelection is expected to throw an error if it can't reach the goal, but it returned a selection result that didn't satisfy the goal.",
            );
          }
        }

        // Balance the change output with the updated excess value.

        this.adjustChangeOutput(surplusAndDeficits);
      } else if (this.body.inputs().size() === 0) {
        // A transaction must have at least one input, or it's vulnerable to replay attacks!
        // For example, someone withdrawing 100 ADA staking rewards might be able to balance the transaction
        // without providing inputs!
        // This would allow someone in the future to submit this tx again to withdraw their staking rewards!
        // So, we must add at least one input, and then do another round of balancing
        if (spareInputs.length === 0) {
          throw new Error(
            "A transaction must have at least one input, but there are no available spare inputs to add.",
          );
        }
        this.addInput(spareInputs[0]!);
      }

      if (lastFee === this.fee) {
        break;
      }

      lastFee = BigInt(this.fee);
    }

    this.trace("Transaction succesfully balanced");
    // Return the fully constructed transaction.
    const finalWitnessSet = this.buildFinalWitnessSet([]);
    return new Transaction(this.body, finalWitnessSet, this.auxiliaryData);
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
    const credentialHash = delegator.toCore().hash;
    const insertIdx = insertSorted(
      this.consumedDelegationHashes,
      credentialHash,
    );
    const delegatorCredential = delegator.toCore();
    if (delegatorCredential.type == CredentialType.ScriptHash) {
      if (redeemer) {
        this.requiredPlutusScripts.add(delegatorCredential.hash);
        const redeemers = [...this.redeemers.values()];
        for (const redeemer of redeemers) {
          if (
            redeemer.tag() == RedeemerTag.Reward &&
            redeemer.index() >= BigInt(insertIdx)
          ) {
            redeemer.setIndex(redeemer.index() + 1n);
          }
        }
        redeemers.push(
          Redeemer.fromCore({
            index: insertIdx,
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
   * Adds a certificate to deregister a stake account.
   *
   * @param {Credential} credential - The credential to deregister.
   * @returns {TxBuilder} The updated transaction builder.
   */
  addDeregisterStake(credential: Credential, redeemer?: PlutusData): TxBuilder {
    const stakeDeregistration: StakeDeregistration = new StakeDeregistration(
      credential.toCore(),
    );
    const deregistrationCertificate: Certificate =
      Certificate.newStakeDeregistration(stakeDeregistration);
    const certs =
      this.body.certs() ?? CborSet.fromCore([], Certificate.fromCore);
    const vals = [...certs.values(), deregistrationCertificate];
    certs.setValues(vals);
    this.body.setCerts(certs);
    const credentialHash = credential.toCore().hash;
    // TODO: is this insertSorted mechanism a lurking bug, since the order might change?
    const insertIdx = insertSorted(
      this.consumedDeregisterHashes,
      credentialHash,
    );
    // TODO: this should probably be based on whether the credential is a script credential
    if (redeemer) {
      this.requiredPlutusScripts.add(credentialHash);
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
          purpose: RedeemerPurpose["certificate"], // TODO: Confirm the purpose of the redeemer.
          data: redeemer.toCore(),
          executionUnits: {
            memory: this.params.maxExecutionUnitsPerTransaction.memory,
            steps: this.params.maxExecutionUnitsPerTransaction.steps,
          },
        }),
      );
      // Update the transaction with the new list of redeemers.
      this.redeemers.setValues(redeemers);
    }
    return this;
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
    const insertIdx = insertSorted(
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
   * Sets the auxiliary data for the transaction and updates the transaction's auxiliary data hash.
   *
   * @param {AuxiliaryData} auxiliaryData - The auxiliary data to set.
   * @returns {TxBuilder} The same transaction builder
   */
  setAuxiliaryData(auxiliaryData: AuxiliaryData): TxBuilder {
    const auxiliaryDataHash = getAuxiliaryDataHash(auxiliaryData);
    this.body.setAuxiliaryDataHash(auxiliaryDataHash);
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
