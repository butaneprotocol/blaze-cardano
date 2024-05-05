import type {
  ProtocolParameters,
  TransactionOutput,
  Transaction,
  ScriptHash,
  Evaluator,
  Hash32ByteBase16,
  DatumHash,
  PlutusData,
  CredentialCore,
} from "@blaze-cardano/core";
import {
  TransactionId,
  TransactionInput,
  RewardAccount,
  NetworkId,
  HexBlob,
  Ed25519PublicKey,
  Ed25519Signature,
  RedeemerTag,
  Hash28ByteBase16,
  AssetId,
  PolicyIdToHash,
  CredentialType,
  Address,
  DatumKind,
  hardCodedProtocolParams,
  TransactionUnspentOutput,
  Value,
  blake2b_256,
} from "@blaze-cardano/core";
import { makeUplcEvaluator, Value as V } from "@blaze-cardano/tx";

export class LedgerTimer {
  block: number = 0;
  slot: number = 0;
  time: number = 0;
}

type SerialisedInput = `${TransactionId}:${bigint}`;

const serialiseInput = (input: TransactionInput): SerialisedInput =>
  `${input.transactionId()}:${input.index()}`;

const deserialiseInput = (input: SerialisedInput): TransactionInput => {
  const [txId, index] = input.split(":");
  return new TransactionInput(TransactionId(txId!), BigInt(index!));
};

/**
 * The Emulator class is used to simulate the behavior of a ledger.
 * It maintains a ledger of unspent transaction outputs, reward accounts, protocol parameters, and a clock.
 * It also provides methods to start and stop an event loop for the ledger.
 */
export class Emulator {
  /**
   * The ledger of unspent transaction outputs.
   */
  private _ledger: Record<SerialisedInput, TransactionOutput> = {};

  /**
   * A pending pool of transactions to be confirmed in the next block.
   */
  private _mempool: Record<
    TransactionId,
    {
      inputs: Set<TransactionInput>;
      outputs: Set<TransactionUnspentOutput>;
    }
  > = {};

  /**
   * The map of reward accounts and their balances.
   */
  accounts: Map<RewardAccount, bigint> = new Map();

  /**
   * The protocol parameters of the ledger.
   */
  params: ProtocolParameters;

  /**
   * The clock of the ledger.
   */
  clock: LedgerTimer = new LedgerTimer();

  /**
   * The event loop for the ledger.
   */
  eventLoop?: NodeJS.Timeout;

  /**
   * A lookup table of hashes to datums.
   */
  datumHashes: Record<DatumHash, PlutusData> = {};

  /**
   * The script evaluator for the emulator
   */
  evaluator: Evaluator;

  /**
   * Constructs a new instance of the Emulator class.
   * Initializes the ledger with the provided genesis outputs and parameters.
   *
   * @param {TransactionOutput[]} genesisOutputs - The genesis outputs to initialize the ledger with.
   * @param {ProtocolParameters} [params=hardCodedProtocolParams] - The parameters to initialize the emulator with.
   */
  constructor(
    genesisOutputs: TransactionOutput[],
    params: ProtocolParameters = hardCodedProtocolParams,
    evaluator?: Evaluator,
  ) {
    for (let i = 0; i < genesisOutputs.length; i++) {
      const txIn = new TransactionInput(
        TransactionId("00".repeat(32)),
        BigInt(i),
      );
      this._ledger[serialiseInput(txIn)] = genesisOutputs[i]!;
    }
    this.params = params;
    this.evaluator = evaluator ?? makeUplcEvaluator(params, 1, 1);
  }

  stepForwardBlock(): void {
    this.clock.block++;
    this.clock.slot += 20;
    this.clock.time += 20_000;

    Object.values(this._mempool).forEach(({ inputs, outputs }) => {
      inputs.forEach(this.removeUtxo);
      outputs.forEach(this.addUtxo);
    });

    this._mempool = {};
  }

  awaitTransactionConfirmation(txId: TransactionId) {
    if (this._mempool[txId]) {
      this.stepForwardBlock();
    }
  }

  /**
   * Starts the event loop for the ledger.
   * If the event loop is already running, it is cleared and restarted.
   * The event loop calls the stepForwardBlock method every 20 seconds.
   */
  startEventLoop() {
    if (this.eventLoop) {
      clearInterval(this.eventLoop);
    }
    this.eventLoop = setInterval(() => {
      this.stepForwardBlock();
    }, 20000);
  }

  /**
   * Stops the event loop for the ledger.
   * If the event loop is running, it is cleared.
   */
  stopEventLoop() {
    if (this.eventLoop) {
      clearInterval(this.eventLoop);
      this.eventLoop = undefined;
    }
  }

  /**
   * Adds a given UTxO to the Emulator's ledger. Overwrites any existing UTxO with the same input.
   *
   * @param utxo - The UTxO to add to the ledger.
   */
  addUtxo(utxo: TransactionUnspentOutput): void {
    this._ledger[serialiseInput(utxo.input())] = utxo.output();
  }

  /**
   * Removes a given UTxO from the Emulator's ledger by input.
   *
   * @param inp - The input to remove from the ledger.
   */
  removeUtxo(inp: TransactionInput): void {
    delete this._ledger[serialiseInput(inp)];
  }

  /**
   * Retrieves an output from the ledger by input.
   *
   * @param inp - The input to retrieve the output for.
   * @returns The output corresponding to the input, or undefined if the input is not found.
   */
  getOutput(inp: TransactionInput): TransactionOutput | undefined {
    // Should utxos in the mempool be considered?
    return this._ledger[serialiseInput(inp)];
  }

  /**
   * Retrieves the Emulator's ledger as an array of UTxOs.
   * @returns The full list of UTxOs in the Emulator's ledger.
   */
  utxos(): TransactionUnspentOutput[] {
    return Object.entries(this._ledger).map(([key, value]) => {
      return new TransactionUnspentOutput(
        deserialiseInput(key as SerialisedInput),
        value,
      );
    });
  }

  /**
   * Submits a transaction to the ledger.
   *
   * @param tx - The transaction to submit.
   * @returns A promise that resolves to the transaction hash.
   *
   * @throws {Error} - If any of the following checks fail:
   *   - Invalid witnesses
   *   - Incorrect count of scripts and vkeys
   *   - Stake key registration
   *   - Withdrawals
   *   - Validity interval
   *   - Input existence
   *   - Script refs
   *   - Collateral inputs
   *   - Required signers
   *   - Mint witnesses
   *   - Cert witnesses
   *   - Input witnesses
   *   - Consumed witnesses
   *
   * @remarks
   * This function performs the following checks and validations:
   *   - Verify Witnesses: Ensure that all witnesses in the transaction are valid.
   *   - Correct Count of Scripts and Vkeys: Check that the transaction has the correct number of scripts and vkeys.
   *   - Stake Key Registration: If the transaction involves a stake key registration, ensure that the stake key is not already registered.
   *   - Withdrawals: If the transaction involves withdrawals, ensure that the withdrawal amount matches the actual reward balance (in babbage, zero should be valid).
   *   - Validity Interval: Check that the transaction's validity interval is within the slot range.
   *   - Input Existence: Check that all inputs in the transaction exist and have not been spent.
   *   - Script Refs: For each input, check if it has a script ref and handle it accordingly.
   *   - Collateral Inputs: Check that all collateral inputs only contain vkeys.
   *   - Required Signers: Check that all required signers are included in the transaction.
   *   - Mint Witnesses: Check that all mint witnesses are included in the transaction.
   *   - Cert Witnesses: Check that all cert witnesses are included in the transaction.
   *   - Input Witnesses: Check that all input witnesses are included in the transaction.
   *   - Check Consumed Witnesses: Check that all witnesses have been consumed.
   *   - Apply Transitions: Apply the necessary transitions to the ledger, mempool, withdrawal requests, cert requests, and outputs, create outputs and consume datum hashes: For each output, create a new unspent output and consume the datum hash.
   *   - UTXO: Check that the transaction's outputs are valid. Fee checking, minSize, ada /= 0, Alonzo.validateOutputTooBigUTxO,
   *   - Fee Checking: Ensure that the transaction fee is not too small. See the fee calculator in tx builder.
   *   - Collateral Checking: Check that the collateral inputs are valid. Collateral should be UTxOs where all are held by pubkeys such that the sum of the collateral minus the collateral return is greater than the minimum collateral fee for the transaction.
   *      - Understanding collateral balancing: if the tx fails, instead of consuming inputs and producing outputs, you consume collateral inputs and produce 1 output (the collateral return), this is
   *   - Disjoint RefInputs: Ensure that there is no intersection between the input set of a transaction and the reference input set of a transaction. I.e no reference inputs may be spent.
   *   - Outputs Too Small: Check that all outputs of the transaction are not too small. See size calculation in tx builder, use the min size parameter from protocol params.
   *   - Other UTxO Transition Rules: Check other transition rules for the UTXO.
   *   - PPUP: Run the PPUP rule before script evaluation. Note from micah: not fully understood.
   *   - Expect Scripts To Pass: Ensure that all scripts pass. Simple enough, requires an 'Evaluator' to be attached to the emulator (see tx class).
   *   - Valid field matters for scripts/collateral: Check that the valid field is true for scripts and collateral.
   *      - The valid field tells you whether the tx should be passed as a collateral forfeit or if the tx should succeed.
   *      - I believe when the valid field is true, even if the tx fails, the node will reject it, but a malicious node could accept and propagate it.
   *      - You can reduce the witness set as only the collateral input needs to be signed for.
   *   - Babbage Missing Scripts: Check for missing scripts according to the Babbage rules. Reference scripts get counted for free, in conway the constitution script is given for free, others need to be included in witnesses.
   *   - Scripts Well Formed: Ensure that all scripts are well-formed.
   *   - Check scripts needed: Check that all needed scripts are provided.
   *   - Missing Script Witnesses: Check for missing script witnesses.
   *   - Extraneous Script Witness: No unnecessary scripts may be attached to the transaction.
   *   - Failed Babbage Scripts: Validate failed Babbage scripts.
   *   - Outside Forecast: Validate that the transaction is bounded within the forecast (start <-> ttl).
   *   - Inputs Is Not Empty Set: Validate that the inputs are not an empty set.
   *   - Value Conserved: Validate that the value is conserved (inputs + withdrawals = outputs + fee + mint && collateral inputs = collateral outputs + collateral fee). See getPitch() from tx builder.
   *   - ADA is not minted: Ensure that ADA is not minted.
   *   - Output Too Big: Validate that the output is not too big.
   *   - Output Boot AddrAttrs Too Big: Validate that the output boot address attributes are not too big.
   *   - Correct Network Id: Validate that the correct network ID is used.
   *   - Network for Withdrawals: Validate the network for withdrawals.
   *   - Size of Tx: Validate the size of the transaction.
   *   - Consumed Exunits: Validate the consumed exunits.
   *   - Number of Collateral Inputs: Validate the number of collateral inputs.
   */
  async submitTransaction(tx: Transaction): Promise<TransactionId> {
    const body = tx.body();
    const witnessSet = tx.witnessSet();

    if (body.networkId() !== NetworkId.Testnet)
      throw new Error("Invalid network ID, Emulator must use Testnet.");

    const validFrom = body.validityStartInterval() ?? -Infinity;
    const validUntil = body.ttl() ?? Infinity;

    const txId = tx.getId();
    let netValue = V.zero();

    // Set of all consumed hashes
    const consumed: Set<Hash28ByteBase16 | Hash32ByteBase16> = new Set();

    // Vkey witnesses are valid
    const vkeyHashes = new Set(
      await Promise.all(
        witnessSet
          .vkeys()!
          .values()
          .map(async (vkey) => {
            const key = Ed25519PublicKey.fromHex(vkey.vkey());
            const keyHash = await key.hash();
            const sig = Ed25519Signature.fromHex(vkey.signature());
            if (!key.verify(sig, HexBlob(txId))) {
              throw new Error(
                `Invalid vkey in witness set with hash ${keyHash}`,
              );
            }
            return Hash28ByteBase16.fromEd25519KeyHashHex(keyHash.hex());
          }),
      ),
    );

    // TODO: bootstrap addresses validation

    const attachedPlutusHashes = new Set(
      [
        ...(witnessSet.plutusV1Scripts()?.values() ?? []),
        ...(witnessSet.plutusV2Scripts()?.values() ?? []),
        ...(witnessSet.plutusV3Scripts()?.values() ?? []),
      ].map((script) => script.hash()),
    );

    // Total set of plutus hashes including referenced scripts
    const plutusHashes = new Set(attachedPlutusHashes);

    const attachedNativeHashes = new Set(
      witnessSet
        .nativeScripts()
        ?.values()
        .map((script) => {
          // TODO: Validate native scripts with validity interval
          return script.hash();
        }),
    );

    const nativeHashes = new Set(attachedNativeHashes);

    const datumHashes =
      witnessSet
        .plutusData()
        ?.values()
        .map((datum) => blake2b_256(datum.toCbor())) ?? [];

    const redeemers = witnessSet.redeemers()?.values() ?? [];

    const consumeVkey = (hash: Hash28ByteBase16) => {
      if (!vkeyHashes.has(hash))
        throw new Error(`Vkey (hash ${hash}) not found in witness set.`);
      consumed.add(hash);
    };

    // TODO: Validate native scripts with validity interval if they're referenced
    const consumeScript = (
      hash: ScriptHash,
      redeemerTag?: RedeemerTag,
      redeemerIndex?: bigint,
    ) => {
      if (
        nativeHashes.has(hash) ||
        (plutusHashes.has(hash) &&
          redeemers.some(
            (r) => r.tag() === redeemerTag && r.index() === redeemerIndex,
          ))
      ) {
        consumed.add(hash);
      } else {
        throw new Error(`Script (hash ${hash}) not found in witness set.`);
      }
    };

    const consumeCred = (
      cred: CredentialCore,
      redeemerTag?: RedeemerTag,
      redeemerIndex?: bigint,
    ) => {
      if (cred.type === CredentialType.KeyHash) {
        consumeVkey(cred.hash);
      } else {
        consumeScript(cred.hash, redeemerTag, redeemerIndex);
      }
    };

    // Witnesses
    // -- Certificates
    body
      .certs()
      ?.values()
      .forEach((cert, index) => {
        switch (cert.kind()) {
          // CertificateKind is not an exported enum so we match on number literals
          case 0: {
            // StakeRegistration
            const stakeRegistration = cert.asStakeRegistration()!;
            const rewardAddr = RewardAccount.fromCredential(
              stakeRegistration.stakeCredential(),
              NetworkId.Testnet,
            );
            if (this.accounts.has(rewardAddr))
              throw new Error(
                `Stake key with reward address ${rewardAddr} is already registered.`,
              );
            break;
          }
          case 1: {
            // StakeDeregistration
            const stakeDeregistration = cert.asStakeDeregistration()!;
            const stakeCred = stakeDeregistration.stakeCredential();
            const rewardAddr = RewardAccount.fromCredential(
              stakeCred,
              NetworkId.Testnet,
            );
            if (!this.accounts.has(rewardAddr))
              throw new Error(
                `Stake key with reward address ${rewardAddr} is not registered.`,
              );
            consumeCred(stakeCred, RedeemerTag.Cert, BigInt(index));
            break;
          }
          // TODO: Other kinds (delegation, governance, e.t.c.)
        }
      });

    // -- Withdrawals
    Array.from(body.withdrawals() ?? []).forEach(
      ([rewardAddr, amount], index) => {
        const balance = this.accounts.get(rewardAddr);
        if (balance !== amount)
          throw new Error(
            `Withdrawal amount for ${rewardAddr} does not match the actual reward balance (Withdrawing: ${amount} Balance: ${balance}).`,
          );

        const stakeCred =
          Address.fromBech32(rewardAddr).getProps().delegationPart!;
        consumeCred(stakeCred, RedeemerTag.Reward, BigInt(index));
        netValue = V.merge(netValue, new Value(amount));
      },
    );

    // -- Mints
    {
      let mintIdx = 0n;
      const mint = body.mint();
      const processedPolicies = new Set();
      // Cardano JS SDK transactions map assetIds not policyIds, so have to ensure we don't double count
      Array.from(mint ?? []).forEach(([assetId]) => {
        if (assetId == "") throw new Error("Cannot mint ADA.");
        const policy = AssetId.getPolicyId(assetId);
        if (processedPolicies.has(policy)) {
          return;
        }
        processedPolicies.add(policy);
        consumeScript(PolicyIdToHash(policy), RedeemerTag.Mint, mintIdx);
        mintIdx++;
      });
      netValue = V.merge(netValue, new Value(0n, mint));
    }

    // -- Required Signers
    body
      .requiredSigners()
      ?.values()
      .forEach((hash) => {
        consumeVkey(Hash28ByteBase16.fromEd25519KeyHashHex(hash.value()));
      });

    // Validity interval contains the current slot range and is formed correctly
    if (this.clock.slot < validFrom || this.clock.slot >= validUntil)
      throw new Error(
        `Validity interval (${validFrom} to ${validUntil}) is outside the slot range (${this.clock.slot}).`,
      );

    if (validFrom >= validUntil)
      throw new Error("Validity interval is invalid.");

    // Input Validation
    // -- Collateral Inputs
    const collateral = body.collateral()?.values();
    const collateralAmount =
      collateral?.reduce((acc, input) => {
        const out = this.getOutput(input);
        if (!out) {
          throw new Error(
            `Collateral input ${input.toCore()} not found in the ledger.`,
          );
        }
        const paymentCred = out.address().getProps().paymentPart!;
        if (paymentCred.type !== CredentialType.KeyHash) {
          throw new Error(
            `Collateral input ${input.toCore()} must contain a vkey.`,
          );
        }
        consumeVkey(paymentCred.hash);
        return acc + out.amount().coin();
      }, 0n) ?? 0n;

    if (collateral?.length ?? 0 > this.params.maxCollateralInputs)
      throw new Error("Collateral inputs exceed the maximum allowed.");

    const usedInputs: TransactionUnspentOutput[] = [];

    const checkInput = (
      input: TransactionInput,
      index: number,
      spent: boolean,
    ) => {
      const out = this.getOutput(input);
      if (!out) {
        throw new Error(`Input ${input.toCore()} not found in the ledger.`);
      }

      usedInputs.push(new TransactionUnspentOutput(input, out));

      if (out.datum()?.kind() == DatumKind.DataHash) {
        consumed.add(out.datum()!.asDataHash()!);
      }

      const scriptRef = out.scriptRef();
      if (scriptRef) {
        if (scriptRef.language()) {
          // Native
          nativeHashes.add(scriptRef.hash());
        } else {
          plutusHashes.add(scriptRef.hash());
        }
      }

      if (spent) {
        const paymentCred = out.address().getProps().paymentPart!;
        consumeCred(paymentCred, RedeemerTag.Spend, BigInt(index));
        netValue = V.merge(netValue, out.amount());
      }
    };

    // -- Reference Inputs
    const refInputs = body.referenceInputs()?.values();
    const checkInputReferenced = (input: TransactionInput, index: number) =>
      checkInput(input, index, false);
    refInputs?.forEach(checkInputReferenced);

    // -- Inputs
    const inputs = body.inputs().values();
    const checkInputSpent = (input: TransactionInput, index: number) =>
      checkInput(input, index, true);
    [...inputs]
      .sort(
        (a, b) =>
          a.transactionId().localeCompare(b.transactionId()) ||
          Number(a.index() - b.index()),
      )
      .forEach(checkInputSpent);

    if (inputs.length === 0) {
      throw new Error("Inputs must not be an empty set.");
    }

    // Disjointness of inputs and reference inputs
    if (
      inputs.some((input) =>
        refInputs?.some(
          (ref) =>
            ref.transactionId() === input.transactionId() &&
            ref.index() === input.index(),
        ),
      )
    ) {
      throw new Error("Inputs and reference inputs must be disjoint.");
    }

    // Minimum collateral amount included
    const minCollateral = BigInt(
      this.params.collateralPercentage * Number(body.fee()),
    );

    // If any scripts have been invoked, minimum collateral must be included
    if (witnessSet.redeemers()) {
      if (
        collateralAmount - (body.collateralReturn()?.amount().coin() ?? 0n) <
        minCollateral
      ) {
        throw new Error("Collateral inputs are insufficient.");
      }

      if (!tx.isValid()) {
        throw new Error("Transaction 'isValid' field must be true.");
      }
    }

    // Outputs
    body.outputs().forEach((output, index) => {
      if (output.datum()?.kind() == DatumKind.DataHash) {
        consumed.add(output.datum()!.asDataHash()!);
      }

      const minAda =
        BigInt(this.params.coinsPerUtxoByte) *
        (BigInt(output.toCbor().length / 2) + 160n);

      if (output.amount().coin() < minAda)
        throw new Error(
          `Output ${index} does not meet the minADA requirement. Output: ${output
            .amount()
            .coin()}, MinADA: ${minAda}`,
        );

      const length = output.toCbor().length / 2;
      if (length > this.params.maxValueSize)
        throw new Error(
          `Output ${index}'s value exceeds the maximum allowed size. Output: ${length} bytes, Maximum: ${this.params.maxValueSize} bytes`,
        );

      netValue = V.sub(netValue, output.amount());
    });

    // Consumed Witnesses count
    [
      ...vkeyHashes,
      ...attachedNativeHashes,
      ...attachedPlutusHashes,
      ...datumHashes,
    ].forEach((hash) => {
      if (!consumed.has(hash)) {
        throw new Error(`Extraneous witness. ${hash} has not been consumed.`);
      }
    });

    // Script eval and fees
    const evaluatedRedeemers = await this.evaluator(tx, usedInputs);
    const evalFee = BigInt(
      Math.ceil(
        evaluatedRedeemers.values().reduce((acc, redeemer) => {
          // Unsure if redeemer lists would be in the same order so we find it explicitly
          const providedRedeemer = redeemers.find(
            (r) => r.tag() === redeemer.tag() && r.index() === redeemer.index(),
          );
          if (!providedRedeemer) {
            throw new Error(
              `Missing redeemer: Purpose ${
                redeemer.toCore().purpose
              }, Index ${redeemer.index()})`,
            );
          }
          const { memory, steps } = redeemer.exUnits().toCore();
          const { memory: providedMemory, steps: providedSteps } =
            providedRedeemer.exUnits().toCore();
          if (providedMemory < memory || providedSteps < steps)
            throw new Error(
              `Underestimated budget (${
                redeemer.toCore().purpose
              } ${redeemer.index()}): ${providedMemory - memory} Memory, ${
                providedSteps - steps
              } Steps`,
            );
          return (
            acc +
            this.params.prices.memory * memory +
            this.params.prices.steps * steps
          );
        }, 0),
      ),
    );

    const txSize = tx.toCbor().length / 2;
    if (txSize > this.params.maxTxSize) {
      throw new Error(
        `Transaction size exceeds the maximum allowed. Supplied: ${txSize}, Maximum: ${this.params.maxTxSize}`,
      );
    }

    const fee =
      evalFee +
      BigInt(
        Math.ceil(
          this.params.minFeeConstant + txSize * this.params.minFeeCoefficient,
        ),
      );

    if (fee > body.fee())
      throw new Error(
        `Insufficient transaction fee. Supplied: ${body.fee()}, Required: ${fee}`,
      );

    netValue = V.sub(netValue, new Value(fee));
    if (!V.empty(netValue))
      throw new Error(
        `Value not conserved. Leftover Value: ${netValue.coin()}, ${
          netValue.multiasset()?.entries() ?? ""
        }`,
      );

    this.acceptTransaction(tx);
    return txId;
  }

  /**
   * Transitions the ledger state according to a transaction's inputs and outputs.
   *
   * @param tx - The transaction to accept.
   *
   * @remarks
   * This function iterates over the inputs of the transaction and removes the corresponding UTXOs from the ledger.
   * It then iterates over the outputs of the transaction and adds them as new UTXOs to the ledger.
   * If the transaction includes any certificates, it processes them accordingly.
   * Finally, it updates the balances of the accounts based on any withdrawals in the transaction.
   */
  private acceptTransaction(tx: Transaction) {
    const inputs = tx.body().inputs().values();
    const outputs = tx.body().outputs();
    const txId = tx.getId();

    this._mempool[txId] = {
      inputs: new Set(inputs),
      outputs: new Set(
        outputs.map(
          (output, i) =>
            new TransactionUnspentOutput(
              new TransactionInput(txId, BigInt(i)),
              output!,
            ),
        ),
      ),
    };

    const certs = tx.body().certs()?.values() ?? [];
    for (let i = 0; i < certs.length; i++) {
      const cert = certs[i]!;
      const stakeRegistration = cert.asStakeRegistration();
      if (stakeRegistration != undefined) {
        const cred = stakeRegistration.stakeCredential();
        const rewardAccount = RewardAccount.fromCredential(
          cred,
          NetworkId.Testnet,
        );
        this.accounts.set(rewardAccount, 0n);
      }
      const stakeDeregistration = cert.asStakeDeregistration();
      if (stakeDeregistration != undefined) {
        const cred = stakeDeregistration.stakeCredential();
        const rewardAccount = RewardAccount.fromCredential(
          cred,
          NetworkId.Testnet,
        );
        this.accounts.delete(rewardAccount);
      }
    }

    const withdrawals: Map<RewardAccount, bigint> =
      tx.body().withdrawals() ?? new Map();
    for (const [account, withdrawn] of withdrawals.entries()) {
      const balance = this.accounts.get(account)?.valueOf() ?? 0n;
      this.accounts.set(account, balance - withdrawn);
    }

    tx
      .witnessSet()
      .plutusData()
      ?.values()
      .forEach((datum) => {
        this.datumHashes[blake2b_256(datum.toCbor())] = datum;
      });
  }
}
