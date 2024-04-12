import {
  CborSet,
  TransactionInput,
  TransactionBody,
  TransactionInputSet,
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
} from './types'
import { HexBlob } from '@cardano-sdk/util'
import * as value from './value'
import { micahsSelector } from './coinSelection'
import * as utils from './utils'
import { costModels, costModelsBytes } from './costModels'
import * as Crypto from '@cardano-sdk/crypto'
import * as U from 'uplc-node'

/*
methods we want to implement somewhere in new translucent (from haskell codebase):

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

wallet:
    ownUtxos
    ownAddress
    ownAddresses
    ownPaymentPubKeyHashes
    ownFirstPaymentPubKeyHash

constraints:
    mustValidateIn
    mustValidateInTimeRange
    mustBeSignedBy
    mustPayTo****
    mustMintValue
    mustMintCurrency
    mustSpendAtLeast
    mustProduceAtLeast
*/

export const TxParams = {
  minFeeA: 44n,
  minFeeB: 155381n,
  poolDeposit: 500000000n,
  keyDeposit: 2000000n,
  maxValueSize: 5000n,
  maxTxSize: 16384n,
  maxTxExMem: 14000000n,
  maxTxExSteps: 10000000000n,
  coinsPerUtxoByte: 4310n,
  priceMem: 577 / 10000,
  priceStep: 721 / 10_000_000,
  //ex_unit_prices: ExUnitPrices,
  //costMdls: Costmdls,
  collateralPercentage: 1.50,
  maxCollateralInputs: 3,
}

const SLOT_CONFIG_NETWORK = {
  Mainnet: { zeroTime: 1596059091000, zeroSlot: 4492800, slotLength: 1000 }, // Starting at Shelley era
  Preview: { zeroTime: 1666656000000, zeroSlot: 0, slotLength: 1000 }, // Starting at Shelley era
  Preprod: {
    zeroTime: 1654041600000 + 1728000000,
    zeroSlot: 86400,
    slotLength: 1000,
  }, // Starting at Shelley era
  /** Customizable slot config (Initialized with 0 values). */
  Custom: { zeroTime: 0, zeroSlot: 0, slotLength: 0 },
}

const dummySignature = Ed25519SignatureHex('0'.repeat(128))

export class TxBuilder {
  body: TransactionBody
  inputs: TransactionInputSet = CborSet.fromCore([], TransactionInput.fromCore)
  private redeemers: Redeemers = Redeemers.fromCore([])
  private utxos: Set<TransactionUnspentOutput> = new Set<
    TransactionUnspentOutput
  >([])
  private utxoScope: Set<TransactionUnspentOutput> = new Set<
    TransactionUnspentOutput
  >([])
  private scriptScope: Set<Script> = new Set()
  private scriptSeen: Set<ScriptHash> = new Set()
  private changeAddress?: Address
  private changeOutputIndex?: number
  private plutusData: TransactionWitnessPlutusData = new Set()
  private requiredWitnesses: Set<Ed25519PublicKeyHex> = new Set()
  private requiredNativeScripts: Set<Hash28ByteBase16> = new Set()
  private requiredPlutusScripts: Set<Hash28ByteBase16> = new Set()
  private usedLanguages: Record<PlutusLanguageVersion, boolean> = {
    [0]: false,
    [1]: false,
    [2]: false,
  }
  private extraneousDatums: Set<PlutusData> = new Set()
  private fee: bigint = 0n
  private overEstimateSteps = 1.2
  private overEstimateMem = 1.05

  /**
   * Constructs a new instance of the TxBuilder class.
   * Initializes a new transaction body with an empty set of inputs, outputs, and no fee.
   */
  constructor() {
    this.body = new TransactionBody(this.inputs, [], 0n, undefined)
  }

  /**
   * Sets the change address for the transaction.
   * This address will receive any remaining funds not allocated to outputs or fees.
   *
   * @param {Address} address - The address to receive the change.
   */
  setChangeAddress(address: Address) {
    this.changeAddress = address
  }

  /**
   * Adds a reference input to the transaction. Reference inputs are used to refer to outputs from previous transactions
   * without spending them, allowing scripts to read their data. This can be useful for various contract logic, such as
   * checking the state of a datum without consuming the UTxO that holds it.
   *
   * @param {TransactionUnspentOutput} utxo - The unspent transaction output to add as a reference input.
   * @throws {Error} If the input to be added is already present in the list of reference inputs, to prevent duplicates.
   */
  addReferenceInput(utxo: TransactionUnspentOutput) {
    // Attempt to retrieve existing reference inputs from the transaction body, or initialize a new set if none exist.
    const referenceInputs =
      this.body.referenceInputs() ??
      CborSet.fromCore([], TransactionInput.fromCore)
    // Convert the set of reference inputs to an array for easier manipulation.
    const values = [...referenceInputs.values()]
    // Check if the input to be added already exists in the array of reference inputs.
    if (
      values.find(
        (val) =>
          val.index() == utxo.input().index() &&
          val.transactionId() == utxo.input().transactionId(),
      )
    ) {
      // If a duplicate is found, throw an error to prevent adding it.
      throw new Error('Cannot add duplicate reference input to the transaction')
    }
    // If no duplicate is found, add the input to the array of reference inputs.
    values.push(utxo.input())
    // Update the reference inputs in the transaction body with the new array.
    referenceInputs.setValues(values)
    // Add the UTxO to the scope of UTxOs considered by the transaction.
    this.utxoScope.add(utxo)
    // If the UTxO has an associated script reference, add it to the script scope and mark the script as seen.
    let scriptRef = utxo.output().scriptRef()
    if (scriptRef) {
      this.scriptScope.add(scriptRef)
      this.scriptSeen.add(scriptRef.hash())
    }
    // Update the transaction body with the new set of reference inputs.
    this.body.setReferenceInputs(referenceInputs)
  }
  /**
   * Adds an input to the transaction. This method is responsible for including a new input, which represents
   * a reference to an unspent transaction output (UTxO) that will be consumed by the transaction. Optionally,
   * a redeemer and an unhashed datum can be provided for script validation purposes.
   *
   * @param {TransactionUnspentOutput} utxo - The UTxO to be consumed as an input.
   * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation, required for spending Plutus script-locked UTxOs.
   * @param {PlutusData} [unhashDatum] - Optional. The unhashed datum, required if the UTxO being spent includes a datum hash instead of inline datum.
   * @throws {Error} If attempting to add a duplicate input, if the UTxO payment key is missing, if attempting to spend with a redeemer for a KeyHash credential,
   *                 if attempting to spend without a datum when required, or if providing both an inline datum and an unhashed datum.
   */
  addInput(
    utxo: TransactionUnspentOutput,
    redeemer?: PlutusData,
    unhashDatum?: PlutusData,
  ) {
    // Retrieve the current inputs from the transaction body for manipulation.
    const inputs = this.body.inputs()
    const values = [...inputs.values()]
    // Check for and prevent the addition of duplicate inputs.
    if (
      values.find(
        (val) =>
          val.index() == utxo.input().index() &&
          val.transactionId() == utxo.input().transactionId(),
      )
    ) {
      throw new Error('Cannot add duplicate reference input to the transaction')
    }
    // Add the new input to the array of inputs and update the transaction body.
    const inputIndex = values.push(utxo.input())
    inputs.setValues(values)
    this.utxoScope.add(utxo)
    this.body.setInputs(inputs)
    // Process the redeemer and datum logic for Plutus script-locked UTxOs.
    let key = utxo.output().address().getProps().paymentPart
    if (!key) {
      throw new Error('addInput: Somehow the UTxO payment key is missing!')
    }
    if (redeemer) {
      if (key.type == CredentialType.KeyHash) {
        throw new Error(
          'addInput: Cannot spend with redeemer for KeyHash credential!',
        )
      }
      this.requiredPlutusScripts.add(key.hash)
      let datum = utxo.output().datum()
      if (!datum) {
        throw new Error(
          'addInput: Cannot spend with redeemer when datum is missing!',
        )
      }
      if (datum?.asInlineData() && unhashDatum) {
        throw new Error(
          'addInput: Cannot have inline datum and also provided datum (3rd arg).',
        )
      }
      if (datum?.asDataHash()) {
        if (!unhashDatum) {
          throw new Error(
            'addInput: When spending datum hash, must provide datum (3rd arg).',
          )
        }
        this.plutusData.add(unhashDatum!)
      }
      // Prepare and add the redeemer to the transaction, including execution units estimation.
      let redeemers = [...this.redeemers.values()]
      redeemers.push(
        Redeemer.fromCore({
          index: inputIndex,
          purpose: RedeemerPurpose['spend'],
          data: redeemer.toCore(),
          executionUnits: {
            memory: Number(TxParams.maxTxExMem),
            steps: Number(TxParams.maxTxExSteps),
          },
        }),
      )
      this.redeemers.setValues(redeemers)
    } else {
      // Handle the required scripts or witnesses for non-Plutus script-locked UTxOs.
      if (key.type == CredentialType.ScriptHash) {
        this.requiredNativeScripts.add(key.hash)
      } else {
        this.requiredWitnesses.add(utils.HashAsPubKeyHex(key.hash))
      }
    }
  }

  /**
   * Adds an unspent transaction output (UTxO) to the set of UTxOs available for this transaction.
   * This UTxO can then be used for balancing the transaction, ensuring that inputs and outputs are equal.
   *
   * @param {TransactionUnspentOutput} utxo - The unspent transaction output to add.
   */
  addUnspentOutput(utxo: TransactionUnspentOutput) {
    this.utxos.add(utxo)
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
    const mint: TokenMap = this.body.mint() ?? new Map()
    // Iterate over the assets map and add each asset to the mint map under the specified policy.
    for (const [key, amount] of assets.entries()) {
      mint.set(AssetId.fromParts(policy, key), amount)
    }
    // Update the transaction body with the modified mint map.
    this.body.setMint(mint)

    // If a redeemer is provided, handle Plutus script requirements.
    if (redeemer) {
      // Add the policy ID hash to the set of required Plutus scripts.
      this.requiredPlutusScripts.add(utils.PolicyIdToHash(policy))
      // Retrieve the current list of redeemers and prepare to add a new one.
      let redeemers = [...this.redeemers.values()]
      // Create and add a new redeemer for the minting action, specifying execution units.
      // Note: Execution units are placeholders and should be replaced with actual values.
      console.log(' adding mint reeemer')
      redeemers.push(
        Redeemer.fromCore({
          index: 0, // The index for minting actions is typically 0, but may need adjustment based on the transaction structure.
          purpose: RedeemerPurpose['mint'], // Specify the purpose of the redeemer as minting.
          data: redeemer.toCore(), // Convert the provided PlutusData redeemer to its core representation.
          executionUnits: {
            memory: Number(TxParams.maxTxExMem), // Placeholder memory units, replace with actual estimation.
            steps: Number(TxParams.maxTxExSteps), // Placeholder step units, replace with actual estimation.
          },
        }),
      )
      // Update the transaction's redeemers with the new list.
      this.redeemers.setValues(redeemers)
    } else {
      // If no redeemer is provided, assume minting under a native script and add the policy ID hash to the required native scripts.
      this.requiredNativeScripts.add(utils.PolicyIdToHash(policy))
    }
  }
  /**
   * Adds a transaction output to the current transaction body. This method also ensures that the minimum ada
   * requirements are met for the output. After adding the output, it updates the transaction body's outputs.
   *
   * @param {TransactionOutput} output - The transaction output to be added.
   * @returns {number} The index of the newly added output within the transaction body's outputs array.
   */
  addOutput(output: TransactionOutput) {
    // Retrieve the current list of outputs from the transaction body.
    const outputs = this.body.outputs()
    // Add the new output to the list and update the transaction body's outputs.
    const index = outputs.push(output) - 1
    this.body.setOutputs(outputs)
    // Return the index at which the new output was added.
    return index
  }
  /**
   * Adds a Plutus datum to the transaction. This datum is not directly associated with any particular output but may be used
   * by scripts during transaction validation. This method is useful for including additional information that scripts may
   * need to validate the transaction without requiring it to be attached to a specific output.
   *
   * @param {PlutusData} datum - The Plutus datum to be added to the transaction.
   */
  provideDatum(datum: PlutusData) {
    this.extraneousDatums.add(datum)
  }

  // Balances inputs and outputs, selecting from added unspent outputs
  // Also selects a collateral input if none are selected
  // Fails if cannot be balanced or collateral cannot cover runtime
  balance() {}

  // Evaluate scripts and return exunits
  evaluate(draft_tx: Transaction) {
    let allUtxos: TransactionUnspentOutput[] = []
    for (const utxo of this.utxoScope.values()) {
      allUtxos.push(utxo)
    }
    const uplcResults = U.eval_phase_two_raw(
      utils.fromHex(draft_tx.toCbor()),
      allUtxos.map((x) => utils.fromHex(x.input().toCbor())),
      allUtxos.map((x) => utils.fromHex(x.output().toCbor())),
      utils.fromHex(costModelsBytes),
      BigInt(
        Math.floor(
          Number(TxParams.maxTxExSteps) / (this.overEstimateSteps ?? 1),
        ),
      ),
      BigInt(
        Math.floor(Number(TxParams.maxTxExMem) / (this.overEstimateMem ?? 1)),
      ),
      BigInt(SLOT_CONFIG_NETWORK.Mainnet.zeroTime),
      BigInt(SLOT_CONFIG_NETWORK.Mainnet.zeroSlot),
      SLOT_CONFIG_NETWORK.Mainnet.slotLength,
    )
    let fee = 0
    let redeemerValues: Redeemer[] = []
    for (const redeemerBytes of uplcResults) {
      let redeemer = Redeemer.fromCbor(HexBlob(utils.toHex(redeemerBytes)))
      let exUnits = redeemer.exUnits()
      exUnits.setSteps(
        BigInt(Math.round(Number(exUnits.steps()) * this.overEstimateSteps)),
      )
      exUnits.setMem(
        BigInt(Math.round(Number(exUnits.mem()) * this.overEstimateMem)),
      )
      redeemer.setExUnits(exUnits)
      redeemerValues.push(redeemer)
      fee += TxParams.priceStep * Number(exUnits.steps())
      fee += TxParams.priceMem * Number(exUnits.mem())
    }
    let redeemers: Redeemers = Redeemers.fromCore([])
    redeemers.setValues(redeemerValues)
    this.redeemers = redeemers
    return BigInt(Math.ceil(fee))
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
    let tw = new TransactionWitnessSet()
    // Script lookup table to map script hashes to script objects
    let scriptLookup: Record<ScriptHash, Script> = {}
    for (const script of this.scriptScope) {
      scriptLookup[script.hash()] = script
    }
    // Arrays to hold scripts of different types
    let sn: NativeScript[] = []
    let s1: PlutusV1Script[] = []
    let s2: PlutusV2Script[] = []
    let s3: PlutusV3Script[] = []
    // Populate script arrays based on required script hashes
    for (const requiredScriptHash of this.requiredPlutusScripts) {
      if (!this.scriptSeen.has(requiredScriptHash)) {
        let script = scriptLookup[requiredScriptHash]
        if (!script) {
          throw new Error(
            `complete: Could not resolve script hash ${requiredScriptHash}`,
          )
        } else {
          if (script.asNative() != undefined) {
            sn.push(script.asNative()!)
          }
          if (script.asPlutusV1() != undefined) {
            s1.push(script.asPlutusV1()!)
          }
          if (script.asPlutusV2() != undefined) {
            s2.push(script.asPlutusV2()!)
          }
          if (script.asPlutusV3() != undefined) {
            s3.push(script.asPlutusV3()!)
          }
        }
      }
      // Mark the script language versions used in the transaction
      let lang = scriptLookup[requiredScriptHash].language()
      if (lang == 1) {
        this.usedLanguages[PlutusLanguageVersion.V1] = true
      } else if (lang == 2) {
        this.usedLanguages[PlutusLanguageVersion.V2] = true
      } else if (lang == 3) {
        this.usedLanguages[PlutusLanguageVersion.V3] = true
      }
    }
    // Add scripts to the transaction witness set
    if (sn.length != 0) {
      let cborSet = CborSet.fromCore([], NativeScript.fromCore)
      cborSet.setValues(sn)
      tw.setNativeScripts(cborSet)
    }
    if (s1.length != 0) {
      let cborSet = CborSet.fromCore([], PlutusV1Script.fromCore)
      cborSet.setValues(s1)
      tw.setPlutusV1Scripts(cborSet)
    }
    if (s2.length != 0) {
      let cborSet = CborSet.fromCore([], PlutusV2Script.fromCore)
      cborSet.setValues(s2)
      tw.setPlutusV2Scripts(cborSet)
    }
    if (s3.length != 0) {
      let cborSet = CborSet.fromCore([], PlutusV3Script.fromCore)
      cborSet.setValues(s3)
      tw.setPlutusV3Scripts(cborSet)
    }
    // Process vkey witnesses
    let vkeyWitnesses = CborSet.fromCore([], VkeyWitness.fromCore)
    let requiredWitnesses: VkeyWitness[] = []
    for (const val of this.requiredWitnesses.values()) {
      requiredWitnesses.push(VkeyWitness.fromCore([val, dummySignature]))
    }
    vkeyWitnesses.setValues(requiredWitnesses)
    console.log('VKEY', vkeyWitnesses.toCore())
    tw.setRedeemers(this.redeemers)
    // Process Plutus data
    let plutusData = CborSet.fromCore([], PlutusData.fromCore)
    let plutusDataList: PlutusData[] = []
    for (const p of this.plutusData.values()) {
      plutusDataList.push(p)
    }
    for (const p of this.extraneousDatums.values()) {
      plutusDataList.push(p)
    }
    plutusData.setValues(plutusDataList)
    tw.setPlutusData(plutusData)
    return tw
  }

  /**
   * Calculates the net value difference between the inputs and outputs of a transaction,
   * including minted values and subtracting a fixed fee amount.
   * This function is used to determine the excess value that needs to be returned as change.
   *
   * @returns {Value} The net value that represents the transaction's pitch.
   * @throws {Error} If a corresponding UTxO for an input cannot be found.
   */
  private getPitch() {
    // Initialize values for input, output, and minted amounts.
    let inputValue = new Value(0n)
    let outputValue = new Value(0n)
    let mintValue = new Value(0n, this.body.mint())

    // Aggregate the total input value from all inputs.
    for (const input of this.body.inputs().values()) {
      let utxo: TransactionUnspentOutput | undefined
      // Find the matching UTxO for the input.
      for (const iterUtxo of this.utxoScope.values()) {
        if (iterUtxo.input().toCbor() == input.toCbor()) {
          utxo = iterUtxo
        }
      }
      // Throw an error if a matching UTxO cannot be found.
      if (!utxo) {
        throw new Error('Unreachable! UTxO missing!')
      }
      // Merge the UTxO's output amount into the total input value.
      inputValue = value.merge(inputValue, utxo.output().amount())
    }

    // Aggregate the total output value from all outputs.
    for (const output of this.body.outputs().values()) {
      outputValue = value.merge(outputValue, output.amount())
    }

    // Calculate the net value by merging input, output (negated), and mint values.
    // Subtract a fixed fee amount (5 ADA) to ensure enough is allocated for transaction fees.
    return value.merge(
      value.merge(
        value.merge(inputValue, value.negate(outputValue)),
        mintValue,
      ),
      new Value(-5000000n), // Subtract 5 ADA from the excess.
    )
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
    let redeemers = [...this.redeemers.values()]
    let datums = tw.plutusData()?.values().slice() || []
    // Proceed only if there are datums or redeemers to process.
    if (datums.length > 0 || redeemers.length > 0) {
      // Initialize a container for used cost models.
      let usedCostModels = new Costmdls()
      // Debug log for development purposes.
      console.log(this.usedLanguages, costModels)
      // Populate the used cost models based on the languages used in the transaction.
      for (let i = 0; i <= Object.keys(this.usedLanguages).length; i++) {
        if (i == 0) {
          // Retrieve the cost model for the current language version.
          let cm = costModels.get(i)
          // Throw an error if the cost model is missing.
          if (cm == undefined) {
            throw new Error(
              `complete: Could not find cost model for Plutus Language Version ${i}`,
            )
          }
          // Insert the cost model into the used cost models container.
          usedCostModels.insert(new CostModel(i, cm))
        }
      }
      // Debug log for development purposes.
      console.log(usedCostModels)
      // Initialize a CBOR writer to encode the script data.
      const writer = new CborWriter()
      // Encode redeemers and datums into CBOR format.
      writer.writeEncodedValue(utils.getCborEncodedArray(redeemers))
      if (datums && datums.length > 0)
        writer.writeEncodedValue(utils.getCborEncodedArray(datums))
      // Encode the used cost models into CBOR format.
      writer.writeEncodedValue(
        Buffer.from(usedCostModels.languageViewsEncoding(), 'hex'),
      )
      // Generate and return the script data hash.
      return Hash32ByteBase16.fromHexBlob(
        HexBlob.fromBytes(
          Crypto.blake2b(Crypto.blake2b.BYTES).update(writer.encode()).digest(),
        ),
      )
    }
    // Return undefined if there are no datums or redeemers.
    return undefined
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
    let tokenMap = excessValue.multiasset()
    // If the multiasset map exists, iterate over its keys.
    if (tokenMap) {
      for (const key of tokenMap.keys()) {
        // Delete any tokens with a zero value to clean up the multiasset map.
        if (tokenMap.get(key) == 0n) {
          tokenMap.delete(key)
        }
      }
      // Update the excess value with the cleaned-up multiasset map.
      excessValue.setMultiasset(tokenMap)
    }
    // Create a new transaction output with the change address and the adjusted excess value.
    let output = new TransactionOutput(this.changeAddress!, excessValue)
    // If there is no existing change output index, add the new output to the transaction
    // and store its index. Otherwise, update the existing change output with the new output.
    if (!this.changeOutputIndex) {
      this.changeOutputIndex = this.addOutput(output)
    } else {
      let outputs = this.body.outputs()
      outputs[this.changeOutputIndex] = output
      this.body.setOutputs(outputs)
    }
  }

  private calculateFees(draft_tx: Transaction, tw: TransactionWitnessSet) {
    this.fee =
      TxParams.minFeeB + BigInt(draft_tx.toCbor().length / 2) * TxParams.minFeeA
    this.body.setFee(this.fee)
  }

  private prepareCollateral() {
    let inputs = [...this.body.inputs().values()]
    let scope = [...this.utxoScope.values()]
    let [best, rank]: [TransactionUnspentOutput | undefined, number] = [
      undefined,
      99,
    ]
    for (const input of inputs) {
      let utxo = scope.find((x) => x.input() == input)
      if (utxo) {
        if (utxo.output().amount().coin() >= 10n * 10n ** 6n) {
          let ranking = value.assetTypes(utxo.output().amount())
          if (ranking < rank) {
            rank = ranking
            best = utxo
          }
        }
      } else {
        throw new Error('prepareCollateral: could not resolve some input')
      }
    }
    if (!best) {
      throw new Error('prepareCollateral: could not find enough collateral')
    }
    let tis = CborSet.fromCore([], TransactionInput.fromCore)
    tis.setValues([best.input()])
    this.body.setCollateral(tis)
    this.body.setCollateralReturn(best.output())
  }

  private balanceCollateralChange() {
    if (!this.changeAddress) {
      throw new Error('balanceCollateralChange: change address not set')
    }
    let scope = [...this.utxoScope.values()]
    let totalCollateral = BigInt(Math.ceil(TxParams.collateralPercentage * Number(this.fee)))
    let collateralValue = this.body
      .collateral()!
      .values()
      .reduce((acc, input) => {
        let utxo = scope.find((x) => x.input() == input)
        if (!utxo) {
          throw new Error(
            'balanceCollateralChange: Could not resolve some collateral input',
          )
        }
        return value.merge(utxo.output().amount(), acc)
      }, value.zero)
    this.body.setCollateralReturn(
      new TransactionOutput(
        this.changeAddress,
        value.merge(
          collateralValue,
          new Value(-totalCollateral),
        ),
      ),
    )
    this.body.setTotalCollateral(totalCollateral)
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
   * @returns {Transaction} A new Transaction object with all components set and ready for submission.
   */
  complete(): Transaction {
    // Ensure a change address has been set before proceeding.
    if (!this.changeAddress) {
      throw new Error(
        'Cannot complete transaction without setting change address',
      )
    }
    // Gather all inputs from the transaction body.
    let inputs = [...this.body.inputs().values()]
    // Perform initial checks and preparations for coin selection.
    let excessValue = this.getPitch()
    let spareInputs: TransactionUnspentOutput[] = []
    for (const [utxo] of this.utxos.entries()) {
      if (!inputs.includes(utxo.input())) {
        spareInputs.push(utxo)
      }
    }
    // Perform coin selection to cover any negative excess value.
    const selectionResult = micahsSelector(
      spareInputs,
      value.negate(value.negatives(excessValue)),
    )
    // Update the excess value and spare inputs based on the selection result.
    excessValue = value.merge(excessValue, selectionResult.selectedValue)
    spareInputs = selectionResult.inputs
    // Add selected inputs to the transaction.
    for (const input of selectionResult.selectedInputs) {
      this.addInput(input)
    }
    // Ensure the coin selection has eliminated all negative values.
    if (!value.empty(value.negatives(excessValue))) {
      throw new Error(
        'Unreachable! Somehow coin selection succeeded but still failed.',
      )
    }

    // Balance the change output with the updated excess value.
    this.balanceChange(excessValue)
    // Ensure a change output index has been set after balancing.
    if (!this.changeOutputIndex) {
      throw new Error(
        'Unreachable! Somehow change balancing succeeded but still failed.',
      )
    }
    // Build the transaction witness set for fee estimation and script validation.
    let tw = this.buildTransactionWitnessSet()
    // Calculate and set the script data hash if necessary.
    {
      let scriptDataHash = this.getScriptDataHash(tw)
      if (scriptDataHash) {
        this.body.setScriptDataHash(scriptDataHash)
      }
    }
    // Create a draft transaction for fee calculation.
    let draft_tx = new Transaction(this.body, tw)
    // Log the draft transaction size for debugging.
    console.log('Draft length', draft_tx.toCbor().length / 2)
    // Calculate and set the transaction fee.
    this.calculateFees(draft_tx, tw)
    // console.log('tx length', this.body.toCbor().length / 2)
    this.body.setFee(this.fee)
    excessValue = value.merge(excessValue, new Value(-this.fee))
    this.balanceChange(excessValue)
    //
    //console.log(D.Transaction.from_bytes(utils.fromHex(draft_tx.toCbor())).to_json())
    this.prepareCollateral()
    let evaluationFee = this.evaluate(draft_tx)
    console.log('evaluated')
    this.fee += evaluationFee
    excessValue = value.merge(excessValue, new Value(-evaluationFee))
    this.balanceChange(excessValue)
    tw.setRedeemers(this.redeemers)
    {
      let scriptDataHash = this.getScriptDataHash(tw)
      if (scriptDataHash) {
        this.body.setScriptDataHash(scriptDataHash)
      }
    }
    this.body.setFee(this.fee)
    // Merge the fee with the excess value and rebalance the change.
    excessValue = value.merge(excessValue, new Value(-this.fee))
    this.balanceChange(excessValue)
    this.balanceCollateralChange()
    // Return the fully constructed transaction.
    return new Transaction(this.body, tw)
  }

  // Adds a certificate to delegate a staker to a pool
  addDelegation() {}

  // Adds a certificate to register a staker
  addRegisterStake() {}

  // Adds a certificate to deregister a staker
  addDeregisterStake() {}

  // Adds a certificate to register a pool
  addRegisterPool() {}

  // Adds a certificate to retire a pool
  addRetirePool() {}

  /**
   * Adds a withdrawal to the transaction. This method allows for the withdrawal of funds from a staking reward account.
   * Optionally, a redeemer can be provided for script validation purposes.
   *
   * @param {C.Cardano.RewardAccount} address - The reward account from which to withdraw.
   * @param {bigint} amount - The amount of ADA to withdraw.
   * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation.
   * @throws {Error} If the reward account does not have a stake credential or if any other error occurs.
   */
  addWithdrawal(address: RewardAccount, amount: bigint, redeemer?: PlutusData) {
    console.log('used withdrawal')
    // Retrieve existing withdrawals or initialize a new map if none exist.
    const withdrawals: Map<RewardAccount, bigint> =
      this.body.withdrawals() ?? new Map()
    // Set the withdrawal amount for the specified address.
    withdrawals.set(address, amount)
    // Update the transaction body with the new or updated withdrawals map.
    this.body.setWithdrawals(withdrawals)
    // If a redeemer is provided, process it for script validation.
    if (redeemer) {
      let redeemers = [...this.redeemers.values()]
      // Add the redeemer to the list of redeemers with execution units based on transaction parameters.
      redeemers.push(
        Redeemer.fromCore({
          index: 0, // TODO: Determine the correct index for the redeemer.
          purpose: RedeemerPurpose['mint'], // TODO: Confirm the purpose of the redeemer.
          data: redeemer.toCore(),
          executionUnits: {
            memory: Number(TxParams.maxTxExMem),
            steps: Number(TxParams.maxTxExSteps),
          },
        }),
      )
      // Update the transaction with the new list of redeemers.
      this.redeemers.setValues(redeemers)
    } else {
      // If no redeemer is provided, process the address for required scripts or witnesses.
      let key = Address.fromBech32(address).getProps().delegationPart
      if (!key) {
        throw new Error(
          'addWithdrawal: The RewardAccount provided does not have an associated stake credential.',
        )
      }
      // Add the required scripts or witnesses based on the type of the stake credential.
      if (key.type == CredentialType.ScriptHash) {
        this.requiredNativeScripts.add(key.hash)
      } else {
        this.requiredWitnesses.add(utils.HashAsPubKeyHex(key.hash))
      }
    }
  }

  /**
   * Adds a required signer to the transaction. This is necessary for transactions that must be explicitly signed by a particular key.
   *
   * @param {Ed25519KeyHashHex} signer - The hash of the Ed25519 public key that is required to sign the transaction.
   */
  addRequiredSigner(signer: Ed25519KeyHashHex) {
    console.log('adding required signer')
    // Retrieve existing required signers or initialize a new CBOR set if none exist.
    let signers: CborSet<Ed25519KeyHashHex, Hash<Ed25519KeyHashHex>> =
      this.body.requiredSigners() ?? CborSet.fromCore([], Hash.fromCore)
    // Convert the signer to a hash and add it to the set of required signers.
    let values = [...signers.values()]
    values.push(Hash.fromCore(signer))
    signers.setValues(values)
    // Update the transaction body with the new set of required signers.
    console.log(signers.toCbor())
    this.body.setRequiredSigners(signers)
  }

  /**
   * Adds a script to the transaction's script scope. If the script is already provided via a reference script,
   * it will not be explicitly used again. This method ensures that each script is only included once in the
   * transaction, either directly or by reference, to optimize the transaction size and processing.
   *
   * @param {Script} script - The script to be added to the transaction's script scope.
   */
  provideScript(script: Script) {
    this.scriptScope.add(script)
  }
}
