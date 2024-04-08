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
  VkeyWitness,
  Ed25519SignatureHex,
  PlutusLanguageVersion,
} from './types'
import { HexBlob } from "@cardano-sdk/util"
import * as C from '@cardano-sdk/core'
import * as D from '@dcspark/cardano-multiplatform-lib-nodejs'
import { fromHex, toHex } from '../utils/mod'
import * as value from './value'
import { micahsSelector } from './coinSelection'
import * as utils from './utils'
import { costModels } from './costModels'
import { computeScriptDataHash } from './computeScriptDataHash'

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
  priceMem: [577n, 10000n],
  priceStep: [721n, 10_000_000n],
  //ex_unit_prices: ExUnitPrices,
  //costMdls: Costmdls,
  collateralPercentage: 150,
  maxCollateralInputs: 3,
}

const dummySignature = Ed25519SignatureHex('0'.repeat(128))

export class Tx {
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
  private changeAddress?: C.Cardano.Address
  private changeOutputIndex?: number
  private plutusData: TransactionWitnessPlutusData = new Set()
  private requiredWitnesses: Set<Ed25519PublicKeyHex> = new Set()
  private requiredNativeScripts: Set<Hash28ByteBase16> = new Set()
  private requiredPlutusScripts: Set<Hash28ByteBase16> = new Set()
  private usedLanguages: Record<PlutusLanguageVersion, boolean> = {
    0: false,
    1: false,
    2: false,
  }
  private extraneousDatums: Set<PlutusData> = new Set()

  constructor() {
    this.body = new TransactionBody(this.inputs, [], 0n, undefined)
  }

  setChangeAddress(address: C.Cardano.Address) {
    this.changeAddress = address
  }

  // Add a reference input
  addReferenceInput(utxo: TransactionUnspentOutput) {
    const referenceInputs =
      this.body.referenceInputs() ??
      CborSet.fromCore([], TransactionInput.fromCore)
    const values = [...referenceInputs.values()]
    if (
      values.find(
        (val) =>
          val.index() == utxo.input().index() &&
          val.transactionId() == utxo.input().transactionId(),
      )
    ) {
      throw new Error('Cannot add duplicate reference input to the transaction')
    }
    values.push(utxo.input())
    referenceInputs.setValues(values)
    this.utxoScope.add(utxo)
    let scriptRef = utxo.output().scriptRef()
    if (scriptRef) {
      this.scriptScope.add(scriptRef)
      this.scriptSeen.add(scriptRef.hash())
    }
    this.body.setReferenceInputs(referenceInputs)
  }

  // Add an input
  addInput(
    utxo: TransactionUnspentOutput,
    redeemer?: PlutusData,
    unhashDatum?: PlutusData,
  ) {
    const inputs = this.body.inputs()
    const values = [...inputs.values()]
    if (
      values.find(
        (val) =>
          val.index() == utxo.input().index() &&
          val.transactionId() == utxo.input().transactionId(),
      )
    ) {
      throw new Error('Cannot add duplicate reference input to the transaction')
    }
    const inputIndex = values.push(utxo.input())
    inputs.setValues(values)
    this.utxoScope.add(utxo)
    this.body.setInputs(inputs)
    // todo: redeemer logic for plutus spend validators
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
      let redeemers = [...this.redeemers.values()]
      // todo: when complete runs, do evaluation, overwrite exunits
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
      if (key.type == CredentialType.ScriptHash) {
        this.requiredNativeScripts.add(key.hash)
      } else {
        this.requiredWitnesses.add(utils.HashAsPubKeyHex(key.hash))
      }
    }
  }

  // Add an input, to be available for balancing
  addUnspentOutput(utxo: TransactionUnspentOutput) {
    this.utxos.add(utxo)
  }

  // Mint a certain value
  addMint(
    policy: C.Cardano.PolicyId,
    assets: Map<C.Cardano.AssetName, bigint>,
    redeemer?: PlutusData,
  ) {
    const mint: C.Cardano.TokenMap = this.body.mint() ?? new Map()
    for (const [key, amount] of assets.entries()) {
      mint.set(C.Cardano.AssetId.fromParts(policy, key), amount)
    }
    this.body.setMint(mint)
    // todo: redeemer logic
    if (redeemer) {
      this.requiredPlutusScripts.add(utils.PolicyIdToHash(policy))
      let redeemers = [...this.redeemers.values()]
      // todo: when complete runs, do evaluation, overwrite exunits
      // todo: mint index?
      redeemers.push(
        Redeemer.fromCore({
          index: 0,
          purpose: RedeemerPurpose['mint'],
          data: redeemer.toCore(),
          executionUnits: {
            memory: 578516,//Number(TxParams.maxTxExMem),
            steps: 256352969//Number(TxParams.maxTxExSteps),
          },
        }),
      )
      this.redeemers.setValues(redeemers)
    } else {
      // if there is no redeemer, mint must be a native script
      this.requiredNativeScripts.add(utils.PolicyIdToHash(policy))
    }
  }

  // Add an output, checking minimum ada
  addOutput(output: TransactionOutput) {
    const outputs = this.body.outputs()
    const index = outputs.push(output) - 1
    this.body.setOutputs(outputs)
    return index
  }

  // Add datum (of a datum hash output)
  provideDatum(datum: PlutusData){
    this.extraneousDatums.add(datum)
  }

  // Balances inputs and outputs, selecting from added unspent outputs
  // Also selects a collateral input if none are selected
  // Fails if cannot be balanced or collateral cannot cover runtime
  balance() {}

  // Evaluate scripts and return exunits
  evaluate() {
    return {
        "mem": "578516",
        "steps": "256352969"
    }
  }

  // Checks balancing, evaluates completeness & exunits, sets exunits, exports CBOR
  complete() {
    if (!this.changeAddress) {
      throw new Error(
        'Cannot complete transaction without setting change address',
      )
    }
    // assert that inputs == outputs + fee
    // check that no scripts are unevaluated

    let inputValue = new Value(0n)
    let inputs = [...this.body.inputs().values()]
    for (const input of inputs) {
      let utxo: C.Serialization.TransactionUnspentOutput | undefined
      for (const iterUtxo of this.utxoScope.values()) {
        if (iterUtxo.input().toCbor() == input.toCbor()) {
          utxo = iterUtxo
        }
      }
      if (!utxo) {
        throw new Error('Unreachable! UTxO missing!')
      }
      inputValue = value.merge(inputValue, utxo.output().amount())
    }
    let outputValue = new Value(0n)
    let outputs = [...this.body.outputs().values()]
    for (const output of outputs) {
      outputValue = value.merge(outputValue, output.amount())
    }
    let mintValue = new Value(0n, this.body.mint())
    // subtract 5 ada from the excess so it adds enough for fees!
    let excessValue = value.merge(
      value.merge(value.merge(inputValue, value.negate(outputValue)), mintValue),
      new Value(-5000000n),
    )
    let spareInputs: TransactionUnspentOutput[] = []
    for (const [utxo] of this.utxos.entries()) {
      if (!inputs.includes(utxo.input())) {
        spareInputs.push(utxo)
      }
    }
    const selectionResult = micahsSelector(
      spareInputs,
      value.negate(value.negatives(excessValue)),
    )
    excessValue = value.merge(excessValue, selectionResult.selectedValue)
    spareInputs = selectionResult.inputs
    for (const input of selectionResult.selectedInputs) {
      this.addInput(input)
    }
    if (!value.empty(value.negatives(excessValue))) {
      throw new Error(
        'Unreachable! Somehow coin selection succeeded but still failed.',
      )
    }

    // todo: split change better (and over multiple change outputs if necessary)
    // first check inputs >= output
    // then calculate change output
    if (!this.changeOutputIndex) {
        let tokenMap = excessValue.multiasset()
        if (tokenMap){
            for (const key of tokenMap.keys()){
                if (tokenMap.get(key)==0n){
                    tokenMap.delete(key)
                }
            }
            excessValue.setMultiasset(tokenMap)
        }
      this.changeOutputIndex = this.addOutput(
        new C.Serialization.TransactionOutput(this.changeAddress!, excessValue),
      )
    }
    const changeOutput = this.body.outputs()[this.changeOutputIndex]
    // build up a bare transaction (witnesses) for fee estimation
    let tw = new C.Serialization.TransactionWitnessSet()
    //let tad = new C.Serialization.AuxiliaryData()
    {
      // Vkeys
      let scriptLookup: Record<ScriptHash, Script> = {}
      for (const script of this.scriptScope) {
        scriptLookup[script.hash()] = script
      }
      let sn: C.Serialization.NativeScript[] = []
      let s1: C.Serialization.PlutusV1Script[] = []
      let s2: C.Serialization.PlutusV2Script[] = []
      let s3: C.Serialization.PlutusV3Script[] = []
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
        let lang = scriptLookup[requiredScriptHash].language()
        if (lang == 1) {
          this.usedLanguages[PlutusLanguageVersion.V1] = true
        } else if (lang == 2) {
          this.usedLanguages[PlutusLanguageVersion.V2] = true
        } else if (lang == 3) {
          this.usedLanguages[PlutusLanguageVersion.V3] = true
        }
      }
      if (sn.length != 0) {
        let cborSet = CborSet.fromCore(
          [],
          C.Serialization.NativeScript.fromCore,
        )
        cborSet.setValues(sn)
        tw.setNativeScripts(cborSet)
        //tad.setNativeScripts(sn)
      }
      if (s1.length != 0) {
        let cborSet = CborSet.fromCore(
          [],
          C.Serialization.PlutusV1Script.fromCore,
        )
        cborSet.setValues(s1)
        tw.setPlutusV1Scripts(cborSet)
        //tad.setPlutusV1Scripts(s1)
      }
      if (s2.length != 0) {
        let cborSet = CborSet.fromCore(
          [],
          C.Serialization.PlutusV2Script.fromCore,
        )
        cborSet.setValues(s2)
        tw.setPlutusV2Scripts(cborSet)
        //tad.setPlutusV2Scripts(s2)
      }
      if (s3.length != 0) {
        let cborSet = CborSet.fromCore(
          [],
          C.Serialization.PlutusV3Script.fromCore,
        )
        cborSet.setValues(s3)
        tw.setPlutusV3Scripts(cborSet)
        //tad.setPlutusV3Scripts(s3)
      }
      let vkeyWitnesses = CborSet.fromCore(
        [],
        C.Serialization.VkeyWitness.fromCore,
      )
      let requiredWitnesses: C.Serialization.VkeyWitness[] = []
      for (const val of this.requiredWitnesses.values()) {
        requiredWitnesses.push(
          C.Serialization.VkeyWitness.fromCore([val, dummySignature]),
        )
      }
      vkeyWitnesses.setValues(requiredWitnesses)
      console.log("VKEY", vkeyWitnesses.toCore())
      //tw.setVkeys(vkeyWitnesses)
      tw.setRedeemers(this.redeemers)
      let plutusData = CborSet.fromCore([], C.Serialization.PlutusData.fromCore)
      let plutusDataList = []
      for (const p of this.plutusData.values()) {
        plutusDataList.push(p)
      }
      for (const p of this.extraneousDatums.values()) {
        plutusDataList.push(p)
      }
      plutusData.setValues(plutusDataList)
      tw.setPlutusData(plutusData)
    }
    // do necessary script data hash calculations
    let scriptDataHash: Hash32ByteBase16 | undefined
    {
      let redeemers = this.redeemers.values().map((x) => x.toCore())
      let datums: C.Serialization.PlutusData[]
      if (tw.plutusData()) {
        datums = [...tw.plutusData()!.values()]
      } else {
        datums = []
      }
      let usedLanguages: PlutusLanguageVersion[] = [0]
    //   for (const lang of (Object.keys(
    //     this.usedLanguages,
    //   ) as unknown[]) as PlutusLanguageVersion[]) {
    //     if (this.usedLanguages[lang]) {
    //       usedLanguages.push(lang)
    //     }
    //   }
      scriptDataHash = computeScriptDataHash(
        costModels,
        usedLanguages,
        redeemers.length > 0 ? redeemers : undefined,
        datums.length > 0 ? datums.map((x) => x.toCore()) : undefined,
      )
      console.log("SDH", scriptDataHash)
    }
    if (scriptDataHash) {
      this.body.setScriptDataHash(scriptDataHash)
    }
    let draft_tx = new C.Serialization.Transaction(this.body, tw)//, tad)
    // calculate fee with change output
    //this.body.toCbor().length / 2
    // 3954.0
    console.log("Draft length", draft_tx.toCbor().length / 2)
    let fee =
      (TxParams.minFeeB +
      BigInt(draft_tx.toCbor().length / 2) * TxParams.minFeeA)
    {
        let redeemers = tw.redeemers()
        if (redeemers){
            for (const redeemer of redeemers.values()){
                let mem = redeemer.exUnits().mem()
                let steps = redeemer.exUnits().steps()
                let localFee = 0n
                localFee += (mem * TxParams.priceMem[0]) / TxParams.priceMem[1]
                localFee += (steps * TxParams.priceStep[0]) / TxParams.priceStep[1]
                console.log(`added fees (${localFee})`)
                fee += localFee
            }
        }
    }
    console.log("tx length", this.body.toCbor().length / 2)
    this.body.setFee(fee)
    outputs[this.changeOutputIndex] = new C.Serialization.TransactionOutput(
      changeOutput.address(),
      value.merge(changeOutput.amount(), new Value(-fee)),
    )
    this.body.setOutputs(outputs)
    let tx = new C.Serialization.Transaction(this.body, tw)//, tad)
    return tx
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

  // Add a withdrawal
  addWithdrawal(
    address: C.Cardano.RewardAccount,
    amount: bigint,
    redeemer?: PlutusData,
  ) {
    const withdrawals: Map<C.Cardano.RewardAccount, bigint> =
      this.body.withdrawals() ?? new Map()
    withdrawals.set(address, amount)
    this.body.setWithdrawals(withdrawals)
    if (redeemer) {
      let redeemers = [...this.redeemers.values()]
      // todo: when complete runs, do evaluation, overwrite exunits
      // todo: mint index?
      redeemers.push(
        Redeemer.fromCore({
          index: 0,
          purpose: RedeemerPurpose['mint'],
          data: redeemer.toCore(),
          executionUnits: {
            memory: Number(TxParams.maxTxExMem),
            steps: Number(TxParams.maxTxExSteps),
          },
        }),
      )
      this.redeemers.setValues(redeemers)
    } else {
      let key = C.Cardano.Address.fromBech32(address).getProps().delegationPart
      if (!key) {
        throw new Error(
          'addWithdrawal: Somehow the RewardAccount has no stake credential',
        )
      }
      if (key.type == CredentialType.ScriptHash) {
        this.requiredNativeScripts.add(key.hash)
      } else {
        this.requiredWitnesses.add(utils.HashAsPubKeyHex(key.hash))
      }
    }
  }

  // Add a required signer
  addRequiredSigner(signer: Ed25519KeyHashHex) {
    let signers: C.Serialization.CborSet<
      Ed25519KeyHashHex,
      C.Serialization.Hash<Ed25519KeyHashHex>
    > =
      this.body.requiredSigners() ??
      CborSet.fromCore([], C.Serialization.Hash.fromCore)
    let values = [...signers.values()]
    values.push(C.Serialization.Hash.fromCore(signer))
    signers.setValues(values)
    this.body.setRequiredSigners(signers)
  }

  // Add a script, not necessarily added because
  // if we detect that it's provided via reference script
  // then we'll omit it's explicit use
  provideScript(script: Script) {
    this.scriptScope.add(script)
  }
}
{
  let tx = new Tx()
  console.log('Before adding input', tx.body.toCbor())
  const tokenMap: C.Cardano.TokenMap = new Map()
  tokenMap.set(
    C.Cardano.AssetId.fromParts(
      C.Cardano.PolicyId(
        '016be5325fd988fea98ad422fcfd53e5352cacfced5c106a932a35a4',
      ),
      C.Cardano.AssetName('42544e'),
    ),
    500n * 100000n,
  )
  tx.addUnspentOutput(
    TransactionUnspentOutput.fromCore([
      {
        txId: C.Cardano.TransactionId.fromHexBlob(
          C.util.bytesToHex(
            fromHex(
              '04c3f3f44e296d7a0cf8e43ed962a06a94a89b9e01ac71dae68e4ddfa93cc319',
            ),
          ),
        ),
        index: 0,
      },
      {
        address: C.Cardano.PaymentAddress(
          'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
        ),
        value: {
          coins: 50n * 1000000n,
          assets: tokenMap,
        },
      },
    ]),
  )
  tx.addOutput(
    TransactionOutput.fromCore({
      address: C.Cardano.PaymentAddress(
        'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
      ),
      value: {
        coins: 6n,
        assets: tokenMap,
      },
    }),
  )
  tx.setChangeAddress(
    C.Cardano.Address.fromBech32(
      'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
    ),
  )
  tx.complete()
  console.log('After adding input', tx.body.toCbor())

  console.log(
    toHex(
      D.TransactionBody.new(
        D.TransactionInputs.new(),
        D.TransactionOutputs.new(),
        D.BigNum.from_str('0'),
      ).to_bytes(),
    ),
  )

  console.log(
    'tx',
    new C.Serialization.Transaction(
      tx.body,
      new C.Serialization.TransactionWitnessSet(),
    ).toCbor(),
  )

  console.log(
    D.TransactionBody.from_bytes(fromHex(tx.body.toCbor())).to_js_value(),
  )
}
console.log("a")
{
  let tx = new Tx()
  tx.addUnspentOutput(
    TransactionUnspentOutput.fromCore([
      {
        txId: C.Cardano.TransactionId.fromHexBlob(
          C.util.bytesToHex(
            fromHex(
              'b07a3a9e600accd4546082d6c0c8b27d5c351afe8dc4ea5a3504fba881ccb1d8',
            ),
          ),
        ),
        index: 1,
      },
      {
        address: C.Cardano.PaymentAddress(
          'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
        ),
        value: {
          coins: 411619853289n,
        },
      },
    ]),
  )
  tx.setChangeAddress(
    C.Cardano.Address.fromBech32(
      'addr1qye93uefq8r6ezk0kzq443u9zht7ylu5nelvw8eracd200ylzvhpxn9c4g2fyxe5rlmn6z5qmm3dtjqfjn2vvy58l88szlpjw4',
    ),
  )
  let map: C.Cardano.TokenMap = new Map()
  map.set(C.Cardano.AssetId("0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ff446a65644f726465725469636b6574"), 1n)
  tx.addOutput(TransactionOutput.fromCore({
    address: C.Cardano.PaymentAddress("addr1wxy49hzx86ch868hr3uz98lqw8p7ef55j6x8ras7udy3a0gm8cdla"),
    value: {coins: 357040064n, assets: map},
    datumHash: Hash32ByteBase16("2864ee179270814bb12561dec19a4c130d57caa48555a08bc48adf761dadcc18")
  }))
  tx.provideDatum(C.Serialization.PlutusData.fromCbor(HexBlob("d8799fd8799f1a0bebc2001a14e31f2effd8799fd8799f581c3258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bcffd8799fd8799fd8799f581c9f132e134cb8aa14921b341ff73d0a80dee2d5c80994d4c61287f9cfffffffffd8799f1a000186a019e249ff1b0000018eb3284e78581c0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ffff")))
  let map2: Map<C.Cardano.AssetName, bigint> = new Map()
  map2.set(C.Cardano.AssetName("446a65644f726465725469636b6574"), 1n)
  tx.addMint(C.Cardano.PolicyId("0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ff"), map2, C.Serialization.PlutusData.fromCbor(HexBlob("d8799fd8799f58400c83f645abb4b6b67b986d94f31ebb597ee5a3669e8aa943876b75584939389f790f587de851ec2b5079be6ab86670848c32bd9c8e69f00a73c68b394f923e04d8799fd8799f1a000186a019e249ffd8799fd8799fd87a9f1b0000018eb31da7e8ffd87a80ffd8799fd87a9f1b0000018eb32b6388ffd87a80ffff43555344ff581c5b8495ec9f44c040e83c8bb91fdddd22ee6f28e06712f23561645f4dffff")))
  tx.provideScript(C.Serialization.Script.fromCore({
    bytes: HexBlob("590c8301000033323322323322323232323232323232323232323232323232323232323232323322222232533500110231326320183357389201035054350002335004222222222232353233221233001003002357420026ae84d5d10009aab9e3754018446a6a64646464646666664444442466666600200e00c00a0080060046ae84014d5d08021aba1003357420046ae84004d5d09aba2001357440026ae88d5d11aba2001357446ae88004d5d10009aab9e37540044444442466666600200e00c00a0080060044444446a64a66a666ae68cdc39aab9d001480000d40d04c848c004008dd71aba135573c0022c6ea801c8c94cd4c8c94cd4ccd5cd19b87001480000e00dc4c8488c00400cc8c8c8cccd55cfa801131191919091998008020018011aba135744a0086464646666aae7d4008988c8c8c848ccc00401000c008dd71aba135744a00866a066eb4d5d0a801981c1aba15003041135744a00226aae78dd50009aba15003375c6ae85400c0f04d5d1280089aab9e37540026ae84d55cf0010a99a999ab9a3370e002900101c01b8a99a999ab9a357466aae780080e00dc44880085858d55ce8009baa0171333573466e1cccc080008088018cdc08171980098189bac008480000d80d4854cd4c0ccdd60040b1109a9a9919199911091998008020018011aba100235742a0026ae84d5d1280089aba200135573c6ea800888848ccc00401000c0088894cd4c94cd4ccd5cd19b8735573a002900101e81e09a8111bae357426aae7800454084dd51aba135573c6ea800c854cd4ccd5cd19b8f00101f03d03c13533502e75a01844646a6464646666aae7d4008988c8c8ccccc8888848ccccc00401801401000c008d5d0a8029aba15004357420046ae84004d5d09aba2001357440026ae8940081104d5d1280089aab9e37540026464a66a666ae68d5d19aba20010420411325335333573466ebcd5d080080182182109aba1357440022c6aae78dd51aba100116375801c64a66a666ae68cdc39aab9d001480001041004d5d09aab9e00116375400a4646464644444646a608200844a66a646a02e4446a0044446a006446a00844a66a666ae68ccdca81899b8a3233714607e6a0024400466e28cdc5a409491100303f350012200133051004003337146a004446a0064466e28cdc5a416c0208866e28c104010cdc519b8b48160110cdc5182080119b8b482e80411001402815c15854cd4ccd5cd19b8900433704006900002b02b8a99a999ab9a3371e06400a0ae0ac26a00444a666a004426a00844a666a004426a022446a00444a666a004426a00844a666a00442a66a666ae68cdc48060020328320a99a999ab9a337120020120ca0c82666ae68cdc399b8100900c03e065064106410641616161616161616105610561056500d153355335330493756038a09e2c4426a004444a66a0082a66a666ae68cdc79bae00301d05105015335333573466e3cdd700101e8288280999ab9a3370e002900102882808280828110b0a99a999ab9a3370e66606c03007002490010260258a99aa99a99299a999ab9a3370e6aae74005200004d04c135032357426aae78004540c4dd51aba135573c6ea801c84ccd5cd19baf32533533357346ae8cd5d100082702689aba100116375803600209a0982c26a02c4446a004444a66a646a002446a00c44666ae68cdc399b82004001337040040060ae0ac609201826666a6666ae68cdc3a8072400c46424444600400a6eb4d5d09aab9e501223333573466e1d403d2004232321222233004006005375a6ae84d5d128091bad35742a02246666ae68cdc3a8082400446424444600200a6eb4d5d09aab9e501423333573466e1d40452000232321222233003006005375a6ae84d5d1280a9bad35742a028464c6409866ae7013015c12812412011c88d40cc88d40d088d4ccc114160cc14401000ccc144008004894cd4c8d400488ccd5cd19b88337040020140040b80ba660a666e0802000800454cd4ccccc0bc080cdc000399b800320314800120000081501110591059225335333573466e1c004d40cc88c8d400488c94cd4ccd5cd19b88337040040020060b40b2266e0000520021001337080040026660860ac6609e0040026609e66e0801003002c15014c54cd4ccccc0a4068cdc000099b8002c02b4800120000021500b1053105325335333330280193370005605490000008008a80508291299a9999981400c99b8002b02a001480000045402841484144412c412c412c412c54cd4c8c8d400888d4008894ccd400884d4010894ccd4008854cd4ccd5cd19b873370200200890607e0a8298290999ab9a3370e0020120a60a420a42c2c2c2c6eb400d40284ccd5cd19b8f375c00202a092090209026aae75400c4d55cf280109aab9e500113754002266a0620040022c2c640026aa072444a66a0042002442646600c00466e00010004ccc090018098d5d09aba235573c6ea8d5d09aba235573c6ea80088888c894cd4ccd5cd19b89001480000c00c454cd4ccd5cd19b8933301b01a01a00600503003113002375600c20602060640026aa06644646666aae7c00894cd4ccd5cd19b87006480000cc0c84ccd5cd19b87005480000cc0c840c894cd4ccd5cd19b8f375c6aae7540080240cc0c84c94cd4ccd5cd19b873301f0110010070340331333573466e1ccc07c0400040180d00cc40ccdd59aab9e5002130043574400606626ae8400448488c00800c44880048ccd40048c00c0052201042d496e66004881042b496e660025335333573466e20005200001a0191337169001180119b8148000cdc0000a4004266e2d200030020013200135501c225335333573466e2000520800401a019133716002006266e2ccdc3000a410008600466e0c005208004489002232230023756002640026aa03844646666aae7c0089200025335333573466e3cdd71aab9d500200601c01b13300700537566aae7940084c010d5d100180e09aba1001320013550192223233335573e004490001299a999ab9a3371e6eb8d55cea80100200d00c89bad35573ca00426600a0086ae8800c0684d5d0800a450f446a65644f726465725469636b6574002223500222350032235533500713550092232323232335500e0020013370400400c66e08008018cdc100100319b803370400400a66e080180044d5402488c8c8c8c8cd54038008004cdc100100319b820020063370400400c66e04cdc100100299b8200600122330160020011122123300100300213300a00100148008488c8c8cccd5cd19b8735573aa0049000119a8031919191999ab9a3370e6aae754009200023322123300100300233500b00935742a00460186ae84d5d1280111931900719ab9c00e01900c135573ca00226ea8004d5d0a8011919191999ab9a3370e6aae754009200023322123300100300233500b00935742a00460186ae84d5d1280111931900719ab9c00e01900c135573ca00226ea8004d5d09aba2500223263200a33573801402a01026aae7940044dd5000891091980080180109119191999ab9a3370ea00290021091100091999ab9a3370ea00490011190911180180218031aba135573ca00846666ae68cdc3a801a400042444004464c6401466ae7002805402001c0184d55cea80089baa0012323333573466e1d40052002200f23333573466e1d40092000200f23263200633573800c02200800626aae74dd5000a4c921035054310023232325335333573466e1c0040140340305854cd4ccd5cd19b8800100500d00c1330063370200a00466e040140044cc018008004dd69aba135744a0046eb4d5d0a80089aab9e375400290001119801801000910919800801801190009aa804911999aab9f0012500b233500a3574200460066ae88008020c8004d5402088cccd55cf80092805119a8049aba100230033574400400e640026aa00e446446666aae7c00c80088cc014d5d10021998031aab9d500300237566aae79400c0204d5d0800990009aa8031111191999aab9f00220042323330070065335333573466e1c00520000090081005133500b321233300100800200335573aa00600a6ae88010dd69aab9e5002008135742002244004244002240022244004244244660020080062246460020024466006600400400266a24466a24466666666660046600890032412006660089001240049110c446a65644d6963726f5553440048810c5368656e4d6963726f555344004881035553440048812051f4ed3fc62618d6cc2a29f50efb6c8fbf4a6e65a02d90b9eae4a1196bafcb550048303b9b520e0a71248202b7881122011c8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6100222222222212333333333300100b00a0090080070060050040030022001221233001003002200148811c8952dc463eb173e8f71c78229fe071c3eca694968c71f61ee3491ebd0001"),
    version: PlutusLanguageVersion.V1,
    __type: C.Cardano.ScriptType.Plutus
  }))
  tx.body.setTtl(C.Cardano.Slot(120836456))
  tx.body.setValidityStartInterval(C.Cardano.Slot(120836276))
  let final_tx = tx.complete()
  console.log(final_tx.toCore().witness.datums![0])
  console.log(D.Transaction.from_bytes(fromHex(final_tx.toCbor())).to_json())
}
console.log("b")
// {
//   let tx = C.Serialization.Transaction.fromCbor(
//     C.TxCBOR(
//       '84a90081825820b07a3a9e600accd4546082d6c0c8b27d5c351afe8dc4ea5a3504fba881ccb1d801018283581d718952dc463eb173e8f71c78229fe071c3eca694968c71f61ee3491ebd821a1547ffc0a1581c0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ffa14f446a65644f726465725469636b65740158202864ee179270814bb12561dec19a4c130d57caa48555a08bc48adf761dadcc18825839013258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bc9f132e134cb8aa14921b341ff73d0a80dee2d5c80994d4c61287f9cf1b0000005fc126a048021a0005e3e1031a0733d168081a0733d0b409a1581c0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ffa14f446a65644f726465725469636b6574010b5820e90096f951f4932ebe6b521c803864fe66d8f2cb4548f8dfa5f16677834061b40d81825820e29d13b5e61a11f8f9825ff31616cc0dfca0de9961817f9109ee0f5fe39bf92f050e81581c3258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bca30381590c86590c8301000033323322323322323232323232323232323232323232323232323232323232323322222232533500110231326320183357389201035054350002335004222222222232353233221233001003002357420026ae84d5d10009aab9e3754018446a6a64646464646666664444442466666600200e00c00a0080060046ae84014d5d08021aba1003357420046ae84004d5d09aba2001357440026ae88d5d11aba2001357446ae88004d5d10009aab9e37540044444442466666600200e00c00a0080060044444446a64a66a666ae68cdc39aab9d001480000d40d04c848c004008dd71aba135573c0022c6ea801c8c94cd4c8c94cd4ccd5cd19b87001480000e00dc4c8488c00400cc8c8c8cccd55cfa801131191919091998008020018011aba135744a0086464646666aae7d4008988c8c8c848ccc00401000c008dd71aba135744a00866a066eb4d5d0a801981c1aba15003041135744a00226aae78dd50009aba15003375c6ae85400c0f04d5d1280089aab9e37540026ae84d55cf0010a99a999ab9a3370e002900101c01b8a99a999ab9a357466aae780080e00dc44880085858d55ce8009baa0171333573466e1cccc080008088018cdc08171980098189bac008480000d80d4854cd4c0ccdd60040b1109a9a9919199911091998008020018011aba100235742a0026ae84d5d1280089aba200135573c6ea800888848ccc00401000c0088894cd4c94cd4ccd5cd19b8735573a002900101e81e09a8111bae357426aae7800454084dd51aba135573c6ea800c854cd4ccd5cd19b8f00101f03d03c13533502e75a01844646a6464646666aae7d4008988c8c8ccccc8888848ccccc00401801401000c008d5d0a8029aba15004357420046ae84004d5d09aba2001357440026ae8940081104d5d1280089aab9e37540026464a66a666ae68d5d19aba20010420411325335333573466ebcd5d080080182182109aba1357440022c6aae78dd51aba100116375801c64a66a666ae68cdc39aab9d001480001041004d5d09aab9e00116375400a4646464644444646a608200844a66a646a02e4446a0044446a006446a00844a66a666ae68ccdca81899b8a3233714607e6a0024400466e28cdc5a409491100303f350012200133051004003337146a004446a0064466e28cdc5a416c0208866e28c104010cdc519b8b48160110cdc5182080119b8b482e80411001402815c15854cd4ccd5cd19b8900433704006900002b02b8a99a999ab9a3371e06400a0ae0ac26a00444a666a004426a00844a666a004426a022446a00444a666a004426a00844a666a00442a66a666ae68cdc48060020328320a99a999ab9a337120020120ca0c82666ae68cdc399b8100900c03e065064106410641616161616161616105610561056500d153355335330493756038a09e2c4426a004444a66a0082a66a666ae68cdc79bae00301d05105015335333573466e3cdd700101e8288280999ab9a3370e002900102882808280828110b0a99a999ab9a3370e66606c03007002490010260258a99aa99a99299a999ab9a3370e6aae74005200004d04c135032357426aae78004540c4dd51aba135573c6ea801c84ccd5cd19baf32533533357346ae8cd5d100082702689aba100116375803600209a0982c26a02c4446a004444a66a646a002446a00c44666ae68cdc399b82004001337040040060ae0ac609201826666a6666ae68cdc3a8072400c46424444600400a6eb4d5d09aab9e501223333573466e1d403d2004232321222233004006005375a6ae84d5d128091bad35742a02246666ae68cdc3a8082400446424444600200a6eb4d5d09aab9e501423333573466e1d40452000232321222233003006005375a6ae84d5d1280a9bad35742a028464c6409866ae7013015c12812412011c88d40cc88d40d088d4ccc114160cc14401000ccc144008004894cd4c8d400488ccd5cd19b88337040020140040b80ba660a666e0802000800454cd4ccccc0bc080cdc000399b800320314800120000081501110591059225335333573466e1c004d40cc88c8d400488c94cd4ccd5cd19b88337040040020060b40b2266e0000520021001337080040026660860ac6609e0040026609e66e0801003002c15014c54cd4ccccc0a4068cdc000099b8002c02b4800120000021500b1053105325335333330280193370005605490000008008a80508291299a9999981400c99b8002b02a001480000045402841484144412c412c412c412c54cd4c8c8d400888d4008894ccd400884d4010894ccd4008854cd4ccd5cd19b873370200200890607e0a8298290999ab9a3370e0020120a60a420a42c2c2c2c6eb400d40284ccd5cd19b8f375c00202a092090209026aae75400c4d55cf280109aab9e500113754002266a0620040022c2c640026aa072444a66a0042002442646600c00466e00010004ccc090018098d5d09aba235573c6ea8d5d09aba235573c6ea80088888c894cd4ccd5cd19b89001480000c00c454cd4ccd5cd19b8933301b01a01a00600503003113002375600c20602060640026aa06644646666aae7c00894cd4ccd5cd19b87006480000cc0c84ccd5cd19b87005480000cc0c840c894cd4ccd5cd19b8f375c6aae7540080240cc0c84c94cd4ccd5cd19b873301f0110010070340331333573466e1ccc07c0400040180d00cc40ccdd59aab9e5002130043574400606626ae8400448488c00800c44880048ccd40048c00c0052201042d496e66004881042b496e660025335333573466e20005200001a0191337169001180119b8148000cdc0000a4004266e2d200030020013200135501c225335333573466e2000520800401a019133716002006266e2ccdc3000a410008600466e0c005208004489002232230023756002640026aa03844646666aae7c0089200025335333573466e3cdd71aab9d500200601c01b13300700537566aae7940084c010d5d100180e09aba1001320013550192223233335573e004490001299a999ab9a3371e6eb8d55cea80100200d00c89bad35573ca00426600a0086ae8800c0684d5d0800a450f446a65644f726465725469636b6574002223500222350032235533500713550092232323232335500e0020013370400400c66e08008018cdc100100319b803370400400a66e080180044d5402488c8c8c8c8cd54038008004cdc100100319b820020063370400400c66e04cdc100100299b8200600122330160020011122123300100300213300a00100148008488c8c8cccd5cd19b8735573aa0049000119a8031919191999ab9a3370e6aae754009200023322123300100300233500b00935742a00460186ae84d5d1280111931900719ab9c00e01900c135573ca00226ea8004d5d0a8011919191999ab9a3370e6aae754009200023322123300100300233500b00935742a00460186ae84d5d1280111931900719ab9c00e01900c135573ca00226ea8004d5d09aba2500223263200a33573801402a01026aae7940044dd5000891091980080180109119191999ab9a3370ea00290021091100091999ab9a3370ea00490011190911180180218031aba135573ca00846666ae68cdc3a801a400042444004464c6401466ae7002805402001c0184d55cea80089baa0012323333573466e1d40052002200f23333573466e1d40092000200f23263200633573800c02200800626aae74dd5000a4c921035054310023232325335333573466e1c0040140340305854cd4ccd5cd19b8800100500d00c1330063370200a00466e040140044cc018008004dd69aba135744a0046eb4d5d0a80089aab9e375400290001119801801000910919800801801190009aa804911999aab9f0012500b233500a3574200460066ae88008020c8004d5402088cccd55cf80092805119a8049aba100230033574400400e640026aa00e446446666aae7c00c80088cc014d5d10021998031aab9d500300237566aae79400c0204d5d0800990009aa8031111191999aab9f00220042323330070065335333573466e1c00520000090081005133500b321233300100800200335573aa00600a6ae88010dd69aab9e5002008135742002244004244002240022244004244244660020080062246460020024466006600400400266a24466a24466666666660046600890032412006660089001240049110c446a65644d6963726f5553440048810c5368656e4d6963726f555344004881035553440048812051f4ed3fc62618d6cc2a29f50efb6c8fbf4a6e65a02d90b9eae4a1196bafcb550048303b9b520e0a71248202b7881122011c8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6100222222222212333333333300100b00a0090080070060050040030022001221233001003002200148811c8952dc463eb173e8f71c78229fe071c3eca694968c71f61ee3491ebd00010481d8799fd8799f1a0bebc2001a14e31f2effd8799fd8799f581c3258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bcffd8799fd8799fd8799f581c9f132e134cb8aa14921b341ff73d0a80dee2d5c80994d4c61287f9cfffffffffd8799f1a000186a019e249ff1b0000018eb3284e78581c0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ffff0581840100d8799fd8799f58400c83f645abb4b6b67b986d94f31ebb597ee5a3669e8aa943876b75584939389f790f587de851ec2b5079be6ab86670848c32bd9c8e69f00a73c68b394f923e04d8799fd8799f1a000186a019e249ffd8799fd8799fd87a9f1b0000018eb31da7e8ffd87a80ffd8799fd87a9f1b0000018eb32b6388ffd87a80ffff43555344ff581c5b8495ec9f44c040e83c8bb91fdddd22ee6f28e06712f23561645f4dffff821a0008d3d41a0f47a2c9f5f6',
//     ),
//   ).toCore()
//   console.log(tx)
//   console.log(tx.body.inputs)
//   console.log(tx.body.outputs[0])
// }
//{
    //let tx = D.Transaction.from_bytes(fromHex("84a90081825820b07a3a9e600accd4546082d6c0c8b27d5c351afe8dc4ea5a3504fba881ccb1d801018283581d718952dc463eb173e8f71c78229fe071c3eca694968c71f61ee3491ebd821a1547ffc0a1581c0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ffa14f446a65644f726465725469636b65740158202864ee179270814bb12561dec19a4c130d57caa48555a08bc48adf761dadcc18825839013258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bc9f132e134cb8aa14921b341ff73d0a80dee2d5c80994d4c61287f9cf1b0000005fc126a048021a0005e3e1031a0733d168081a0733d0b409a1581c0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ffa14f446a65644f726465725469636b6574010b5820e90096f951f4932ebe6b521c803864fe66d8f2cb4548f8dfa5f16677834061b40d81825820e29d13b5e61a11f8f9825ff31616cc0dfca0de9961817f9109ee0f5fe39bf92f050e81581c3258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bca30381590c86590c8301000033323322323322323232323232323232323232323232323232323232323232323322222232533500110231326320183357389201035054350002335004222222222232353233221233001003002357420026ae84d5d10009aab9e3754018446a6a64646464646666664444442466666600200e00c00a0080060046ae84014d5d08021aba1003357420046ae84004d5d09aba2001357440026ae88d5d11aba2001357446ae88004d5d10009aab9e37540044444442466666600200e00c00a0080060044444446a64a66a666ae68cdc39aab9d001480000d40d04c848c004008dd71aba135573c0022c6ea801c8c94cd4c8c94cd4ccd5cd19b87001480000e00dc4c8488c00400cc8c8c8cccd55cfa801131191919091998008020018011aba135744a0086464646666aae7d4008988c8c8c848ccc00401000c008dd71aba135744a00866a066eb4d5d0a801981c1aba15003041135744a00226aae78dd50009aba15003375c6ae85400c0f04d5d1280089aab9e37540026ae84d55cf0010a99a999ab9a3370e002900101c01b8a99a999ab9a357466aae780080e00dc44880085858d55ce8009baa0171333573466e1cccc080008088018cdc08171980098189bac008480000d80d4854cd4c0ccdd60040b1109a9a9919199911091998008020018011aba100235742a0026ae84d5d1280089aba200135573c6ea800888848ccc00401000c0088894cd4c94cd4ccd5cd19b8735573a002900101e81e09a8111bae357426aae7800454084dd51aba135573c6ea800c854cd4ccd5cd19b8f00101f03d03c13533502e75a01844646a6464646666aae7d4008988c8c8ccccc8888848ccccc00401801401000c008d5d0a8029aba15004357420046ae84004d5d09aba2001357440026ae8940081104d5d1280089aab9e37540026464a66a666ae68d5d19aba20010420411325335333573466ebcd5d080080182182109aba1357440022c6aae78dd51aba100116375801c64a66a666ae68cdc39aab9d001480001041004d5d09aab9e00116375400a4646464644444646a608200844a66a646a02e4446a0044446a006446a00844a66a666ae68ccdca81899b8a3233714607e6a0024400466e28cdc5a409491100303f350012200133051004003337146a004446a0064466e28cdc5a416c0208866e28c104010cdc519b8b48160110cdc5182080119b8b482e80411001402815c15854cd4ccd5cd19b8900433704006900002b02b8a99a999ab9a3371e06400a0ae0ac26a00444a666a004426a00844a666a004426a022446a00444a666a004426a00844a666a00442a66a666ae68cdc48060020328320a99a999ab9a337120020120ca0c82666ae68cdc399b8100900c03e065064106410641616161616161616105610561056500d153355335330493756038a09e2c4426a004444a66a0082a66a666ae68cdc79bae00301d05105015335333573466e3cdd700101e8288280999ab9a3370e002900102882808280828110b0a99a999ab9a3370e66606c03007002490010260258a99aa99a99299a999ab9a3370e6aae74005200004d04c135032357426aae78004540c4dd51aba135573c6ea801c84ccd5cd19baf32533533357346ae8cd5d100082702689aba100116375803600209a0982c26a02c4446a004444a66a646a002446a00c44666ae68cdc399b82004001337040040060ae0ac609201826666a6666ae68cdc3a8072400c46424444600400a6eb4d5d09aab9e501223333573466e1d403d2004232321222233004006005375a6ae84d5d128091bad35742a02246666ae68cdc3a8082400446424444600200a6eb4d5d09aab9e501423333573466e1d40452000232321222233003006005375a6ae84d5d1280a9bad35742a028464c6409866ae7013015c12812412011c88d40cc88d40d088d4ccc114160cc14401000ccc144008004894cd4c8d400488ccd5cd19b88337040020140040b80ba660a666e0802000800454cd4ccccc0bc080cdc000399b800320314800120000081501110591059225335333573466e1c004d40cc88c8d400488c94cd4ccd5cd19b88337040040020060b40b2266e0000520021001337080040026660860ac6609e0040026609e66e0801003002c15014c54cd4ccccc0a4068cdc000099b8002c02b4800120000021500b1053105325335333330280193370005605490000008008a80508291299a9999981400c99b8002b02a001480000045402841484144412c412c412c412c54cd4c8c8d400888d4008894ccd400884d4010894ccd4008854cd4ccd5cd19b873370200200890607e0a8298290999ab9a3370e0020120a60a420a42c2c2c2c6eb400d40284ccd5cd19b8f375c00202a092090209026aae75400c4d55cf280109aab9e500113754002266a0620040022c2c640026aa072444a66a0042002442646600c00466e00010004ccc090018098d5d09aba235573c6ea8d5d09aba235573c6ea80088888c894cd4ccd5cd19b89001480000c00c454cd4ccd5cd19b8933301b01a01a00600503003113002375600c20602060640026aa06644646666aae7c00894cd4ccd5cd19b87006480000cc0c84ccd5cd19b87005480000cc0c840c894cd4ccd5cd19b8f375c6aae7540080240cc0c84c94cd4ccd5cd19b873301f0110010070340331333573466e1ccc07c0400040180d00cc40ccdd59aab9e5002130043574400606626ae8400448488c00800c44880048ccd40048c00c0052201042d496e66004881042b496e660025335333573466e20005200001a0191337169001180119b8148000cdc0000a4004266e2d200030020013200135501c225335333573466e2000520800401a019133716002006266e2ccdc3000a410008600466e0c005208004489002232230023756002640026aa03844646666aae7c0089200025335333573466e3cdd71aab9d500200601c01b13300700537566aae7940084c010d5d100180e09aba1001320013550192223233335573e004490001299a999ab9a3371e6eb8d55cea80100200d00c89bad35573ca00426600a0086ae8800c0684d5d0800a450f446a65644f726465725469636b6574002223500222350032235533500713550092232323232335500e0020013370400400c66e08008018cdc100100319b803370400400a66e080180044d5402488c8c8c8c8cd54038008004cdc100100319b820020063370400400c66e04cdc100100299b8200600122330160020011122123300100300213300a00100148008488c8c8cccd5cd19b8735573aa0049000119a8031919191999ab9a3370e6aae754009200023322123300100300233500b00935742a00460186ae84d5d1280111931900719ab9c00e01900c135573ca00226ea8004d5d0a8011919191999ab9a3370e6aae754009200023322123300100300233500b00935742a00460186ae84d5d1280111931900719ab9c00e01900c135573ca00226ea8004d5d09aba2500223263200a33573801402a01026aae7940044dd5000891091980080180109119191999ab9a3370ea00290021091100091999ab9a3370ea00490011190911180180218031aba135573ca00846666ae68cdc3a801a400042444004464c6401466ae7002805402001c0184d55cea80089baa0012323333573466e1d40052002200f23333573466e1d40092000200f23263200633573800c02200800626aae74dd5000a4c921035054310023232325335333573466e1c0040140340305854cd4ccd5cd19b8800100500d00c1330063370200a00466e040140044cc018008004dd69aba135744a0046eb4d5d0a80089aab9e375400290001119801801000910919800801801190009aa804911999aab9f0012500b233500a3574200460066ae88008020c8004d5402088cccd55cf80092805119a8049aba100230033574400400e640026aa00e446446666aae7c00c80088cc014d5d10021998031aab9d500300237566aae79400c0204d5d0800990009aa8031111191999aab9f00220042323330070065335333573466e1c00520000090081005133500b321233300100800200335573aa00600a6ae88010dd69aab9e5002008135742002244004244002240022244004244244660020080062246460020024466006600400400266a24466a24466666666660046600890032412006660089001240049110c446a65644d6963726f5553440048810c5368656e4d6963726f555344004881035553440048812051f4ed3fc62618d6cc2a29f50efb6c8fbf4a6e65a02d90b9eae4a1196bafcb550048303b9b520e0a71248202b7881122011c8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6100222222222212333333333300100b00a0090080070060050040030022001221233001003002200148811c8952dc463eb173e8f71c78229fe071c3eca694968c71f61ee3491ebd00010481d8799fd8799f1a0bebc2001a14e31f2effd8799fd8799f581c3258f32901c7ac8acfb0815ac78515d7e27f949e7ec71f23ee1aa7bcffd8799fd8799fd8799f581c9f132e134cb8aa14921b341ff73d0a80dee2d5c80994d4c61287f9cfffffffffd8799f1a000186a019e249ff1b0000018eb3284e78581c0ccb659135a7098d40b5eaf97680c4d672ace8b13b750e95362f59ffff0581840100d8799fd8799f58400c83f645abb4b6b67b986d94f31ebb597ee5a3669e8aa943876b75584939389f790f587de851ec2b5079be6ab86670848c32bd9c8e69f00a73c68b394f923e04d8799fd8799f1a000186a019e249ffd8799fd8799fd87a9f1b0000018eb31da7e8ffd87a80ffd8799fd87a9f1b0000018eb32b6388ffd87a80ffff43555344ff581c5b8495ec9f44c040e83c8bb91fdddd22ee6f28e06712f23561645f4dffff821a0008d3d41a0f47a2c9f5f6"))
    //console.log(toHex(tx.witness_set().plutus_data()!.get(0).to_bytes()))
    //console.log(toHex(tx.witness_set().redeemers()!.get(0).data().to_bytes()))
    //console.log("tx length", tx.to_bytes().length)
//}