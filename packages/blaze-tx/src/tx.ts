import {
  CborSet,
  TransactionInput,
  TransactionBody,
  TransactionUnspentOutput,
  Transaction,
  Value,
  TransactionOutput,
  PlutusData,
  TransactionWitnessPlutusData,
  Script,
  ScriptHash,
  Redeemers,
  Redeemer,
  RedeemerPurpose,
  Address,
  Ed25519PublicKeyHex,
  Ed25519KeyHashHex,
  Credential,
  CredentialType,
  Hash28ByteBase16,
  Hash32ByteBase16,
  Ed25519SignatureHex,
  PlutusLanguageVersion,
  TransactionWitnessSet,
  PolicyId,
  AssetName,
  TokenMap,
  AssetId,
  NativeScript,
  PlutusV1Script,
  PlutusV2Script,
  PlutusV3Script,
  VkeyWitness,
  Costmdls,
  CostModel,
  CborWriter,
  RewardAccount,
  Hash,
  HashAsPubKeyHex,
  PolicyIdToHash,
  fromHex,
  ProtocolParameters,
  getPaymentAddress,
  Datum,
  Evaluator,
  Slot,
  PoolId,
  Certificate,
  StakeDelegation,
  StakeDelegationCertificate,
  CertificateType,
  blake2b_256,
} from "@blazecardano/core";
import * as value from "./value";
import { micahsSelector } from "./coinSelection";

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
  private body: TransactionBody; // The main body of the transaction containing inputs, outputs, etc.
  private redeemers: Redeemers = Redeemers.fromCore([]); // A collection of redeemers for script validation.
  private utxos: Set<TransactionUnspentOutput> =
    new Set<TransactionUnspentOutput>(); // A set of unspent transaction outputs.
  private utxoScope: Set<TransactionUnspentOutput> =
    new Set<TransactionUnspentOutput>(); // A scoped set of UTxOs for the transaction.
  private scriptScope: Set<Script> = new Set(); // A set of scripts included in the transaction.
  private scriptSeen: Set<ScriptHash> = new Set(); // A set of script hashes that have been processed.
  private changeAddress?: Address; // The address to send change to, if any.
  private rewardAddress?: Address; // The reward address to delegate from, if any.
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

  /**
   * Sets the change address for the transaction.
   * This address will receive any remaining funds not allocated to outputs or fees.
   *
   * @param {Address} address - The address to receive the change.
   * @returns {TxBuilder} The same transaction builder
   */
  setChangeAddress(address: Address) {
    this.changeAddress = address;
    return this;
  }

  /**
   * Sets the reward address for the transaction.
   * This address will be used for delegation purposes and also stake key component of the transaction.
   *
   * @param {Address} address - The reward address
   * @returns {TxBuilder} The same transaction builder
   */
  setRewardAddress(address: Address) {
    this.rewardAddress = address;
    return this;
  }

  useEvaluator(evaluator: Evaluator) {
    this.evaluator = evaluator;
    return this;
  }

  /**
   * The additional signers field is used to add additional signing counts for fee calculation.
   * These will be included in the signing phase at a later stage.
   * This is needed due to native scripts signees being non-deterministic.
   * @param {number} amount - The amount of additional signers
   * @returns {TxBuilder} The same transaction builder
   */
  addAdditionalSigners(amount: number) {
    this.additionalSigners += amount;
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
  addReferenceInput(utxo: TransactionUnspentOutput) {
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
    let scriptRef = utxo.output().scriptRef();
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
  ) {
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
      throw new Error(
        "Cannot add duplicate reference input to the transaction",
      );
    }
    // Add the new input to the array of inputs and update the transaction body.
    values.push(utxo.input());
    inputs.setValues(values);
    this.utxoScope.add(utxo);
    this.body.setInputs(inputs);
    // Process the redeemer and datum logic for Plutus script-locked UTxOs.
    let key = utxo.output().address().getProps().paymentPart;
    if (!key) {
      throw new Error("addInput: Somehow the UTxO payment key is missing!");
    }
    if (redeemer) {
      if (key.type == CredentialType.KeyHash) {
        throw new Error(
          "addInput: Cannot spend with redeemer for KeyHash credential!",
        );
      }
      this.requiredPlutusScripts.add(key.hash);
      let datum = utxo.output().datum();
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
      let redeemers = [...this.redeemers.values()];
      redeemers.push(
        Redeemer.fromCore({
          index: 256,
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
    return this;
  }

  /**
   * Adds unspent transaction outputs (UTxOs) to the set of UTxOs available for this transaction.
   * These UTxOs can then be used for balancing the transaction, ensuring that inputs and outputs are equal.
   *
   * @param {TransactionUnspentOutput[]} utxos - The unspent transaction outputs to add.
   * @returns {TxBuilder} The same transaction builder
   */
  addUnspentOutputs(utxos: TransactionUnspentOutput[]) {
    for (const utxo of utxos) {
      this.utxos.add(utxo);
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
    // Retrieve the current mint map from the transaction body, or initialize a new one if none exists.
    const mint: TokenMap = this.body.mint() ?? new Map();
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
      let redeemers = [...this.redeemers.values()];
      // Create and add a new redeemer for the minting action, specifying execution units.
      // Note: Execution units are placeholders and are replaced with actual values during the evaluation phase.
      redeemers.push(
        Redeemer.fromCore({
          index: 256,
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
   * This method checks and alters the output of a transaction.
   * It ensures that the output meets the minimum ada requirements and does not exceed the maximum value size.
   *
   * @param {TransactionOutput} output - The transaction output to be checked and altered.
   * @returns {TransactionOutput} The altered transaction output.
   * @throws {Error} If the output does not meet the minimum ada requirements or exceeds the maximum value size.
   */
  private checkAndAlterOutput(output: TransactionOutput) {
    while (true) {
      const byteLength = BigInt(output.toCbor().length / 2);
      const minAda = BigInt(this.params.coinsPerUtxoByte) * (byteLength + 160n);
      const coin = output.amount().coin();
      if (coin < minAda) {
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
      } else {
        break;
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
  addOutput(output: TransactionOutput) {
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
   * @returns {TxBuilder} The same transaction builder
   */
  payLovelace(address: Address, lovelace: bigint) {
    assertPaymentsAddress(address);
    let paymentAddress = getPaymentAddress(address);
    this.addOutput(
      TransactionOutput.fromCore({
        address: paymentAddress,
        value: { coins: lovelace },
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
   * @returns {TxBuilder} The same transaction builder
   */
  payAssets(address: Address, value: Value) {
    assertPaymentsAddress(address);
    let paymentAddress = getPaymentAddress(address);
    this.addOutput(
      TransactionOutput.fromCore({
        address: paymentAddress,
        value: value.toCore(),
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
  ) {
    assertLockAddress(address);
    let paymentAddress = getPaymentAddress(address);
    this.addOutput(
      TransactionOutput.fromCore({
        address: paymentAddress,
        value: { coins: lovelace },
        datum: !("__opaqueString" in datum) ? datum.toCore() : undefined,
        datumHash: "__opaqueString" in datum ? datum : undefined,
        scriptReference: scriptReference?.toCore(),
      }),
    );
    return this;
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
  ) {
    assertLockAddress(address);
    let paymentAddress = getPaymentAddress(address);
    this.addOutput(
      TransactionOutput.fromCore({
        address: paymentAddress,
        value: value.toCore(),
        datum: !("__opaqueString" in datum) ? datum.toCore() : undefined,
        datumHash: "__opaqueString" in datum ? datum : undefined,
        scriptReference: scriptReference?.toCore(),
      }),
    );
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
  provideDatum(datum: PlutusData) {
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
    let allUtxos: TransactionUnspentOutput[] = Array.from(
      this.utxoScope.values(),
    );
    // todo: filter utxoscope to only include inputs, reference inputs, collateral inputs, not excess junk

    const redeemers = await this.evaluator!(draft_tx, allUtxos);
    let fee = 0;
    // Iterate over the results from the UPLC evaluator.
    for (const redeemer of redeemers.values()) {
      const exUnits = redeemer.exUnits();

      // Calculate the fee contribution from this redeemer and add it to the total fee.
      fee +=
        this.params.maxExecutionUnitsPerTransaction.steps *
        Number(exUnits.steps());
      fee +=
        this.params.maxExecutionUnitsPerTransaction.memory *
        Number(exUnits.mem());
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
  private buildTransactionWitnessSet() {
    let tw = new TransactionWitnessSet();
    // Script lookup table to map script hashes to script objects
    let scriptLookup: Record<ScriptHash, Script> = {};
    for (const script of this.scriptScope) {
      scriptLookup[script.hash()] = script;
    }
    // Arrays to hold scripts of different types
    let sn: NativeScript[] = [];
    let s1: PlutusV1Script[] = [];
    let s2: PlutusV2Script[] = [];
    let s3: PlutusV3Script[] = [];
    // Populate script arrays based on required script hashes
    for (const requiredScriptHash of this.requiredPlutusScripts) {
      if (!this.scriptSeen.has(requiredScriptHash)) {
        let script = scriptLookup[requiredScriptHash];
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
      let lang = scriptLookup[requiredScriptHash]?.language();
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
    // Add scripts to the transaction witness set
    if (sn.length != 0) {
      let cborSet = CborSet.fromCore([], NativeScript.fromCore);
      cborSet.setValues(sn);
      tw.setNativeScripts(cborSet);
    }
    if (s1.length != 0) {
      let cborSet = CborSet.fromCore([], PlutusV1Script.fromCore);
      cborSet.setValues(s1);
      tw.setPlutusV1Scripts(cborSet);
    }
    if (s2.length != 0) {
      let cborSet = CborSet.fromCore([], PlutusV2Script.fromCore);
      cborSet.setValues(s2);
      tw.setPlutusV2Scripts(cborSet);
    }
    if (s3.length != 0) {
      let cborSet = CborSet.fromCore([], PlutusV3Script.fromCore);
      cborSet.setValues(s3);
      tw.setPlutusV3Scripts(cborSet);
    }
    // Process vkey witnesses
    let vkeyWitnesses = CborSet.fromCore([], VkeyWitness.fromCore);
    let requiredWitnesses: VkeyWitness[] = [];
    for (const _item of this.requiredWitnesses.values()) {
      requiredWitnesses.push(
        VkeyWitness.fromCore([
          Ed25519PublicKeyHex("0".repeat(64)),
          Ed25519SignatureHex("0".repeat(128)),
        ]),
      );
    }
    for (let i = 0; i < this.additionalSigners; i++) {
      requiredWitnesses.push(
        VkeyWitness.fromCore([
          Ed25519PublicKeyHex("0".repeat(64)),
          Ed25519SignatureHex("0".repeat(128)),
        ]),
      );
    }
    vkeyWitnesses.setValues(requiredWitnesses);
    tw.setVkeys(vkeyWitnesses);
    tw.setRedeemers(this.redeemers);
    // Process Plutus data
    let plutusData = CborSet.fromCore([], PlutusData.fromCore);
    let plutusDataList: PlutusData[] = [];
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
  private getPitch(withSpare: boolean = true) {
    // Calculate withdrawal amounts.
    let withdrawalAmount = 0n;
    const withdrawals = this.body.withdrawals();
    if (withdrawals != undefined) {
      for (const account of withdrawals.keys()) {
        withdrawalAmount += withdrawals.get(account)!;
      }
    }
    // Initialize values for input, output, and minted amounts.
    let inputValue = new Value(withdrawalAmount);
    let outputValue = new Value(this.fee);
    let mintValue = new Value(0n, this.body.mint());

    // Aggregate the total input value from all inputs.
    for (const input of this.body.inputs().values()) {
      let utxo: TransactionUnspentOutput | undefined;
      // Find the matching UTxO for the input.
      for (const iterUtxo of this.utxoScope.values()) {
        if (iterUtxo.input().toCbor() == input.toCbor()) {
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

    this.body.outputs()[this.changeOutputIndex!] = new TransactionOutput(
      this.changeAddress!,
      value.zero(),
    );
    // Aggregate the total output value from all outputs.
    for (const output of this.body.outputs().values()) {
      outputValue = value.merge(outputValue, output.amount());
    }

    // Calculate the net value by merging input, output (negated), and mint values.
    // Subtract a fixed fee amount (5 ADA) to ensure enough is allocated for transaction fees.
    const tilt = value.merge(
      value.merge(inputValue, value.negate(outputValue)),
      mintValue,
    );
    if (withSpare == true) {
      return value.merge(tilt, new Value(-5000000n)); // Subtract 5 ADA from the excess.
    }
    return tilt;
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
    let redeemers = [...this.redeemers.values()];
    let datums = tw.plutusData()?.values().slice() || [];
    // Proceed only if there are datums or redeemers to process.
    if (datums.length > 0 || redeemers.length > 0) {
      // Initialize a CBOR writer to encode the script data.
      const writer = new CborWriter();
      // Encode redeemers and datums into CBOR format.
      writer.writeStartArray(redeemers.length);
      for (const redeemer of redeemers) {
        writer.writeEncodedValue(Buffer.from(redeemer.toCbor(), "hex"));
      }
      if (datums && datums.length > 0) {
        writer.writeStartArray(datums.length);
        for (const datum of datums) {
          writer.writeEncodedValue(Buffer.from(datum.toCbor(), "hex"));
        }
      }
      // Initialize a container for used cost models.
      let usedCostModels = new Costmdls();
      // Populate the used cost models based on the languages used in the transaction.
      for (let i = 0; i <= Object.keys(this.usedLanguages).length; i++) {
        if (i == 0) {
          // Retrieve the cost model for the current language version.
          let cm = this.params.costModels.get(i);
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
    let tokenMap = excessValue.multiasset();
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
    let output = new TransactionOutput(this.changeAddress!, excessValue);
    // If there is no existing change output index, add the new output to the transaction
    // and store its index. Otherwise, update the existing change output with the new output.
    if (!this.changeOutputIndex) {
      this.addOutput(output);
      this.changeOutputIndex = this.outputsCount - 1;
    } else {
      let outputs = this.body.outputs();
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
    this.fee = BigInt(
      Math.ceil(
        this.params.minFeeConstant +
          fromHex(draft_tx.toCbor()).length * this.params.minFeeCoefficient,
      ),
    );
    // Update the transaction body with the calculated fee.
    this.body.setFee(this.fee);
  }

  /**
   * Prepares the collateral for the transaction by selecting suitable UTXOs.
   * Throws an error if suitable collateral cannot be found or if some inputs cannot be resolved.
   */
  private prepareCollateral() {
    // Retrieve inputs from the transaction body and available UTXOs within scope.
    let inputs = [...this.body.inputs().values()];
    let scope = [...this.utxoScope.values()];
    // Initialize variables to track the best UTXO for collateral and its ranking.
    let [best, rank]: [TransactionUnspentOutput | undefined, number] = [
      undefined,
      99,
    ];
    // Iterate over inputs to find the best UTXO for collateral.
    for (const input of inputs) {
      let utxo = scope.find((x) => x.input() == input);
      if (utxo) {
        // Check if the UTXO amount is sufficient for collateral.
        if (utxo.output().amount().coin() >= 10n * 10n ** 6n) {
          let ranking = value.assetTypes(utxo.output().amount());
          // Update the best UTXO and its ranking if it's a better candidate.
          if (ranking < rank) {
            rank = ranking;
            best = utxo;
          }
        }
      } else {
        throw new Error("prepareCollateral: could not resolve some input");
      }
    }
    // Throw an error if no suitable collateral UTXO is found.
    if (!best) {
      throw new Error("prepareCollateral: could not find enough collateral");
    }
    // Set the selected UTXO as collateral in the transaction body.
    let tis = CborSet.fromCore([], TransactionInput.fromCore);
    tis.setValues([best.input()]);
    this.body.setCollateral(tis);
    // Also set the collateral return to the output of the selected UTXO.
    this.body.setCollateralReturn(best.output());
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
    let collateral = this.body.collateral();
    if (!collateral || collateral.size() == 0) {
      return;
    }
    // Retrieve available UTXOs within scope.
    let scope = [...this.utxoScope.values()];
    // Calculate the total collateral based on the transaction fee and collateral percentage.
    let totalCollateral = BigInt(
      Math.ceil(this.params.collateralPercentage * Number(this.fee)),
    );
    // Calculate the collateral value by summing up the amounts from collateral inputs.
    let collateralValue = this.body
      .collateral()!
      .values()
      .reduce((acc, input) => {
        let utxo = scope.find((x) => x.input() == input);
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
    // Ensure a change address has been set before proceeding.
    if (!this.changeAddress) {
      throw new Error(
        "Cannot complete transaction without setting change address",
      );
    }
    // Gather all inputs from the transaction body.
    let inputs = [...this.body.inputs().values()];
    // Perform initial checks and preparations for coin selection.
    let excessValue = this.getPitch(true);
    let spareInputs: TransactionUnspentOutput[] = [];
    for (const [utxo] of this.utxos.entries()) {
      if (!inputs.includes(utxo.input())) {
        spareInputs.push(utxo);
      }
    }
    // Perform coin selection to cover any negative excess value.
    const selectionResult = micahsSelector(
      spareInputs,
      value.negate(value.negatives(excessValue)),
    );
    // Update the excess value and spare inputs based on the selection result.
    excessValue = value.merge(excessValue, selectionResult.selectedValue);
    spareInputs = selectionResult.inputs;
    // Add selected inputs to the transaction.
    for (const input of selectionResult.selectedInputs) {
      this.addInput(input);
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

    // Balance the change output with the updated excess value.
    this.balanceChange(excessValue);
    // Ensure a change output index has been set after balancing.
    if (!this.changeOutputIndex) {
      throw new Error(
        "Unreachable! Somehow change balancing succeeded but still failed.",
      );
    }
    // Build the transaction witness set for fee estimation and script validation.
    //excessValue = this.getPitch(false)
    let tw = this.buildTransactionWitnessSet();
    // Calculate and set the script data hash if necessary.
    {
      let scriptDataHash = this.getScriptDataHash(tw);
      if (scriptDataHash) {
        this.body.setScriptDataHash(scriptDataHash);
      }
    }
    this.balanceChange(excessValue);
    // Create a draft transaction for fee calculation.
    let draft_tx = new Transaction(this.body, tw);
    // Calculate and set the transaction fee.
    let draft_size = draft_tx.toCbor().length / 2;
    this.calculateFees(draft_tx);
    excessValue = value.merge(excessValue, new Value(-this.fee));
    this.balanceChange(excessValue);
    if (this.redeemers.size() > 0) {
      this.prepareCollateral();
      let evaluationFee = await this.evaluate(draft_tx);
      this.fee += evaluationFee;
      excessValue = value.merge(excessValue, new Value(-evaluationFee));
      tw.setRedeemers(this.redeemers);
    }
    {
      const scriptDataHash = this.getScriptDataHash(tw);
      if (scriptDataHash) {
        this.body.setScriptDataHash(scriptDataHash);
      }
    }
    this.body.setFee(this.fee);
    if (this.body.collateral()) {
      // Merge the fee with the excess value and rebalance the change.
      this.balanceCollateralChange();
    }
    let final_size = draft_tx.toCbor().length / 2;
    this.fee += BigInt(
      Math.ceil((final_size - draft_size) * this.params.minFeeCoefficient),
    );
    excessValue = this.getPitch(false);
    this.body.setFee(this.fee);
    this.balanceChange(excessValue);
    if (this.body.collateral()) {
      this.balanceCollateralChange();
    }
    // Return the fully constructed transaction.
    tw.setVkeys(CborSet.fromCore([], VkeyWitness.fromCore));
    return new Transaction(this.body, tw);
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
        let redeemers = [...this.redeemers.values()];
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

  // Adds a certificate to register a staker
  addRegisterStake() {}

  // Adds a certificate to deregister a staker
  addDeregisterStake() {}

  // Adds a certificate to register a pool
  addRegisterPool() {}

  // Adds a certificate to retire a pool
  addRetirePool() {}

  /**
   * Specifies the exact time when the transaction becomes valid
   *
   * @param {Slot} validFrom - The slot from which the transaction becomes valid
   * @throws {Error} If the validity start interval is already set
   */
  setValidFrom(validFrom: Slot) {
    if (this.body.validityStartInterval() !== undefined) {
      throw new Error(
        "TxBuilder setValidFrom: Validity start interval is already set",
      );
    }
    this.body.setValidityStartInterval(validFrom);
  }

  /**
   * Specifies the exact time when the transaction expires
   *
   * @param {Slot} validUntil - The slot until which the transaction is valid
   * @throws {Error} If the time to live is already set
   */
  setValidUntil(validUntil: Slot) {
    if (this.body.ttl() !== undefined) {
      throw new Error("TxBuilder setValidUntil: Time to live is already set");
    }
    this.body.setTtl(validUntil);
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
  addWithdrawal(address: RewardAccount, amount: bigint, redeemer?: PlutusData) {
    // Retrieve existing withdrawals or initialize a new map if none exist.
    const withdrawals: Map<RewardAccount, bigint> =
      this.body.withdrawals() ?? new Map();
    // Set the withdrawal amount for the specified address.
    withdrawals.set(address, amount);
    // Update the transaction body with the new or updated withdrawals map.
    this.body.setWithdrawals(withdrawals);
    // If a redeemer is provided, process it for script validation.
    if (redeemer) {
      let redeemers = [...this.redeemers.values()];
      // Add the redeemer to the list of redeemers with execution units based on transaction parameters.
      redeemers.push(
        Redeemer.fromCore({
          index: 256, // TODO: Determine the correct index for the redeemer.
          purpose: RedeemerPurpose["mint"], // TODO: Confirm the purpose of the redeemer.
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
      let key = Address.fromBech32(address).getProps().delegationPart;
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
  addRequiredSigner(signer: Ed25519KeyHashHex) {
    // Retrieve existing required signers or initialize a new CBOR set if none exist.
    let signers: CborSet<
      Ed25519KeyHashHex,
      Hash<Ed25519KeyHashHex>
    > = this.body.requiredSigners() ?? CborSet.fromCore([], Hash.fromCore);
    // Convert the signer to a hash and add it to the set of required signers.
    let values = [...signers.values()];
    values.push(Hash.fromCore(signer));
    signers.setValues(values);
    // Update the transaction body with the new set of required signers.
    this.body.setRequiredSigners(signers);
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
  provideScript(script: Script) {
    this.scriptScope.add(script);
    return this;
  }
}

/**
 * Asserts that the given address is a valid payment address.
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is a script hash.
 */
function assertPaymentsAddress(address: Address) {
  let props = address.getProps();
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
  let props = address.getProps();
  if (!props.paymentPart) {
    throw new Error("assertLockAddress: address has no payment part!");
  }
  if (props.paymentPart.type != CredentialType.ScriptHash) {
    throw new Error(
      "assertLockAddress: address payment credential must be a script hash!",
    );
  }
}
