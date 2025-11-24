import {
  type Certificate,
  type CertificateCore,
  type Committee,
  type ConstitutionCore,
  type CredentialCore,
  type DatumHash,
  Datum,
  type Evaluator,
  type Fraction,
  type Hash32ByteBase16,
  type PlutusData,
  PoolId,
  type PoolParameters,
  type ProposalProcedure,
  type ProtocolParameters,
  RedeemerTag,
  getBurnAddress,
  type Script,
  type ScriptHash,
  Slot,
  StakeDelegationCertificateTypes,
  StakeRegistrationCertificateTypes,
  RegAndDeregCertificateTypes,
  TransactionInput,
  TransactionOutput,
  type Transaction,
  Vote,
  VoteDelegationCredentialCertificateTypes,
  Voter,
  Address,
  AssetId,
  Bip32PrivateKey,
  CertificateType,
  CredentialType,
  DRep,
  Ed25519KeyHashHex,
  Ed25519PublicKey,
  Ed25519Signature,
  GovernanceActionId,
  GovernanceActionKind,
  Hash28ByteBase16,
  HexBlob,
  NetworkId,
  PolicyIdToHash,
  RewardAccount,
  StakeCredentialCertificateTypes,
  TransactionId,
  TransactionUnspentOutput,
  Value,
  VoterKind,
  blake2b_256,
  hardCodedProtocolParams,
  isCertType,
  DatumKind,
} from "@blaze-cardano/core";
import {
  Blaze,
  HotWallet,
  type Provider,
  type Wallet,
} from "@blaze-cardano/sdk";
import {
  calculateReferenceScriptFee,
  makeValue,
  type TxBuilder,
  Value as V,
} from "@blaze-cardano/tx";
import { makeUplcEvaluator } from "@blaze-cardano/vm";
import { randomBytes } from "crypto";
import {
  addUtxoToLedger,
  getOutputFromLedger,
  listUtxosFromLedger,
  lookupScriptInLedger,
  removeUtxoFromLedger,
} from "./utxo";
import { EmulatorProvider } from "./provider";
import {
  DREP_KIND_ABSTAIN,
  DREP_KIND_NO_CONFIDENCE,
  identifyParameterGroups,
} from "./constants";
import { LedgerTimer } from "./ledger-timer";
import {
  type DRepState,
  type EmulatorOptions,
  type EnactQueueItem,
  type GovProposal,
  ProposalStatus,
  type RegisteredAccount,
  type SerialisedGovId,
  type SerialisedInput,
  type StakeSnapshot,
  type Tallies,
} from "./types";
import {
  fractionAtLeast,
  fractionMax,
  isLegacyStakeCertificate,
  serialiseGovId,
  serialiseInput,
  toPoolIdKey,
  certificateDeposit,
} from "./utils";
import {
  committeeMemberTermActive,
  findCommitteeMemberByColdHash,
  buildStakeSnapshot,
  isDelayingAction,
  nextDrepExpiryEpoch,
  serialiseDrepCredential,
  serialiseVoter,
} from "./governance";

/**
 * The Emulator class is used to simulate the behavior of a ledger.
 * It maintains a ledger of unspent transaction outputs, reward accounts, protocol parameters, and a clock.
 * It also provides methods to start and stop an event loop for the ledger.
 */
export class Emulator {
  /**
   * The ledger of unspent transaction outputs.
   */
  #ledger: Record<SerialisedInput, TransactionOutput> = {};

  // Record of governance proposals
  #proposals: Record<SerialisedGovId, GovProposal> = {};

  /**
   * A pending pool of transactions to be confirmed in the next block.
   */
  #mempool: Record<
    TransactionId,
    {
      inputs: Set<TransactionInput>;
      outputs: Set<TransactionUnspentOutput>;
    }
  > = {};

  #nextGenesisUtxo: number;

  /**
   * The map of reward accounts and their balances.
   */
  accounts: Map<RewardAccount, RegisteredAccount> = new Map();

  /**
   * A map from label to blaze instance for that wallet
   */
  mockedWallets: Map<string, Wallet> = new Map();

  /**
   * The protocol parameters of the ledger.
   */
  params: ProtocolParameters;

  /**
   * The clock of the ledger.
   */
  clock: LedgerTimer;

  /**
   * The event loop for the ledger.
   */
  eventLoop?: ReturnType<typeof setInterval>;

  /**
   * A lookup table of hashes to datums.
   */
  datumHashes: Record<DatumHash, PlutusData> = {};

  /**
   * The script evaluator for the emulator
   */
  evaluator: Evaluator;

  treasury: bigint = 0n;
  depositPot: bigint = 0n;
  feePot: bigint = 0n;

  // Governance state
  dreps: Record<Hash28ByteBase16, DRepState> = {};
  cc: Committee = {
    members: [],
    quorumThreshold: { numerator: 0, denominator: 1 },
  };
  constitution: ConstitutionCore = {
    anchor: { url: "", dataHash: "" as Hash32ByteBase16 },
    scriptHash: null,
  };
  snapshots: Record<number, StakeSnapshot> = {};
  enactQueue: EnactQueueItem[] = [];
  bootstrapMode: boolean = true;
  activePools: Record<PoolId, PoolParameters> = {};
  private proposalDepositsByAccount: Map<RewardAccount, bigint> = new Map();
  private ccHotCredentials: Record<string, CredentialCore | undefined> = {};
  private lastEnactedActionByKind: Partial<
    Record<GovernanceActionKind, SerialisedGovId>
  > = {};
  private delayingActionBarrierUntil?: number;
  private govTraceEnabled: boolean = false;

  private govTrace(...args: unknown[]) {
    if (this.govTraceEnabled) console.debug("[GOV]", ...args);
  }

  /**
   * Constructs a new emulator instance seeded with the provided genesis outputs.
   *
   * @param {TransactionOutput[]} genesisOutputs - Initial UTxOs used to populate the ledger.
   * @param {EmulatorOptions} [options] - Optional overrides for evaluator, protocol parameters, slot configuration, and governance state.
   */
  constructor(
    genesisOutputs: TransactionOutput[],
    {
      evaluator,
      slotConfig,
      trace: traceGovernance,
      slotsPerEpoch,
      params = hardCodedProtocolParams,
      treasury = 0n,
      cc = { members: [], quorumThreshold: { numerator: 0, denominator: 1 } },
      ccHotCredentials,
    }: EmulatorOptions = {}
  ) {
    const constitution: ConstitutionCore = {
      anchor: { url: "", dataHash: "" as Hash32ByteBase16 },
      scriptHash: null,
    };
    this.constitution = constitution;
    this.cc = cc;
    this.treasury = treasury;
    this.ccHotCredentials = ccHotCredentials ?? {};
    this.#nextGenesisUtxo = 0;
    for (let i = 0; i < genesisOutputs.length; i++) {
      const txIn = new TransactionInput(
        TransactionId("00".repeat(32)),
        BigInt(this.#nextGenesisUtxo)
      );
      this.#nextGenesisUtxo += 1;
      this.#ledger[serialiseInput(txIn)] = genesisOutputs[i]!;
    }
    this.clock = new LedgerTimer(slotConfig, slotsPerEpoch);
    this.params = params;
    this.govTraceEnabled = Boolean(traceGovernance);
    this.evaluator =
      evaluator ??
      makeUplcEvaluator(
        params,
        1,
        1,
        slotConfig ?? {
          zeroSlot: this.clock.slot,
          zeroTime: this.clock.time,
          slotLength: this.clock.slotLength,
        }
      );
    this.addUtxo = this.addUtxo.bind(this);
    this.removeUtxo = this.removeUtxo.bind(this);
  }

  private async getOrAddWallet(label: string): Promise<Wallet> {
    if (!this.mockedWallets.has(label)) {
      const provider = new EmulatorProvider(this);
      const entropy = randomBytes(96);
      const masterkey = Bip32PrivateKey.fromBytes(new Uint8Array(entropy));
      const wallet = await HotWallet.fromMasterkey(masterkey.hex(), provider);
      this.mockedWallets.set(label, wallet);
    }
    return this.mockedWallets.get(label)!;
  }

  /**
   * Funds and registers a labelled wallet, returning its default change address.
   *
   * @param {string} label - Identifier for the wallet to bootstrap.
   * @param {Value} [value] - Optional value to fund the wallet with (defaults to 100 ADA equivalent).
   * @param {PlutusData} [datum] - Optional inline datum to attach to the funding output.
   * @returns {Promise<Address>} Resolves to the wallet's change address once funded.
   */
  public async register(
    label: string,
    value?: Value,
    datum?: PlutusData
  ): Promise<Address> {
    await this.fund(label, value, datum);
    const wallet = await this.getOrAddWallet(label);
    return wallet.getChangeAddress();
  }

  /**
   * Returns the current change address for a labelled wallet, creating the wallet if it has not been initialised yet.
   *
   * @param {string} label - Identifier of the wallet to query.
   * @returns {Promise<Address>} Resolves to the wallet's change address.
   */
  public async addressOf(label: string): Promise<Address> {
    const wallet = await this.getOrAddWallet(label);
    return wallet.getChangeAddress();
  }

  /**
   * Mints a synthetic genesis UTxO to the labelled wallet to seed it with funds.
   *
   * @param {string} label - Wallet identifier to fund.
   * @param {Value} [value] - Optional custom value (defaults to 100 ADA equivalent).
   * @param {PlutusData} [datum] - Optional inline datum to attach to the output.
   * @returns {Promise<void>} Resolves once the UTxO has been added to the ledger.
   */
  public async fund(label: string, value?: Value, datum?: PlutusData) {
    const wallet = await this.getOrAddWallet(label);
    const output = new TransactionOutput(
      await wallet.getChangeAddress(),
      value ?? makeValue(100_000_000n)
    );
    if (datum) {
      output.setDatum(Datum.newInlineData(datum));
    }
    this.addUtxo(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId("00".repeat(32)),
          BigInt(this.#nextGenesisUtxo)
        ),
        output
      )
    );
    this.#nextGenesisUtxo += 1;
  }

  /**
   * Executes the supplied callback in the context of a labelled wallet and
   * Blaze client, simplifying multi-party test flows.
   *
   * @param {string} label - Wallet label whose context should be used.
   * @param {(blaze: Blaze<Provider, Wallet>, address: Address) => Promise<T>} callback - Function executed with the wallet's Blaze client and address.
   * @returns {Promise<T>} Resolves with the callback's return value.
   */
  public async as<T = void>(
    label: string,
    callback: (blaze: Blaze<Provider, Wallet>, address: Address) => Promise<T>
  ): Promise<T> {
    const provider = new EmulatorProvider(this);
    const wallet = await this.getOrAddWallet(label);
    const blaze = await Blaze.from(provider, wallet);
    return callback(blaze, await wallet.getChangeAddress());
  }

  /**
   * Attaches the provided script to a genesis-style UTxO so tests can reference
   * it via `lookupScript` without building an on-chain transaction.
   *
   * @param {Script} script - Script to publish as a reference UTxO.
   * @returns {Promise<void>} Resolves once the script reference has been added.
   */
  public async publishScript(script: Script) {
    const utxo = new TransactionOutput(
      getBurnAddress(NetworkId.Testnet),
      makeValue(5_000_001n)
    );
    utxo.setScriptRef(script);
    this.addUtxo(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId("00".repeat(32)),
          BigInt(this.#nextGenesisUtxo)
        ),
        utxo
      )
    );
    this.#nextGenesisUtxo += 1;
  }

  /**
   * Locates the synthetic script reference UTxO for the provided script.
   *
   * @param {Script} script - Script whose published reference should be retrieved.
   * @returns {TransactionUnspentOutput} The reference UTxO containing the script.
   *
   * @throws {Error} When the script has not been published.
   */
  public lookupScript(script: Script): TransactionUnspentOutput {
    return lookupScriptInLedger(this.#ledger, script);
  }

  /**
   * Completes, signs, and submits a transaction, throwing if validation fails.
   * Retains the CBOR for debugging in line with emulator troubleshooting flow.
   *
   * @param {Blaze<Provider, Wallet>} blaze - Wallet context used to sign the transaction.
   * @param {TxBuilder} tx - Builder producing the transaction to validate and submit.
   * @returns {Promise<void>} Resolves once the transaction has been confirmed.
   */
  public async expectValidTransaction(
    blaze: Blaze<Provider, Wallet>,
    tx: TxBuilder
  ) {
    const scriptBytes = tx.toCbor();
    try {
      const completedTx = await tx.complete();
      const signedTx = await blaze.signTransaction(completedTx);
      const txId = await this.submitTransaction(signedTx);
      this.awaitTransactionConfirmation(txId);
      if (txId === undefined) {
        throw new Error("Transaction ID undefined");
      }
    } catch (error) {
      console.error("Script Bytes: ", scriptBytes);
      throw error;
    }
  }

  /**
   * Submits a transaction requiring multiple labelled wallets to co-sign.
   * Each signer is resolved via `getOrAddWallet` before submission.
   *
   * @param {string[]} signers - Labels of wallets that must co-sign the transaction.
   * @param {TxBuilder} tx - Builder producing the transaction to validate and submit.
   * @returns {Promise<void>} Resolves once the transaction has been confirmed.
   */
  public async expectValidMultisignedTransaction(
    signers: string[],
    tx: TxBuilder
  ) {
    const scriptBytes = tx.toCbor();
    try {
      let signedTx = await tx.complete();
      for (const signer of signers) {
        await this.as(signer, async (blaze) => {
          signedTx = await blaze.signTransaction(signedTx);
        });
      }
      const txId = await this.submitTransaction(signedTx);
      this.awaitTransactionConfirmation(txId);
      if (txId === undefined) {
        throw new Error("Transaction ID undefined");
      }
    } catch (error) {
      console.error("Script Bytes: ", scriptBytes);
      throw error;
    }
  }

  /**
   * Asserts that completing the provided transaction fails with an optional
   * matching error message. Helps validate negative Plutus scenarios.
   *
   * @param {TxBuilder} tx - Builder expected to fail during completion.
   * @param {RegExp} [pattern] - Optional pattern that the thrown error message must satisfy.
   * @returns {Promise<void>} Resolves when the expected failure is observed.
   */
  public async expectScriptFailure(tx: TxBuilder, pattern?: RegExp) {
    try {
      const complete = await tx.complete();
      console.error(`Script Bytes: ${complete.toCbor()}`);
    } catch (error: any) {
      if (!!pattern && !pattern.exec(error.toString())) {
        throw new Error("Script Failed, but didn't match pattern: " + error);
      }
      return;
    }
    throw new Error("Transaction was valid!");
  }

  /**
   * Converts a unix timestamp (ms) into a slot using the current slot configuration.
   *
   * @param {bigint | number} unixMillis - Unix timestamp in milliseconds.
   * @returns {Slot} Slot corresponding to the provided timestamp.
   */
  unixToSlot(unixMillis: bigint | number): Slot {
    return Slot(
      Math.ceil(
        (Number(unixMillis) - this.clock.zeroTime) / this.clock.slotLength
      )
    );
  }

  /**
   * Converts a slot index back into a unix timestamp (ms).
   *
   * @param {Slot | number | bigint} slot - Slot index to convert.
   * @returns {number} Unix timestamp in milliseconds.
   */
  slotToUnix(slot: Slot | number | bigint): number {
    return Number(slot.valueOf()) * this.clock.slotLength + this.clock.zeroTime;
  }

  /**
   * Advances the emulator forward to the provided slot, triggering epoch
   * transitions and materialising the mempool as needed.
   *
   * @param {number | bigint} slot - Target slot to advance to.
   * @returns {void}
   */
  stepForwardToSlot(slot: number | bigint) {
    if (Number(slot) <= this.clock.slot) {
      throw new Error("Time travel is unsafe");
    }
    const prevEpoch = this.clock.epoch;
    this.clock.slot = Number(slot);
    this.clock.block = Math.ceil(Number(slot) / 20);
    this.clock.time = this.slotToUnix(slot);
    this.clock.epoch = Math.floor(
      (this.clock.slot - this.clock.zeroSlot) / this.clock.slotsPerEpoch
    );

    Object.values(this.#mempool).forEach(({ inputs, outputs }) => {
      inputs.forEach(this.removeUtxo);
      outputs.forEach(this.addUtxo);
    });

    this.#mempool = {};

    if (this.clock.epoch > prevEpoch) {
      this.onEpochBoundary();
    }
  }

  /**
   * Advances the emulator to the first slot of the next epoch.
   * Mirrors the epoch boundary workflow defined in the Conway ledger spec.
   *
   * @returns {void}
   */
  public stepForwardToNextEpoch(): void {
    const nextEpochSlot =
      (this.clock.epoch + 1) * this.clock.slotsPerEpoch + this.clock.zeroSlot;
    this.stepForwardToSlot(nextEpochSlot);
  }

  /**
   * Advances time to the slot corresponding to the provided unix timestamp.
   *
   * @param {number | bigint} unix - Unix timestamp (ms) to advance to.
   * @returns {void}
   */
  stepForwardToUnix(unix: number | bigint) {
    this.stepForwardToSlot(this.unixToSlot(unix));
  }

  /**
   * Advances exactly one block (20 slots) according to the emulator clock.
   *
   * @returns {void}
   */
  stepForwardBlock(): void {
    this.stepForwardToSlot(this.clock.slot + 20);
  }

  /**
   * Forces block production until the referenced transaction leaves the mempool.
   *
   * @param {TransactionId} txId - Identifier of the transaction awaiting confirmation.
   * @returns {void}
   */
  awaitTransactionConfirmation(txId: TransactionId) {
    if (this.#mempool[txId]) {
      this.stepForwardBlock();
    }
  }

  /**
   * Starts the event loop for the ledger.
   * If the event loop is already running, it is cleared and restarted.
   * The event loop calls the stepForwardBlock method every 20 slots.
   *
   * @returns {void}
   */
  startEventLoop() {
    if (this.eventLoop) {
      clearInterval(this.eventLoop);
    }
    this.eventLoop = setInterval(() => {
      this.stepForwardBlock();
    }, 20 * this.clock.slotLength);
  }

  /**
   * Stops the event loop for the ledger.
   * If the event loop is running, it is cleared.
   *
   * @returns {void}
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
   * @param {TransactionUnspentOutput} utxo - The UTxO to add to the ledger.
   * @returns {void}
   */
  addUtxo(utxo: TransactionUnspentOutput): void {
    addUtxoToLedger(this.#ledger, utxo);
  }

  /**
   * Removes a given UTxO from the Emulator's ledger by input.
   *
   * @param {TransactionInput} inp - The input to remove from the ledger.
   * @returns {void}
   */
  removeUtxo(inp: TransactionInput): void {
    removeUtxoFromLedger(this.#ledger, inp);
  }

  /**
   * Retrieves an output from the ledger by input.
   *
   * @param {TransactionInput} inp - Input referencing the desired UTxO.
   * @returns {TransactionOutput | undefined} The corresponding output, if found.
   */
  getOutput(inp: TransactionInput): TransactionOutput | undefined {
    return getOutputFromLedger(this.#ledger, inp);
  }

  /**
   * Retrieves the Emulator's ledger as an array of UTxOs.
   *
   * @returns {TransactionUnspentOutput[]} The full list of UTxOs in the Emulator's ledger.
   */
  utxos(): TransactionUnspentOutput[] {
    return listUtxosFromLedger(this.#ledger);
  }

  /**
   * Submits a transaction to the ledger.
   *
   * @param {Transaction} tx - The transaction to submit.
   * @returns {Promise<TransactionId>} Resolves to the submitted transaction hash.
   *
   * @throws {Error} If witness validation, collateral checks, validity intervals, or governance constraints fail.
   */
  async submitTransaction(tx: Transaction): Promise<TransactionId> {
    const body = tx.body();
    const witnessSet = tx.witnessSet();

    // TODO: Potential bug with js SDK where setting the network to testnet causes the tx body CBOR to fail
    // if (body.networkId() !== NetworkId.Testnet)
    //   throw new Error("Invalid network ID, Emulator must use Testnet.");

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
                `Invalid vkey in witness set with hash ${keyHash}`
              );
            }
            return Hash28ByteBase16.fromEd25519KeyHashHex(keyHash.hex());
          })
      )
    );

    // TODO: bootstrap addresses validation

    const attachedPlutusHashes = new Set(
      [
        ...(witnessSet.plutusV1Scripts()?.values() ?? []),
        ...(witnessSet.plutusV2Scripts()?.values() ?? []),
        ...(witnessSet.plutusV3Scripts()?.values() ?? []),
      ].map((script) => script.hash())
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
        })
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
      redeemerIndex?: bigint
    ) => {
      if (nativeHashes.has(hash)) {
        consumed.add(hash);
      } else if (plutusHashes.has(hash)) {
        const hasRedeemer = redeemers.some(
          (r) => r.tag() === redeemerTag && r.index() === redeemerIndex
        );

        if (!hasRedeemer) {
          throw new Error(
            `Script (hash ${hash}) was found but without a redeemer.`
          );
        }

        consumed.add(hash);
      } else {
        throw new Error(`Script (hash ${hash}) not found in witness set.`);
      }
    };

    const consumeCred = (
      cred: CredentialCore,
      redeemerTag?: RedeemerTag,
      redeemerIndex?: bigint
    ) => {
      if (cred.type === CredentialType.KeyHash) {
        consumeVkey(cred.hash);
      } else {
        consumeScript(cred.hash, redeemerTag, redeemerIndex);
      }
    };

    // Input Validation
    // -- Collateral Inputs
    const collateral = body.collateral()?.values();
    const collateralAmount =
      collateral?.reduce((acc, input) => {
        const out = this.getOutput(input);
        if (!out) {
          throw new Error(
            `Collateral input ${input.toCore()} not found in the ledger.`
          );
        }
        const paymentCred = out.address().getProps().paymentPart!;
        if (paymentCred.type !== CredentialType.KeyHash) {
          throw new Error(
            `Collateral input ${input.toCore()} must contain a vkey.`
          );
        }
        consumeVkey(paymentCred.hash);
        return acc + out.amount().coin();
      }, 0n) ?? 0n;

    if (
      collateral?.length &&
      collateral.length > this.params.maxCollateralInputs
    )
      throw new Error(
        `Collateral inputs exceed the maximum allowed. Provided: ${collateral?.length}, Maximum: ${this.params.maxCollateralInputs}`
      );

    const usedInputs: TransactionUnspentOutput[] = [];

    const refInputs = body.referenceInputs()?.values();
    const inputs = body.inputs().values();

    // Collect hashes
    [...inputs, ...(refInputs ?? [])].forEach((input) => {
      const out = this.getOutput(input);

      if (!out) {
        throw new Error(
          `Input ${JSON.stringify(input.toCore())} not found in the ledger.`
        );
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
    });

    [...inputs]
      .sort(
        (a, b) =>
          a.transactionId().localeCompare(b.transactionId()) ||
          Number(a.index() - b.index())
      )
      .forEach((input, index) => {
        const out = this.getOutput(input)!;
        const paymentCred = out.address().getProps().paymentPart!;
        consumeCred(paymentCred, RedeemerTag.Spend, BigInt(index));
        netValue = V.merge(netValue, out.amount());
      });

    if (inputs.length === 0) {
      throw new Error("Inputs must not be an empty set.");
    }

    // Disjointness of inputs and reference inputs
    if (
      inputs.some((input) =>
        refInputs?.some(
          (ref) =>
            ref.transactionId() === input.transactionId() &&
            ref.index() === input.index()
        )
      )
    ) {
      throw new Error("Inputs and reference inputs must be disjoint.");
    }

    // Minimum collateral amount included
    const minCollateral = BigInt(
      Math.ceil((this.params.collateralPercentage / 100) * Number(body.fee()))
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

    // -- Withdrawals
    Array.from(body.withdrawals() ?? []).forEach(
      ([rewardAddr, amount], index) => {
        const account = this.getAccount(rewardAddr);
        if (account.balance !== amount)
          throw new Error(
            `Withdrawal amount for ${rewardAddr} does not match the actual reward balance (Withdrawing: ${amount} Balance: ${account.balance}).`
          );

        const stakeCred =
          Address.fromBech32(rewardAddr).getProps().paymentPart!;
        consumeCred(stakeCred, RedeemerTag.Reward, BigInt(index));
        netValue = V.merge(netValue, new Value(amount));
      }
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
        `Validity interval (${validFrom} to ${validUntil}) is outside the slot range (${this.clock.slot}).`
      );

    if (validFrom >= validUntil)
      throw new Error("Validity interval is invalid.");

    // -- Certificates
    body
      .certs()
      ?.values()
      .forEach((cert, index) => {
        const core = cert.toCore() as CertificateCore;
        const certType = core.__typename;

        // Deposits (stake reg family)
        if (isCertType(core, StakeRegistrationCertificateTypes)) {
          const deposit = isLegacyStakeCertificate(core)
            ? BigInt(this.params.stakeKeyDeposit)
            : certificateDeposit(core);
          netValue = V.sub(netValue, new Value(deposit));
        }

        // Refunds (reg + dereg family where applicable)
        if (
          isCertType(core, RegAndDeregCertificateTypes) &&
          (certType === CertificateType.Unregistration ||
            certType === CertificateType.StakeDeregistration)
        ) {
          const deposit = isLegacyStakeCertificate(core)
            ? BigInt(this.params.stakeKeyDeposit)
            : certificateDeposit(core);
          netValue = V.merge(netValue, new Value(deposit));
        }

        // Witnesses by stake/vote groups
        if (
          (isCertType(core, StakeCredentialCertificateTypes) ||
            isCertType(core, VoteDelegationCredentialCertificateTypes)) &&
          // Legacy stake registration cert doesn't require redeemer, new version in conway does
          certType !== CertificateType.StakeRegistration
        ) {
          const stakeCred = core.stakeCredential;
          if (stakeCred) {
            consumeCred(stakeCred, RedeemerTag.Cert, BigInt(index));
          }
        }

        // DRep credential on DRRep certs
        if (
          certType === CertificateType.RegisterDelegateRepresentative ||
          certType === CertificateType.UnregisterDelegateRepresentative ||
          certType === CertificateType.UpdateDelegateRepresentative
        ) {
          const drepCred = core.dRepCredential;
          if (drepCred) consumeCred(drepCred, RedeemerTag.Cert, BigInt(index));
        }

        // Committee certificates
        if (
          certType === CertificateType.AuthorizeCommitteeHot ||
          certType === CertificateType.ResignCommitteeCold
        ) {
          consumeCred(core.coldCredential, RedeemerTag.Cert, BigInt(index));
        }
      });

    // Governance proposal deposits
    const proposalSet = body.proposalProcedures();
    if (proposalSet) {
      const proposals = proposalSet.values();
      let totalDeposit = 0n;
      for (let i = 0; i < proposals.length; i++) {
        const p = proposals[i]!;
        const expected = BigInt(this.params.governanceActionDeposit ?? 0);
        if (BigInt(p.deposit()) !== expected) {
          throw new Error(
            `Invalid governance deposit: supplied ${p.deposit()} expected ${this.params.governanceActionDeposit ?? 0}`
          );
        }
        totalDeposit += BigInt(p.deposit());
      }
      if (totalDeposit > 0n) {
        netValue = V.sub(netValue, new Value(totalDeposit));
      }
    }

    // Voting witnesses
    const voting = body.votingProcedures();
    if (voting !== undefined) {
      for (const { voter } of voting.toCore()) {
        const vs = Voter.fromCore(voter);
        switch (vs.kind()) {
          case VoterKind.DrepKeyHash:
          case VoterKind.DRepScriptHash: {
            const cred = vs.toDrepCred()!;
            consumeCred(cred);
            break;
          }
          case VoterKind.ConstitutionalCommitteeKeyHash:
          case VoterKind.ConstitutionalCommitteeScriptHash: {
            const cred = vs.toConstitutionalCommitteeHotCred()!;
            consumeCred(cred);
            break;
          }
          case VoterKind.StakePoolKeyHash: {
            const keyHash = vs.toStakingPoolKeyHash()!;
            consumeVkey(Hash28ByteBase16.fromEd25519KeyHashHex(keyHash));
            break;
          }
        }
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
            .coin()}, MinADA: ${minAda}`
        );

      const length = output.amount().toCbor().length / 2;
      if (length > this.params.maxValueSize)
        throw new Error(
          `Output ${index}'s value exceeds the maximum allowed size. Output: ${length} bytes, Maximum: ${this.params.maxValueSize} bytes`
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
        let witnessType;
        switch (true) {
          case vkeyHashes.has(hash as any):
            witnessType = "VKey";
            break;
          case attachedNativeHashes.has(hash as any):
            witnessType = "Native";
            break;
          case attachedPlutusHashes.has(hash as any):
            witnessType = "Plutus";
            break;
          case datumHashes.includes(hash as any):
            witnessType = "Datum";
            break;
          default:
            witnessType = "Unknown";
        }
        throw new Error(
          `Extraneous ${witnessType} witness. ${hash} has not been consumed.`
        );
      }
    });

    const txSize = tx.toCbor().length / 2;
    if (txSize > this.params.maxTxSize) {
      throw new Error(
        `Transaction size exceeds the maximum allowed. Supplied: ${txSize}, Maximum: ${this.params.maxTxSize}`
      );
    }

    // Script eval and fees
    const evaluatedRedeemers = await this.evaluator(tx, usedInputs);
    const evalFee = BigInt(
      Math.ceil(
        evaluatedRedeemers.values().reduce((acc, redeemer) => {
          // Unsure if redeemer lists would be in the same order so we find it explicitly
          const providedRedeemer = redeemers.find(
            (r) => r.tag() === redeemer.tag() && r.index() === redeemer.index()
          );
          if (!providedRedeemer) {
            throw new Error(
              `Missing redeemer: Purpose ${
                redeemer.toCore().purpose
              }, Index ${redeemer.index()})`
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
              } Steps`
            );
          return (
            acc +
            this.params.prices.memory * memory +
            this.params.prices.steps * steps
          );
        }, 0)
      )
    );

    let fee =
      evalFee +
      BigInt(
        Math.ceil(
          this.params.minFeeConstant + txSize * this.params.minFeeCoefficient
        )
      );

    let refScriptFee = 0n;
    if (refInputs && this.params.minFeeRefScriptCostPerByte) {
      const refScripts = [...inputs, ...refInputs]
        .map((x) => this.getOutput(x)!.scriptRef())
        .filter((x) => x !== undefined);

      refScriptFee += BigInt(
        Math.ceil(calculateReferenceScriptFee(refScripts, this.params))
      );
    }

    fee += refScriptFee;

    if (fee > body.fee())
      throw new Error(
        `Insufficient transaction fee. Supplied: ${body.fee()}, Required: ${fee}`
      );

    netValue = V.sub(netValue, new Value(body.fee() + (body.donation() ?? 0n)));
    if (!V.empty(netValue))
      throw new Error(
        `Value not conserved. Leftover Value: ${netValue.coin()}, ${Array.from(
          netValue.multiasset()?.entries() ?? []
        )}`
      );

    this.acceptTransaction(tx);
    return txId;
  }

  private acceptTransaction(tx: Transaction) {
    const inputs = tx.body().inputs().values();
    const outputs = tx.body().outputs();
    const txId = tx.getId();

    this.#mempool[txId] = {
      inputs: new Set(inputs),
      outputs: new Set(
        outputs.map(
          (output, i) =>
            new TransactionUnspentOutput(
              new TransactionInput(txId, BigInt(i)),
              output!
            )
        )
      ),
    };

    const certs = tx.body().certs()?.values() ?? [];
    for (const cert of certs) {
      this.applyCertificate(cert);
    }

    const withdrawals: Map<RewardAccount, bigint> =
      tx.body().withdrawals() ?? new Map();
    for (const [rewardAccount, withdrawn] of withdrawals.entries()) {
      const account = this.getAccount(rewardAccount)!;
      account.balance -= withdrawn;
    }

    tx
      .witnessSet()
      .plutusData()
      ?.values()
      .forEach((datum) => {
        this.datumHashes[blake2b_256(datum.toCbor())] = datum;
      });

    this.applyGovernance(tx);

    this.feePot += tx.body().fee();
    this.treasury += tx.body().donation() ?? 0n;
  }

  private applyCertificate(cert: Certificate) {
    const core = cert.toCore() as CertificateCore;
    const certType = core.__typename;

    // Stake registrations
    if (isCertType(core, StakeRegistrationCertificateTypes)) {
      const rewardAccount = this.rewardAccount(core.stakeCredential);
      if (this.accounts.has(rewardAccount)) {
        throw new Error(
          `Stake key with reward address ${rewardAccount} is already registered.`
        );
      }
      const deposit = isLegacyStakeCertificate(core)
        ? BigInt(this.params.stakeKeyDeposit)
        : certificateDeposit(core);

      const newAccount: RegisteredAccount = { balance: 0n };
      this.accounts.set(rewardAccount, newAccount);
      this.depositPot += deposit;
    }

    // Stake deregistrations (all kinds)
    if (
      isCertType(core, RegAndDeregCertificateTypes) &&
      (certType === CertificateType.Unregistration ||
        certType === CertificateType.StakeDeregistration)
    ) {
      const rewardAccount = this.rewardAccount(core.stakeCredential);
      if (!this.accounts.has(rewardAccount)) {
        throw new Error(
          `Stake key with reward address ${rewardAccount} is not registered.`
        );
      }
      const deposit = isLegacyStakeCertificate(core)
        ? BigInt(this.params.stakeKeyDeposit)
        : certificateDeposit(core);
      this.accounts.delete(rewardAccount);
      this.depositPot -= deposit;
    }

    if (isCertType(core, StakeDelegationCertificateTypes)) {
      const acc = this.getAccount(core.stakeCredential);
      acc.poolId = core.poolId;
    }

    // Vote delegations (all kinds)
    if (isCertType(core, VoteDelegationCredentialCertificateTypes)) {
      const acc = this.getAccount(core.stakeCredential);
      acc.drep = DRep.fromCore(core.dRep);
    }

    // DRep certificates
    switch (certType) {
      case CertificateType.RegisterDelegateRepresentative: {
        const cred = core.dRepCredential;
        const keyHash = cred.hash;
        const existing = this.dreps[keyHash];
        if (existing?.isRegistered) {
          throw new Error("DRep is already registered.");
        }
        const providedDeposit = certificateDeposit(core);
        const expectedDeposit = BigInt(
          this.params.delegateRepresentativeDeposit ?? 0
        );
        const expiryEpoch = nextDrepExpiryEpoch(this.params, this.clock.epoch);

        if (!existing) {
          if (providedDeposit !== expectedDeposit) {
            throw new Error(
              `DRep deposit must equal ${expectedDeposit} for new registrations`
            );
          }
          this.dreps[keyHash] = {
            credential: cred,
            deposit: providedDeposit,
            anchor: core.anchor ?? undefined,
            expiryEpoch,
            isRegistered: true,
          };
          this.depositPot += providedDeposit;
        } else {
          if (providedDeposit !== 0n) {
            throw new Error("Re-registering DRep must not include a deposit.");
          }
          existing.isRegistered = true;
          existing.anchor = core.anchor ?? existing.anchor;
          existing.expiryEpoch = expiryEpoch;
        }
        break;
      }
      case CertificateType.UnregisterDelegateRepresentative: {
        const cred = core.dRepCredential;
        const keyHash = cred.hash;
        const drep = this.dreps[keyHash];
        if (!drep?.isRegistered) {
          throw new Error("DRep is not registered.");
        }
        this.depositPot -= BigInt(drep.deposit);
        drep.isRegistered = false;
        drep.expiryEpoch = undefined;
        const rewardAccount = this.rewardAccount(cred);
        const account = this.accounts.get(rewardAccount);
        if (account) account.balance += drep.deposit;
        break;
      }
      case CertificateType.UpdateDelegateRepresentative: {
        const cred = core.dRepCredential;
        const keyHash = cred.hash;
        const drep = this.dreps[keyHash];
        if (!drep?.isRegistered) throw new Error("DRep is not registered.");
        drep.anchor = core.anchor ?? undefined;
        break;
      }
    }

    // Committee and pool certificates
    switch (certType) {
      case CertificateType.AuthorizeCommitteeHot: {
        const coldHash = core.coldCredential.hash;
        if (!findCommitteeMemberByColdHash(this.cc.members, coldHash)) {
          throw new Error(
            "Committee cold credential not found for hot authorization"
          );
        }
        this.ccHotCredentials[coldHash] = core.hotCredential;
        break;
      }
      case CertificateType.ResignCommitteeCold: {
        this.cc.members = this.cc.members.filter(
          (m) => m.coldCredential.hash !== core.coldCredential.hash
        );
        delete this.ccHotCredentials[core.coldCredential.hash];
        break;
      }
      case CertificateType.PoolRegistration: {
        const poolParams = core.poolParameters;
        this.activePools[poolParams.id] = poolParams;

        break;
      }
      case CertificateType.PoolRetirement: {
        delete this.activePools[core.poolId];
        break;
      }
    }
  }

  private getAccount(
    accountAddr: CredentialCore | RewardAccount
  ): RegisteredAccount {
    if (typeof accountAddr === "object" && "type" in accountAddr) {
      accountAddr = this.rewardAccount(accountAddr);
    }
    const res = this.accounts.get(accountAddr);
    if (!res)
      throw new Error(
        `Account with reward address ${accountAddr} is not registered.`
      );
    return res;
  }

  private rewardAccount(cred: CredentialCore): RewardAccount {
    return RewardAccount.fromCredential(cred, NetworkId.Testnet);
  }

  private increaseProposalDepositStake(
    rewardAccount: RewardAccount,
    amount: bigint
  ): void {
    const current = this.proposalDepositsByAccount.get(rewardAccount) ?? 0n;
    this.proposalDepositsByAccount.set(rewardAccount, current + amount);
    const account = this.accounts.get(rewardAccount);
    if (account) {
      account.balance += amount;
    }
  }

  private decreaseProposalDepositStake(
    rewardAccount: RewardAccount,
    amount: bigint
  ): void {
    const current = this.proposalDepositsByAccount.get(rewardAccount) ?? 0n;
    if (current < amount) {
      throw new Error("Proposal deposit accounting underflow");
    }
    const next = current - amount;
    if (next === 0n) {
      this.proposalDepositsByAccount.delete(rewardAccount);
    } else {
      this.proposalDepositsByAccount.set(rewardAccount, next);
    }
    const account = this.accounts.get(rewardAccount);
    if (account) {
      account.balance = account.balance - amount;
      if (account.balance < 0n) account.balance = 0n;
    }
  }

  /**
   * Replaces the current constitutional committee and resets cached hot credentials.
   * Clearing the committee also clears the last enacted constitution per Conway §5.5.
   *
   * @param {Committee} committee - New committee configuration to apply.
   * @param {{ hotCredentials?: Record<string, CredentialCore | undefined> }} [options] - Optional map of cold hashes to hot credentials for immediate activation.
   * @returns {void}
   */
  public setCommitteeState(
    committee: Committee,
    {
      hotCredentials,
    }: { hotCredentials?: Record<string, CredentialCore | undefined> } = {}
  ): void {
    this.cc = committee;
    this.ccHotCredentials = {};
    for (const member of committee.members) {
      const coldHash = member.coldCredential.hash;
      const providedHot = hotCredentials?.[coldHash];
      this.ccHotCredentials[coldHash] = providedHot ?? undefined;
    }
    if (committee.members.length === 0) {
      this.constitution = {
        anchor: { url: "", dataHash: "" as Hash32ByteBase16 },
        scriptHash: null,
      };
    }
  }

  /**
   * Assigns or clears the active hot credential for a committee member.
   * Throws when the supplied cold credential hash is not part of the committee.
   *
   * @param {Hash28ByteBase16 | string} coldCredentialHash - Committee cold credential hash.
   * @param {CredentialCore} [credential] - Hot credential to assign; omit to clear.
   * @returns {void}
   */
  public setCommitteeHotCredential(
    coldCredentialHash: Hash28ByteBase16 | string,
    credential?: CredentialCore
  ): void {
    const hash =
      typeof coldCredentialHash === "string"
        ? Hash28ByteBase16(coldCredentialHash)
        : coldCredentialHash;
    if (!findCommitteeMemberByColdHash(this.cc.members, hash)) {
      throw new Error(
        "Committee cold credential not found for hot credential assignment"
      );
    }
    this.ccHotCredentials[hash] = credential;
  }

  /**
   * Retrieves the cached hot credential for the provided committee cold hash.
   *
   * @param {Hash28ByteBase16 | string} coldCredentialHash - Committee cold credential hash.
   * @returns {CredentialCore | undefined} The active hot credential, if registered.
   */
  public getCommitteeHotCredential(
    coldCredentialHash: Hash28ByteBase16 | string
  ): CredentialCore | undefined {
    const hash =
      typeof coldCredentialHash === "string"
        ? Hash28ByteBase16(coldCredentialHash)
        : coldCredentialHash;
    return this.ccHotCredentials[hash];
  }

  /**
   * Returns the lifecycle status for a governance action, if the emulator is tracking it.
   *
   * @param {GovernanceActionId | SerialisedGovId} actionId - Identifier of the governance action.
   * @returns {ProposalStatus | undefined} Current status if available.
   */
  public getGovernanceProposalStatus(
    actionId: GovernanceActionId | SerialisedGovId
  ): ProposalStatus | undefined {
    const key =
      typeof actionId === "string" ? actionId : serialiseGovId(actionId);
    return this.#proposals[key]?.status;
  }

  /**
   * Computes the latest ratification tallies for an action using the most recent stake snapshot.
   *
   * @param {GovernanceActionId | SerialisedGovId} actionId - Identifier of the governance action to inspect.
   * @returns {{ tallies: Tallies; activeCcMembers: bigint } | undefined} Tallies plus the count of active committee members, or undefined if unavailable.
   */
  public getTallies(actionId: GovernanceActionId | SerialisedGovId):
    | {
        tallies: Tallies;
        activeCcMembers: bigint;
      }
    | undefined {
    const key =
      typeof actionId === "string" ? actionId : serialiseGovId(actionId);
    const proposal = this.#proposals[key];
    if (!proposal) return undefined;
    const snapshot = this.snapshots[this.clock.epoch - 1];
    if (!snapshot) return undefined;
    return this.computeGovernanceTallies(proposal, snapshot);
  }

  private isValidCommitteeHotCredential(credential: CredentialCore): boolean {
    const hotEntry = Object.entries(this.ccHotCredentials).find(
      ([, hot]) => hot?.hash === credential.hash
    );
    if (!hotEntry) {
      return false;
    }
    const member = findCommitteeMemberByColdHash(
      this.cc.members,
      Hash28ByteBase16(hotEntry[0])
    );
    return Boolean(
      member && committeeMemberTermActive(member, this.clock.epoch)
    );
  }

  private onEpochBoundary(): void {
    this.govTrace(
      `Epoch ${this.clock.epoch} boundary. feePot=${this.feePot} depositPot=${this.depositPot} treasury=${this.treasury}`
    );
    if (this.feePot > 0n) {
      const treasuryShare = this.getCurrentTreasuryFeeShare();
      this.govTrace(
        `Distribute fees treasury=${treasuryShare}, stakers=${this.feePot - treasuryShare}`
      );
      // TODO (?): Handle stake rewards distribution
      this.treasury += treasuryShare;
      this.feePot = 0n;
    }

    // Governance epoch boundary processing
    this.createStakeSnapshot();
    this.ratifyGovernanceActions();
    this.enactGovernanceActions();
    this.expireDReps();
  }

  private applyGovernance(tx: Transaction): void {
    const body = tx.body();
    const txId = tx.getId();
    const currentEpoch = this.clock.epoch;
    const lifetime = this.params.governanceActionLifetime ?? 0;

    const proposalSet = body.proposalProcedures();
    if (proposalSet) {
      const proposals = proposalSet.values();
      this.govTrace(`Tx ${txId}: proposals=${proposals.length}`);
      for (let i = 0; i < proposals.length; i++) {
        const procedure = proposals[i]!;
        const gid = new GovernanceActionId(txId, BigInt(i));
        this.registerGovernanceProposal({
          actionId: gid,
          procedure,
          currentEpoch,
          lifetime,
        });
      }
    }

    const voting = body.votingProcedures();
    if (voting !== undefined) {
      const votingEntries = voting.toCore();
      this.govTrace(`Tx ${txId}: voters=${votingEntries.length}`);
      for (const { voter, votes } of votingEntries) {
        const voterObj = Voter.fromCore(voter);
        const voterKey = serialiseVoter(voterObj);
        for (const { actionId, votingProcedure } of votes) {
          const key = serialiseGovId(actionId);
          const proposal = this.#proposals[key];
          if (!proposal) {
            throw new Error(
              `Vote references unknown GovernanceActionId ${key}`
            );
          }
          this.assertBootstrapVoteAllowed(voterObj, proposal.procedure.kind());
          const voteValue = votingProcedure.vote;
          this.validateVote(voterObj, proposal, voteValue, currentEpoch);
          proposal.votes.set(voterKey, {
            voter: voterObj,
            vote: voteValue,
            anchor: votingProcedure.anchor ?? undefined,
            epoch: currentEpoch,
          });
          this.govTrace(`Vote for ${key}: voter=${voterKey} vote=${voteValue}`);
        }
      }
    }
  }

  private registerGovernanceProposal({
    actionId,
    procedure,
    currentEpoch,
    lifetime,
  }: {
    actionId: GovernanceActionId;
    procedure: ProposalProcedure;
    currentEpoch: number;
    lifetime: number;
  }): void {
    const key = serialiseGovId(actionId);
    if (key in this.#proposals) {
      throw new Error(`Duplicate governance action id ${key}`);
    }

    const deposit = BigInt(procedure.deposit());
    const expectedDeposit = BigInt(this.params.governanceActionDeposit ?? 0);
    if (deposit !== expectedDeposit) {
      throw new Error(
        `Invalid governance deposit: supplied ${procedure.deposit()} expected ${this.params.governanceActionDeposit ?? 0}`
      );
    }

    const rewardAccount = procedure.rewardAccount();
    if (RewardAccount.toNetworkId(rewardAccount) !== NetworkId.Testnet) {
      throw new Error("Proposal reward account network mismatch");
    }

    if (!this.accounts.has(rewardAccount)) {
      throw new Error(
        `Proposal reward account ${rewardAccount} is not registered`
      );
    }

    const kind = procedure.kind();
    this.assertBootstrapProposalAllowed(kind);
    this.validateGovernanceAction(procedure, currentEpoch);
    const previousId = this.extractPrevActionId(procedure);
    this.ensurePrevActionLink(kind, previousId);

    this.depositPot += deposit;
    if (deposit > 0n) {
      this.increaseProposalDepositStake(rewardAccount, deposit);
    }

    this.#proposals[key] = {
      procedure,
      submittedEpoch: currentEpoch,
      expiryEpoch: currentEpoch + lifetime,
      status: ProposalStatus.Active,
      deposit,
      votes: new Map(),
    };
    this.govTrace(
      `Registered proposal ${key} kind=${kind} expiry=${currentEpoch + lifetime}`
    );
  }

  private assertBootstrapProposalAllowed(kind: number): void {
    if (!this.bootstrapMode) return;
    if (
      [
        GovernanceActionKind.ParameterChange,
        GovernanceActionKind.HardForkInitiation,
        GovernanceActionKind.Info,
      ].includes(kind)
    ) {
      return;
    }
    throw new Error(
      `Governance action ${GovernanceActionKind[kind]} not allowed during bootstrap`
    );
  }

  private assertBootstrapVoteAllowed(voter: Voter, actionKind: number): void {
    if (!this.bootstrapMode) return;
    if (actionKind === GovernanceActionKind.Info) return;
    switch (voter.kind()) {
      case VoterKind.ConstitutionalCommitteeKeyHash:
      case VoterKind.ConstitutionalCommitteeScriptHash:
        return;
      case VoterKind.StakePoolKeyHash:
        if (actionKind === GovernanceActionKind.HardForkInitiation) return;
        break;
    }
    throw new Error(
      `Vote from ${VoterKind[voter.kind()]} not allowed during bootstrap`
    );
  }

  private validateGovernanceAction(
    procedure: ProposalProcedure,
    currentEpoch: number
  ): void {
    const kind = procedure.kind();
    switch (kind) {
      case GovernanceActionKind.ParameterChange: {
        const action = procedure.getParameterChangeAction();
        if (!action) {
          throw new Error("Malformed parameter change action");
        }
        const update = action.toCore().protocolParamUpdate;
        const hasChange = Object.values(update).some(
          (value) => value !== undefined && value !== null
        );
        if (!hasChange) {
          throw new Error(
            "Parameter change action must alter at least one parameter"
          );
        }
        const policyHash = action.policyHash();
        const expectedPolicy = this.constitution.scriptHash;
        if (expectedPolicy) {
          if (!policyHash || policyHash !== expectedPolicy) {
            throw new Error(
              "Parameter change policy hash must reference current proposal policy"
            );
          }
        } else if (policyHash) {
          throw new Error(
            "Parameter change policy hash must match current proposal policy"
          );
        }
        break;
      }
      case GovernanceActionKind.TreasuryWithdrawals: {
        const action = procedure.getTreasuryWithdrawalsAction();
        if (!action) throw new Error("Malformed treasury withdrawal action");
        for (const [rewardAccount, amount] of action.withdrawals().entries()) {
          if (amount <= 0n) {
            throw new Error("Treasury withdrawal amount must be positive");
          }
          if (!this.accounts.has(rewardAccount)) {
            throw new Error(
              `Treasury withdrawal references unknown reward account ${rewardAccount}`
            );
          }
        }
        break;
      }
      case GovernanceActionKind.UpdateCommittee: {
        const action = procedure.getUpdateCommittee();
        if (!action) throw new Error("Malformed committee update action");
        const removals = new Set(
          Array.from(action.membersToBeRemoved()).map((cred) => cred.hash)
        );
        for (const [credential, expiry] of action.membersToBeAdded()) {
          if (removals.has(credential.hash)) {
            throw new Error(
              "Committee update cannot add and remove the same credential"
            );
          }
          if (Number(expiry) <= currentEpoch) {
            throw new Error("Committee member term must end in the future");
          }
          const maxTerm = this.params.constitutionalCommitteeMaxTermLength;
          if (
            maxTerm !== undefined &&
            Number(expiry) > currentEpoch + maxTerm
          ) {
            throw new Error(
              "Committee member term exceeds maximum allowable duration"
            );
          }
        }
        break;
      }
      case GovernanceActionKind.NewConstitution: {
        if (!procedure.getNewConstitution()) {
          throw new Error("Malformed constitution update action");
        }
        break;
      }
      case GovernanceActionKind.HardForkInitiation: {
        if (!procedure.getHardForkInitiationAction()) {
          throw new Error("Malformed hard fork action");
        }
        break;
      }
      case GovernanceActionKind.NoConfidence: {
        if (!procedure.getNoConfidence()) {
          throw new Error("Malformed no confidence action");
        }
        break;
      }
      case GovernanceActionKind.Info:
        break;
      default:
        throw new Error(`Unhandled governance action kind ${kind}`);
    }
  }

  private extractPrevActionId(
    procedure: ProposalProcedure
  ): GovernanceActionId | undefined {
    switch (procedure.kind()) {
      case GovernanceActionKind.ParameterChange:
        return procedure.getParameterChangeAction()?.govActionId();
      case GovernanceActionKind.HardForkInitiation:
        return procedure.getHardForkInitiationAction()?.govActionId();
      case GovernanceActionKind.NoConfidence:
        return procedure.getNoConfidence()?.govActionId();
      case GovernanceActionKind.UpdateCommittee:
        return procedure.getUpdateCommittee()?.govActionId();
      case GovernanceActionKind.NewConstitution:
        return procedure.getNewConstitution()?.govActionId();
      default:
        return undefined;
    }
  }

  private ensurePrevActionLink(
    kind: GovernanceActionKind,
    prevActionId?: GovernanceActionId
  ): void {
    if (
      kind === GovernanceActionKind.Info ||
      kind === GovernanceActionKind.TreasuryWithdrawals
    ) {
      return;
    }
    const expected = this.lastEnactedActionByKind[kind];
    if (expected) {
      if (!prevActionId) {
        throw new Error(
          `Governance action ${GovernanceActionKind[kind]} must reference last enacted action`
        );
      }
      const serialised = serialiseGovId(prevActionId.toCore());
      if (serialised !== expected) {
        throw new Error(
          `Governance action ${GovernanceActionKind[kind]} must reference ${expected}, received ${serialised}`
        );
      }
      return;
    }
    if (prevActionId) {
      const serialised = serialiseGovId(prevActionId.toCore());
      if (!(serialised in this.#proposals)) {
        throw new Error(
          `Governance action ${GovernanceActionKind[kind]} references unknown action ${serialised}`
        );
      }
    }
  }

  private validateVote(
    voter: Voter,
    proposal: GovProposal,
    vote: Vote,
    currentEpoch: number
  ): void {
    if (proposal.status !== ProposalStatus.Active) {
      throw new Error("Cannot vote on inactive governance action");
    }

    switch (voter.kind()) {
      case VoterKind.DrepKeyHash:
      case VoterKind.DRepScriptHash: {
        const cred = voter.toDrepCred();
        if (!cred) throw new Error("Missing DRep credential for vote");
        const keyHash = cred.hash;
        const state = this.dreps[keyHash];
        if (!state?.isRegistered) {
          throw new Error("Vote cast by unregistered DRep");
        }
        state.expiryEpoch = nextDrepExpiryEpoch(this.params, currentEpoch);
        break;
      }
      case VoterKind.ConstitutionalCommitteeKeyHash:
      case VoterKind.ConstitutionalCommitteeScriptHash: {
        const cred = voter.toConstitutionalCommitteeHotCred();
        if (!cred || !this.isValidCommitteeHotCredential(cred)) {
          throw new Error("Committee voter is not authorized");
        }
        break;
      }
      case VoterKind.StakePoolKeyHash: {
        const keyHash = voter.toStakingPoolKeyHash();
        if (!keyHash || !this.isKnownStakePool(keyHash)) {
          throw new Error("Stake pool voter is not recognized");
        }
        break;
      }
      default:
        throw new Error("Unknown voter kind");
    }

    if (!Object.values(Vote).includes(vote)) {
      throw new Error("Unsupported vote value");
    }
  }

  /**
   * Calculates the treasury's share of accumulated fees based on the current parameters.
   *
   * @returns {bigint} Amount of fees allocated to the treasury.
   */
  getCurrentTreasuryFeeShare(): bigint {
    return BigInt(
      Math.floor(
        Number(this.feePot) * parseFloat(this.params.treasuryExpansion)
      )
    );
  }

  isKnownStakePool(keyHash: Ed25519KeyHashHex): boolean {
    const poolId = toPoolIdKey(keyHash);
    if (!poolId) return false;
    const key = poolId;
    return this.activePools[key] !== undefined;
  }

  private createStakeSnapshot(): void {
    const snapshot = buildStakeSnapshot(this.accounts);

    this.snapshots[this.clock.epoch] = snapshot;
    const drepTotal = Object.values(snapshot.drepDelegation).reduce(
      (a, b) => a + b,
      0n
    );
    const spoTotal = Object.values(snapshot.spoDelegation).reduce(
      (a, b) => a + b,
      0n
    );
    this.govTrace(
      `Snapshot epoch=${this.clock.epoch}: drepTotal=${drepTotal} spoTotal=${spoTotal} drepKeys=${Object.keys(snapshot.drepDelegation).length} spoKeys=${Object.keys(snapshot.spoDelegation).length}`
    );
  }

  private computeGovernanceTallies(
    proposal: GovProposal,
    snapshot: StakeSnapshot
  ): { tallies: Tallies; activeCcMembers: bigint } {
    const drepVotes = new Map<string, Vote>();
    const spoVotes = new Map<PoolId, Vote>();
    const ccVotes = new Map<string, Vote>();

    for (const record of proposal.votes.values()) {
      switch (record.voter.kind()) {
        case VoterKind.DrepKeyHash:
        case VoterKind.DRepScriptHash: {
          const cred = record.voter.toDrepCred();
          if (!cred) break;
          const key = serialiseDrepCredential(cred);
          drepVotes.set(key, record.vote);
          break;
        }
        case VoterKind.StakePoolKeyHash: {
          const keyHash = record.voter.toStakingPoolKeyHash();
          if (!keyHash) break;
          const poolId = PoolId.fromKeyHash(Ed25519KeyHashHex(keyHash));
          spoVotes.set(poolId, record.vote);
          break;
        }
        case VoterKind.ConstitutionalCommitteeKeyHash:
        case VoterKind.ConstitutionalCommitteeScriptHash: {
          const cred = record.voter.toConstitutionalCommitteeHotCred();
          if (!cred) break;
          ccVotes.set(cred.hash, record.vote);
          break;
        }
      }
    }

    const tallies: Tallies = {
      drep: { yes: 0n, no: 0n },
      spo: { yes: 0n, no: 0n },
      cc: { yes: 0n, no: 0n },
    };

    for (const [drepId, stake] of Object.entries(snapshot.drepDelegation)) {
      const vote = drepVotes.get(drepId) ?? Vote.no;
      if (vote === Vote.yes) tallies.drep.yes += stake;
      else if (vote === Vote.no) tallies.drep.no += stake;
    }

    const actionKind = proposal.procedure.kind();
    for (const [poolId, stake] of Object.entries(snapshot.spoDelegation)) {
      const vote = this.resolveStakePoolVote(
        PoolId(poolId),
        spoVotes,
        actionKind
      );
      if (vote === Vote.yes) tallies.spo.yes += stake;
      else if (vote === Vote.no) tallies.spo.no += stake;
    }

    const activeMembers = this.cc.members.filter((member) =>
      committeeMemberTermActive(member, this.clock.epoch)
    );
    for (const member of activeMembers) {
      const hot = this.ccHotCredentials[member.coldCredential.hash];
      let vote: Vote | undefined;
      if (hot?.hash) {
        vote = ccVotes.get(hot.hash) ?? Vote.no;
      } else {
        vote = Vote.abstain;
      }
      if (vote === Vote.yes) tallies.cc.yes += 1n;
      else if (vote === Vote.no) tallies.cc.no += 1n;
    }

    return {
      tallies,
      activeCcMembers: BigInt(activeMembers.length),
    };
  }

  private resolveStakePoolVote(
    poolId: PoolId,
    spoVotes: Map<PoolId, Vote>,
    actionKind: GovernanceActionKind
  ): Vote {
    const explicitVote = spoVotes.get(poolId);
    if (explicitVote !== undefined) {
      return explicitVote;
    }
    return this.defaultStakePoolVote(poolId, actionKind);
  }

  private defaultStakePoolVote(
    poolId: PoolId,
    actionKind: GovernanceActionKind
  ): Vote {
    if (this.bootstrapMode) {
      return Vote.abstain;
    }
    const key = poolId;
    const pool = this.activePools[key];
    if (!pool) {
      return Vote.no;
    }
    const operatorAccount = this.accounts.get(pool.rewardAccount);
    const operatorDrep = operatorAccount?.drep;
    const drepKind = operatorDrep?.kind?.();
    if (drepKind === undefined) {
      return Vote.no;
    }
    if (drepKind === DREP_KIND_ABSTAIN) {
      return Vote.abstain;
    }
    if (
      drepKind === DREP_KIND_NO_CONFIDENCE &&
      actionKind === GovernanceActionKind.NoConfidence
    ) {
      return Vote.yes;
    }
    return Vote.no;
  }

  private canRatifyTreasuryWithdrawal(proposal: GovProposal): boolean {
    const action = proposal.procedure.getTreasuryWithdrawalsAction();
    if (!action) return false;
    let total = 0n;
    for (const amount of action.withdrawals().values()) {
      total += amount;
    }
    return total <= this.treasury;
  }

  private ratifyGovernanceActions(): void {
    const currentEpoch = this.clock.epoch;
    const snapshot = this.snapshots[currentEpoch - 1]; // Use previous epoch's snapshot

    if (!snapshot) {
      this.govTrace(`No snapshot for epoch ${currentEpoch - 1}; skip RATIFY`);
      return;
    }

    if (
      this.delayingActionBarrierUntil !== undefined &&
      currentEpoch >= this.delayingActionBarrierUntil
    ) {
      this.delayingActionBarrierUntil = undefined;
    }

    for (const [actionId, proposal] of Object.entries(this.#proposals)) {
      if (proposal.status !== ProposalStatus.Active) continue;

      const kind = proposal.procedure.kind();

      if (
        this.delayingActionBarrierUntil !== undefined &&
        currentEpoch < this.delayingActionBarrierUntil &&
        !isDelayingAction(kind)
      ) {
        this.govTrace(
          `Proposal ${actionId} delayed until epoch ${this.delayingActionBarrierUntil}`
        );
        continue;
      }

      // Check if proposal has expired
      if (proposal.expiryEpoch <= currentEpoch) {
        proposal.status = ProposalStatus.Expired;
        this.refundProposalDeposit(proposal);
        continue;
      }

      const { tallies, activeCcMembers } = this.computeGovernanceTallies(
        proposal,
        snapshot
      );

      this.govTrace(
        `Tallies ${actionId}: drep(y=${tallies.drep.yes},n=${tallies.drep.no}) spo(y=${tallies.spo.yes},n=${tallies.spo.no}) cc(y=${tallies.cc.yes},n=${tallies.cc.no})`
      );

      const isRatified = this.checkRatificationThresholds(
        proposal,
        tallies,
        activeCcMembers
      );

      if (isRatified) {
        proposal.status = ProposalStatus.Ratified;
        this.enactQueue.push({
          actionId: actionId as SerialisedGovId,
          enactAtEpoch: currentEpoch,
        });
        this.govTrace(`Proposal ${actionId} ratified`);
      } else {
        this.govTrace(`Proposal ${actionId} not ratified; stays Active`);
      }
    }
  }

  private enactGovernanceActions(): void {
    const currentEpoch = this.clock.epoch;
    const remainingQueue: EnactQueueItem[] = [];
    let delayingActionTriggered = false;

    for (const item of this.enactQueue) {
      if (item.enactAtEpoch !== currentEpoch) {
        remainingQueue.push(item);
        continue;
      }
      const proposal = this.#proposals[item.actionId];
      if (!proposal) continue;

      const kind = proposal.procedure.kind();
      if (delayingActionTriggered) {
        item.enactAtEpoch = currentEpoch + 1;
        remainingQueue.push(item);
        continue;
      }

      const enacted = this.applyGovernanceEffect(item.actionId, proposal);
      if (!enacted) {
        item.enactAtEpoch = currentEpoch + 1;
        remainingQueue.push(item);
        continue;
      }

      proposal.status = ProposalStatus.Enacted;
      this.refundProposalDeposit(proposal);

      if (isDelayingAction(kind)) {
        delayingActionTriggered = true;
        this.delayingActionBarrierUntil = currentEpoch + 1;
        this.govTrace(
          `Delaying subsequent governance actions until epoch ${this.delayingActionBarrierUntil}`
        );
      }
    }

    this.enactQueue = remainingQueue;
  }

  private expireDReps(): void {
    const maxIdleTime = this.params.delegateRepresentativeMaxIdleTime;
    if (!maxIdleTime) return;

    const currentEpoch = this.clock.epoch;
    for (const drep of Object.values(this.dreps)) {
      if (
        drep.isRegistered &&
        drep.expiryEpoch !== undefined &&
        currentEpoch > drep.expiryEpoch
      ) {
        drep.isRegistered = false;
        // Refund deposit would be handled here if we track it separately
      }
    }
  }

  private getActionThresholds(proposal: GovProposal): {
    drep?: Fraction;
    spo?: Fraction;
  } {
    const kind = proposal.procedure.kind();
    if (
      !this.params.delegateRepresentativeVotingThresholds ||
      !this.params.stakePoolVotingThresholds
    ) {
      throw new Error(
        "Trying to enact governance action without full conway parameters"
      );
    }
    const dRepThresh = this.params.delegateRepresentativeVotingThresholds;
    const spoThresh = this.params.stakePoolVotingThresholds;

    switch (kind) {
      case GovernanceActionKind.NoConfidence:
        return {
          drep: dRepThresh.motionNoConfidence,
          spo: spoThresh.motionNoConfidence,
        };
      case GovernanceActionKind.HardForkInitiation:
        return {
          drep: dRepThresh.hardForkInitiation,
          spo: spoThresh.hardForkInitiation,
        };
      case GovernanceActionKind.ParameterChange: {
        const update =
          proposal.procedure.getParameterChangeAction()?.toCore()
            .protocolParamUpdate ?? {};
        const groups = identifyParameterGroups(update);
        const drepGroups = Array.from(groups).filter((group) =>
          [
            "NetworkGroup",
            "EconomicGroup",
            "TechnicalGroup",
            "GovernanceGroup",
          ].includes(group)
        ) as Array<
          | "NetworkGroup"
          | "EconomicGroup"
          | "TechnicalGroup"
          | "GovernanceGroup"
        >;
        if (drepGroups.length === 0) {
          throw new Error(
            "Parameter change must impact at least one parameter group"
          );
        }
        const drepFraction = fractionMax(
          ...drepGroups.map((group) => {
            switch (group) {
              case "NetworkGroup":
                return dRepThresh.ppNetworkGroup;
              case "EconomicGroup":
                return dRepThresh.ppEconomicGroup;
              case "TechnicalGroup":
                return dRepThresh.ppTechnicalGroup;
              case "GovernanceGroup":
                return dRepThresh.ppGovernanceGroup;
            }
          })
        );
        const spoFraction = groups.has("SecurityGroup")
          ? spoThresh.securityRelevantParamVotingThreshold
          : undefined;
        this.govTrace(
          `Thresholds ParamChange drep=${JSON.stringify(
            drepFraction
          )} spo=${JSON.stringify(spoFraction)} groups=${JSON.stringify(
            Array.from(groups)
          )}`
        );
        return {
          drep: drepFraction,
          spo: spoFraction,
        };
      }
      case GovernanceActionKind.TreasuryWithdrawals:
        return {
          drep: dRepThresh.treasuryWithdrawal,
          spo: spoThresh.committeeNormal,
        };
      case GovernanceActionKind.UpdateCommittee:
        return {
          drep: dRepThresh.committeeNormal,
          spo: spoThresh.committeeNormal,
        };
      case GovernanceActionKind.NewConstitution:
        return {
          drep: dRepThresh.updateConstitution,
        };
      case GovernanceActionKind.Info:
        return {
          drep: { numerator: 2, denominator: 1 },
          spo: { numerator: 2, denominator: 1 },
        };
      default:
        return {};
    }
  }

  private checkRatificationThresholds(
    proposal: GovProposal,
    tallies: Tallies,
    activeCcMembers: bigint
  ): boolean {
    const kind = proposal.procedure.kind();
    if (this.bootstrapMode) {
      if (
        kind !== GovernanceActionKind.ParameterChange &&
        kind !== GovernanceActionKind.Info &&
        kind !== GovernanceActionKind.HardForkInitiation
      ) {
        return false;
      }
    }

    if (
      kind === GovernanceActionKind.TreasuryWithdrawals &&
      !this.canRatifyTreasuryWithdrawal(proposal)
    ) {
      this.govTrace(
        "Treasury withdrawal cannot be ratified: insufficient treasury balance"
      );
      return false;
    }

    const { drep, spo } = this.getActionThresholds(proposal);

    let drepPass = fractionAtLeast(tallies.drep.yes, tallies.drep.no, drep);
    let spoPass = fractionAtLeast(tallies.spo.yes, tallies.spo.no, spo);

    // CC quorum: yes votes against total committee members
    const ccMembers = activeCcMembers;
    const quorum = this.cc.quorumThreshold;
    const minSize = this.params.constitutionalCommitteeMinSize;
    let ccPass = true;
    if (
      kind !== GovernanceActionKind.UpdateCommittee &&
      kind !== GovernanceActionKind.NoConfidence &&
      quorum !== undefined
    ) {
      if (
        (minSize !== undefined && ccMembers < BigInt(minSize)) ||
        ccMembers === 0n
      ) {
        ccPass = false;
      } else {
        ccPass =
          tallies.cc.yes * BigInt(quorum.denominator) >=
          BigInt(quorum.numerator) * ccMembers;
      }
    }

    if (this.bootstrapMode) {
      drepPass = true;
      spoPass = true;
    }

    const pass = drepPass && spoPass && ccPass;
    this.govTrace(
      `Check kind=${kind} drepPass=${drepPass} spoPass=${spoPass} ccPass=${ccPass} (ccMembers=${ccMembers}) => pass=${pass}`
    );
    return pass;
  }

  private applyGovernanceEffect(
    actionId: SerialisedGovId,
    proposal: GovProposal
  ): boolean {
    const actionKind = proposal.procedure.kind();

    switch (actionKind) {
      case GovernanceActionKind.ParameterChange: {
        const paramChange = proposal.procedure.getParameterChangeAction();
        if (paramChange) {
          const updates = paramChange.toCore().protocolParamUpdate;
          if (updates.minFeeRefScriptCostPerByte) {
            this.params.minFeeRefScriptCostPerByte = Number(
              updates.minFeeRefScriptCostPerByte
            );
            delete updates.minFeeRefScriptCostPerByte;
          }
          this.params = {
            ...this.params,
            ...(updates as ProtocolParameters),
            ...(updates.costModels && {
              costModels: {
                ...this.params.costModels,
                ...updates.costModels,
              },
            }),
          };
        }
        break;
      }
      case GovernanceActionKind.HardForkInitiation: {
        // No-op in emulator
        break;
      }
      case GovernanceActionKind.TreasuryWithdrawals: {
        const treasuryAction =
          proposal.procedure.getTreasuryWithdrawalsAction();
        if (treasuryAction) {
          const withdrawals = Array.from(
            treasuryAction.withdrawals().entries()
          );
          const total = withdrawals.reduce(
            (sum, [, amount]) => sum + amount,
            0n
          );
          if (total > this.treasury) {
            this.govTrace(
              `Enactment blocked for ${actionId}: treasury shortfall ${total - this.treasury}`
            );
            return false;
          }
          this.govTrace(
            `Enacting treasury withdrawal total=${total} treasuryBefore=${this.treasury} recipients=${withdrawals.length}`
          );
          this.treasury -= total;
          for (const [rewardAccount, amount] of withdrawals) {
            const account = this.accounts.get(rewardAccount);
            if (account) {
              account.balance += amount;
            }
          }
        }
        break;
      }
      case GovernanceActionKind.UpdateCommittee: {
        const committeeUpdate = proposal.procedure.getUpdateCommittee();
        if (committeeUpdate) {
          const update = committeeUpdate.toCore();
          const membersToRemove = new Set(
            Array.from(update.membersToBeRemoved.values()).map(
              (cred) => cred.hash
            )
          );
          this.cc.members = this.cc.members.filter(
            (member) => !membersToRemove.has(member.coldCredential.hash)
          );
          for (const hash of membersToRemove) {
            delete this.ccHotCredentials[hash];
          }
          const additions = Array.from(update.membersToBeAdded.values());
          this.cc.members.push(...additions);
          for (const member of additions) {
            this.ccHotCredentials[member.coldCredential.hash] = undefined;
          }
          this.cc.quorumThreshold = update.newQuorumThreshold;
        }
        break;
      }
      case GovernanceActionKind.NewConstitution: {
        const newConstitution = proposal.procedure.getNewConstitution();
        if (newConstitution) {
          this.constitution = newConstitution.toCore().constitution;
          const scriptHash = this.constitution.scriptHash;
          if (scriptHash !== null) {
            for (const member of this.cc.members) {
              this.ccHotCredentials[member.coldCredential.hash] = undefined;
            }
          }
        }
        break;
      }
      case GovernanceActionKind.Info: {
        // No state change required
        break;
      }
    }

    if (
      actionKind !== GovernanceActionKind.Info &&
      actionKind !== GovernanceActionKind.TreasuryWithdrawals
    ) {
      this.lastEnactedActionByKind[actionKind] = actionId;
    }
    this.govTrace(
      `Enacted action ${actionId} (${GovernanceActionKind[actionKind]})`
    );
    return true;
  }

  private refundProposalDeposit(proposal: GovProposal): void {
    const deposit = proposal.deposit;
    if (deposit === 0n) return;
    this.depositPot =
      this.depositPot >= deposit ? this.depositPot - deposit : 0n;
    this.decreaseProposalDepositStake(
      proposal.procedure.rewardAccount(),
      deposit
    );
  }
}
