import {
  type ProtocolParameters,
  TransactionOutput,
  type Transaction,
  type ScriptHash,
  type Evaluator,
  type Hash32ByteBase16,
  type DatumHash,
  type PlutusData,
  type CredentialCore,
  type SlotConfig,
  getBurnAddress,
  type Script,
  Datum,
  Slot,
  CertificateType,
  PoolId,
  DRep,
  Certificate,
  GovernanceActionId,
  ProposalProcedure,
  Vote,
  Voter,
  Ed25519KeyHashHex,
  ConstitutionCore,
  type AnchorCore,
  VoterKind,
  GovernanceActionKind,
  Committee,
  Fraction,
  VoterCore,
  DelegateRepresentativeThresholds,
  PoolVotingThresholds,
  type CertificateCore,
  StakeRegistrationCertificateTypes,
  StakeDelegationCertificateTypes,
  RegAndDeregCertificateTypes,
  StakeCredentialCertificateTypes,
  VoteDelegationCredentialCertificateTypes,
  isCertType,
  StakeAddressCertificate,
  PoolParameters,
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
  Bip32PrivateKey,
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
import { EmulatorProvider } from "./provider";

enum ProposalStatus {
  Active = "Active",
  Ratified = "Ratified",
  Enacted = "Enacted",
  Rejected = "Rejected",
  Expired = "Expired",
}

export class LedgerTimer {
  zeroTime: number;
  zeroSlot: number;
  block: number;
  slot: number;
  time: number;
  slotLength: number;
  slotsPerEpoch: number;
  epoch: number;

  constructor(
    slotConfig: SlotConfig = { zeroTime: 0, zeroSlot: 0, slotLength: 1000 },
    slotsPerEpoch: number = 432000,
  ) {
    this.block = 0;
    this.slot = slotConfig.zeroSlot;
    this.zeroSlot = slotConfig.zeroSlot;
    this.zeroTime = slotConfig.zeroTime;
    this.time = slotConfig.zeroTime;
    this.slotLength = slotConfig.slotLength;
    this.slotsPerEpoch = slotsPerEpoch;
    this.epoch = Math.floor((this.slot - this.zeroSlot) / this.slotsPerEpoch);
  }
}

type SerialisedInput = `${TransactionId}:${bigint}`;
type SerialisedGovId = `${TransactionId}:${bigint}`;

const isStakeAddressCertificate = (
  cert: CertificateCore,
): cert is StakeAddressCertificate => {
  return (
    cert.__typename === CertificateType.StakeRegistration ||
    cert.__typename === CertificateType.StakeDeregistration
  );
};

const objectHasAnyKeys = <T extends Record<string, unknown>>(
  obj: T,
  ...keys: (keyof T)[]
) => {
  return keys.some((key) => key in obj);
};

const fractionMax = (...fractions: Fraction[]) => {
  return fractions.reduce(
    (max, fraction) => {
      return fraction.numerator / fraction.denominator >
        max.numerator / max.denominator
        ? fraction
        : max;
    },
    { numerator: 0, denominator: 1 },
  );
};

const serialiseInput = (input: TransactionInput): SerialisedInput =>
  `${input.transactionId()}:${input.index()}`;

const serialiseGovId = (
  id: GovernanceActionId | ReturnType<GovernanceActionId["toCore"]>,
): SerialisedGovId => {
  if ("toCore" in id) {
    id = id.toCore();
  }
  return `${id.id}:${BigInt(id.actionIndex)}`;
};

const deserialiseInput = (input: SerialisedInput): TransactionInput => {
  const [txId, index] = input.split(":");
  return new TransactionInput(TransactionId(txId!), BigInt(index!));
};

interface RegisteredAccount {
  balance: bigint;
  poolId?: PoolId;
  drep?: DRep;
}

export interface EmulatorOptions {
  params?: ProtocolParameters;
  evaluator?: Evaluator;
  slotConfig?: SlotConfig;
  trace?: boolean;
  slotsPerEpoch?: number;
  treasury?: bigint;
  cc?: Committee;
}

interface GovProposal {
  procedure: ProposalProcedure;
  submittedEpoch: number;
  expiryEpoch: number;
  status: ProposalStatus;
  votes: Array<{
    voter: Voter;
    vote: Vote;
  }>;
}

interface DRepState {
  credential: CredentialCore;
  deposit: bigint;
  anchor?: AnchorCore;
  lastActiveEpoch: number;
  isRegistered: boolean;
}

type SerializedDRep = HexBlob;

interface StakeSnapshot {
  drepDelegation: Record<SerializedDRep, bigint>;
  spoDelegation: Record<PoolId, bigint>;
}

interface Tally {
  yes: bigint;
  no: bigint;
}
type Tallies = Record<"drep" | "spo" | "cc", Tally>;

interface EnactQueueItem {
  actionId: SerialisedGovId;
  enactAtEpoch: number;
}

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

  treasury: bigint;
  depositPot: bigint = 0n;
  feePot: bigint = 0n;

  // Governance state
  dreps: Record<Hash28ByteBase16, DRepState> = {};
  cc: Committee;
  constitution: ConstitutionCore = {
    anchor: { url: "", dataHash: "" as Hash32ByteBase16 },
    scriptHash: null,
  };
  snapshots: Record<number, StakeSnapshot> = {};
  enactQueue: EnactQueueItem[] = [];
  bootstrapMode: boolean = true;
  activePools: Record<PoolId, PoolParameters> = {};
  private govTraceEnabled: boolean = false;

  private govTrace(...args: unknown[]) {
    if (this.govTraceEnabled) console.debug("[GOV]", ...args);
  }

  /**
   * Constructs a new instance of the Emulator class.
   * Initializes the ledger with the provided genesis outputs and parameters.
   *
   * @param {TransactionOutput[]} genesisOutputs - The genesis outputs to initialize the ledger with.
   * @param {ProtocolParameters} [params=hardCodedProtocolParams] - The parameters to initialize the emulator with.
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
    }: EmulatorOptions = {},
  ) {
    this.cc = cc;
    this.#nextGenesisUtxo = 0;
    for (let i = 0; i < genesisOutputs.length; i++) {
      const txIn = new TransactionInput(
        TransactionId("00".repeat(32)),
        BigInt(this.#nextGenesisUtxo),
      );
      this.#nextGenesisUtxo += 1;
      this.#ledger[serialiseInput(txIn)] = genesisOutputs[i]!;
    }
    this.clock = new LedgerTimer(slotConfig, slotsPerEpoch);
    this.treasury = treasury;
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
        },
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

  public async register(
    label: string,
    value?: Value,
    datum?: PlutusData,
  ): Promise<Address> {
    await this.fund(label, value, datum);
    const wallet = await this.getOrAddWallet(label);
    return wallet.getChangeAddress();
  }

  public async addressOf(label: string): Promise<Address> {
    const wallet = await this.getOrAddWallet(label);
    return wallet.getChangeAddress();
  }

  public async fund(label: string, value?: Value, datum?: PlutusData) {
    const wallet = await this.getOrAddWallet(label);
    const output = new TransactionOutput(
      await wallet.getChangeAddress(),
      value ?? makeValue(100_000_000n),
    );
    if (datum) {
      output.setDatum(Datum.newInlineData(datum));
    }
    this.addUtxo(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId("00".repeat(32)),
          BigInt(this.#nextGenesisUtxo),
        ),
        output,
      ),
    );
    this.#nextGenesisUtxo += 1;
  }

  public async as<T = void>(
    label: string,
    callback: (blaze: Blaze<Provider, Wallet>, address: Address) => Promise<T>,
  ): Promise<T> {
    const provider = new EmulatorProvider(this);
    const wallet = await this.getOrAddWallet(label);
    const blaze = await Blaze.from(provider, wallet);
    return callback(blaze, await wallet.getChangeAddress());
  }

  public async publishScript(script: Script) {
    const utxo = new TransactionOutput(
      getBurnAddress(NetworkId.Testnet),
      makeValue(5_000_001n),
    );
    utxo.setScriptRef(script);
    this.addUtxo(
      new TransactionUnspentOutput(
        new TransactionInput(
          TransactionId("00".repeat(32)),
          BigInt(this.#nextGenesisUtxo),
        ),
        utxo,
      ),
    );
    this.#nextGenesisUtxo += 1;
  }

  public lookupScript(script: Script): TransactionUnspentOutput {
    for (const utxo of this.utxos()) {
      if (utxo.output().scriptRef()?.hash() === script.hash()) {
        return utxo;
      }
    }
    throw new Error("Script not published");
  }

  public async expectValidTransaction(
    blaze: Blaze<Provider, Wallet>,
    tx: TxBuilder,
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

  public async expectValidMultisignedTransaction(
    signers: string[],
    tx: TxBuilder,
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

  unixToSlot(unix_millis: bigint | number): Slot {
    return Slot(
      Math.ceil(
        (Number(unix_millis) - this.clock.zeroTime) / this.clock.slotLength,
      ),
    );
  }
  slotToUnix(slot: Slot | number | bigint): number {
    return Number(slot.valueOf()) * this.clock.slotLength + this.clock.zeroTime;
  }

  stepForwardToSlot(slot: number | bigint) {
    if (Number(slot) <= this.clock.slot) {
      throw new Error("Time travel is unsafe");
    }
    const prevEpoch = this.clock.epoch;
    this.clock.slot = Number(slot);
    this.clock.block = Math.ceil(Number(slot) / 20);
    this.clock.time = this.slotToUnix(slot);
    this.clock.epoch = Math.floor(
      (this.clock.slot - this.clock.zeroSlot) / this.clock.slotsPerEpoch,
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

  public stepForwardToNextEpoch(): void {
    const nextEpochSlot =
      (this.clock.epoch + 1) * this.clock.slotsPerEpoch + this.clock.zeroSlot;
    this.stepForwardToSlot(nextEpochSlot);
  }

  stepForwardToUnix(unix: number | bigint) {
    this.stepForwardToSlot(this.unixToSlot(unix));
  }

  stepForwardBlock(): void {
    this.stepForwardToSlot(this.clock.slot + 20);
  }

  awaitTransactionConfirmation(txId: TransactionId) {
    if (this.#mempool[txId]) {
      this.stepForwardBlock();
    }
  }

  /**
   * Starts the event loop for the ledger.
   * If the event loop is already running, it is cleared and restarted.
   * The event loop calls the stepForwardBlock method every 20 slots.
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
    this.#ledger[serialiseInput(utxo.input())] = utxo.output();
  }

  /**
   * Removes a given UTxO from the Emulator's ledger by input.
   *
   * @param inp - The input to remove from the ledger.
   */
  removeUtxo(inp: TransactionInput): void {
    delete this.#ledger[serialiseInput(inp)];
  }

  /**
   * Retrieves an output from the ledger by input.
   *
   * @param inp - The input to retrieve the output for.
   * @returns The output corresponding to the input, or undefined if the input is not found.
   */
  getOutput(inp: TransactionInput): TransactionOutput | undefined {
    // Should utxos in the mempool be considered?
    return this.#ledger[serialiseInput(inp)];
  }

  /**
   * Retrieves the Emulator's ledger as an array of UTxOs.
   * @returns The full list of UTxOs in the Emulator's ledger.
   */
  utxos(): TransactionUnspentOutput[] {
    return (
      Object.entries(this.#ledger) as [SerialisedInput, TransactionOutput][]
    ).map(([key, value]) => {
      return new TransactionUnspentOutput(deserialiseInput(key), value);
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
   *   - Balance Inputs/Outputs: Ensure that inputs/outputs are accurately balanced.
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
      if (nativeHashes.has(hash)) {
        consumed.add(hash);
      } else if (plutusHashes.has(hash)) {
        const hasRedeemer = redeemers.some(
          (r) => r.tag() === redeemerTag && r.index() === redeemerIndex,
        );

        if (!hasRedeemer) {
          throw new Error(
            `Script (hash ${hash}) was found but without a redeemer.`,
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
      redeemerIndex?: bigint,
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

    if (
      collateral?.length &&
      collateral.length > this.params.maxCollateralInputs
    )
      throw new Error(
        `Collateral inputs exceed the maximum allowed. Provided: ${collateral?.length}, Maximum: ${this.params.maxCollateralInputs}`,
      );

    const usedInputs: TransactionUnspentOutput[] = [];

    const refInputs = body.referenceInputs()?.values();
    const inputs = body.inputs().values();

    // Collect hashes
    [...inputs, ...(refInputs ?? [])].forEach((input) => {
      const out = this.getOutput(input);

      if (!out) {
        throw new Error(
          `Input ${JSON.stringify(input.toCore())} not found in the ledger.`,
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
          Number(a.index() - b.index()),
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
            ref.index() === input.index(),
        ),
      )
    ) {
      throw new Error("Inputs and reference inputs must be disjoint.");
    }

    // Minimum collateral amount included
    const minCollateral = BigInt(
      Math.ceil((this.params.collateralPercentage / 100) * Number(body.fee())),
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
            `Withdrawal amount for ${rewardAddr} does not match the actual reward balance (Withdrawing: ${amount} Balance: ${account.balance}).`,
          );

        const stakeCred =
          Address.fromBech32(rewardAddr).getProps().paymentPart!;
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

    // -- Certificates
    body
      .certs()
      ?.values()
      .forEach((cert, index) => {
        const core = cert.toCore() as CertificateCore;
        const certType = core.__typename;

        // Deposits (stake reg family)
        if (isCertType(core, StakeRegistrationCertificateTypes)) {
          const deposit = isStakeAddressCertificate(core)
            ? BigInt(this.params.stakeKeyDeposit)
            : BigInt(core.deposit ?? 0);
          netValue = V.sub(netValue, new Value(deposit));
        }

        // Refunds (reg + dereg family where applicable)
        if (
          isCertType(core, RegAndDeregCertificateTypes) &&
          (certType === CertificateType.Unregistration ||
            certType === CertificateType.StakeDeregistration)
        ) {
          const deposit = isStakeAddressCertificate(core)
            ? BigInt(this.params.stakeKeyDeposit)
            : BigInt(core.deposit ?? 0);
          netValue = V.merge(netValue, new Value(deposit));
        }

        // Witnesses by stake/vote groups
        if (
          isCertType(core, StakeCredentialCertificateTypes) ||
          isCertType(core, VoteDelegationCredentialCertificateTypes)
        ) {
          const stakeCred = core.stakeCredential;
          if (stakeCred)
            consumeCred(stakeCred, RedeemerTag.Cert, BigInt(index));
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
    {
      const proposalSet = body.proposalProcedures();
      if (proposalSet) {
        const proposals = proposalSet.values();
        let totalDeposit = 0n;
        for (let i = 0; i < proposals.length; i++) {
          const p = proposals[i]!;
          const expected = BigInt(this.params.governanceActionDeposit ?? 0);
          if (BigInt(p.deposit()) !== expected) {
            throw new Error(
              `Invalid governance deposit: supplied ${p.deposit()} expected ${this.params.governanceActionDeposit ?? 0}`,
            );
          }
          totalDeposit += BigInt(p.deposit());
        }
        if (totalDeposit > 0n) {
          netValue = V.sub(netValue, new Value(totalDeposit));
        }
      }
    }

    // Voting witnesses
    {
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

      const length = output.amount().toCbor().length / 2;
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
          `Extraneous ${witnessType} witness. ${hash} has not been consumed.`,
        );
      }
    });

    const txSize = tx.toCbor().length / 2;
    if (txSize > this.params.maxTxSize) {
      throw new Error(
        `Transaction size exceeds the maximum allowed. Supplied: ${txSize}, Maximum: ${this.params.maxTxSize}`,
      );
    }

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

    console.log("txSize", txSize)

    let fee =
      evalFee +
      BigInt(
        Math.ceil(
          this.params.minFeeConstant + txSize * this.params.minFeeCoefficient,
        ),
      );

    console.log("fee", fee)

    let refScriptFee = 0n;
    if (refInputs && this.params.minFeeRefScriptCostPerByte) {
      const refScripts = [...inputs, ...refInputs]
        .map((x) => this.getOutput(x)!.scriptRef())
        .filter((x) => x !== undefined);

      refScriptFee += BigInt(
        Math.ceil(calculateReferenceScriptFee(refScripts, this.params)),
      );
    }

    fee += refScriptFee;

    if (fee > body.fee())
      throw new Error(
        `Insufficient transaction fee. Supplied: ${body.fee()}, Required: ${fee}`,
      );

    netValue = V.sub(netValue, new Value(body.fee() + (body.donation() ?? 0n)));
    if (!V.empty(netValue))
      throw new Error(
        `Value not conserved. Leftover Value: ${netValue.coin()}, ${Array.from(
          netValue.multiasset()?.entries() ?? [],
        )}`,
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
   * This function iterates over the inputs of the transaction and removes the corresponding UTxOs from the ledger.
   * It then iterates over the outputs of the transaction and adds them as new UTxOs to the ledger.
   * If the transaction includes any certificates, it processes them accordingly.
   * Finally, it updates the balances of the accounts based on any withdrawals in the transaction.
   */
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
              output!,
            ),
        ),
      ),
    };

    const certs = tx.body().certs()?.values() ?? [];
    for (const cert of certs) {
      this.applyCertificate(cert);
    }

    const withdrawals: Map<RewardAccount, bigint> =
      tx.body().withdrawals() ?? new Map();
    for (const [rewardAccount, withdrawn] of withdrawals.entries()) {
      const account = this.accounts.get(rewardAccount)!;
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
          `Stake key with reward address ${rewardAccount} is already registered.`,
        );
      }
      const deposit = isStakeAddressCertificate(core)
        ? BigInt(this.params.stakeKeyDeposit)
        : BigInt(core.deposit ?? 0);

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
          `Stake key with reward address ${rewardAccount} is not registered.`,
        );
      }
      const deposit = isStakeAddressCertificate(core)
        ? BigInt(this.params.stakeKeyDeposit)
        : BigInt(core.deposit ?? 0);
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
        if (this.dreps[keyHash]?.isRegistered) {
          throw new Error("DRep is already registered.");
        }
        this.dreps[keyHash] = {
          credential: cred,
          deposit: BigInt(core.deposit),
          anchor: core.anchor ?? undefined,
          lastActiveEpoch: this.clock.epoch,
          isRegistered: true,
        };
        this.depositPot += BigInt(core.deposit);
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
        // TODO (?)
        break;
      }
      case CertificateType.ResignCommitteeCold: {
        this.cc.members = this.cc.members.filter(
          (m) => m.coldCredential.hash !== core.coldCredential.hash,
        );
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
    accountAddr: CredentialCore | RewardAccount,
  ): RegisteredAccount {
    if (typeof accountAddr === "object" && "type" in accountAddr) {
      accountAddr = this.rewardAccount(accountAddr);
    }
    const res = this.accounts.get(accountAddr);
    if (!res)
      throw new Error(
        `Account with reward address ${accountAddr} is not registered.`,
      );
    return res;
  }

  private rewardAccount(cred: CredentialCore): RewardAccount {
    return RewardAccount.fromCredential(cred, NetworkId.Testnet);
  }

  private onEpochBoundary(): void {
    this.govTrace(
      `Epoch ${this.clock.epoch} boundary. feePot=${this.feePot} depositPot=${this.depositPot} treasury=${this.treasury}`,
    );
    if (this.feePot > 0n) {
      const treasuryShare = BigInt(
        Math.floor(
          Number(this.feePot) * parseFloat(this.params.treasuryExpansion),
        ),
      );
      this.govTrace(
        `Distribute fees treasury=${treasuryShare}, stakers=${this.feePot - treasuryShare}`,
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

  /**
   * Extract and apply governance proposals and votes from the transaction body.
   */
  private applyGovernance(tx: Transaction): void {
    const body = tx.body();
    const txId = tx.getId();
    const currentEpoch = this.clock.epoch;
    const lifetime = this.params.governanceActionLifetime ?? 0;

    const proposalSet = body.proposalProcedures();
    if (proposalSet) {
      this.govTrace(`Tx ${txId}: proposals=${proposalSet.values().length}`);
      const proposals = proposalSet.values();
      for (let i = 0; i < proposals.length; i++) {
        const p = proposals[i]!;
        const gid = new GovernanceActionId(txId, BigInt(i));
        const key = serialiseGovId(gid);
        if (key in this.#proposals) {
          throw new Error(
            `Unreachable: Somehow have duplicate governance action ids ${key}`,
          );
        }
        if (
          BigInt(p.deposit()) !==
          BigInt(this.params.governanceActionDeposit ?? 0)
        ) {
          throw new Error(
            `Invalid governance deposit: supplied ${p.deposit()} expected ${this.params.governanceActionDeposit ?? 0}`,
          );
        }
        this.depositPot += BigInt(p.deposit());

        this.#proposals[key] = {
          procedure: p,
          submittedEpoch: currentEpoch,
          expiryEpoch: currentEpoch + lifetime,
          status: ProposalStatus.Active,
          votes: [],
        };
        this.govTrace(
          `Registered proposal ${key} kind=${p.kind()} expiry=${currentEpoch + lifetime}`,
        );
      }
    }

    const voting = body.votingProcedures();
    if (voting !== undefined) {
      this.govTrace(`Tx ${txId}: voters=${voting.toCore().length}`);
      for (const { voter, votes } of voting.toCore()) {
        for (const { actionId, votingProcedure } of votes) {
          const key = serialiseGovId(actionId);
          if (!(key in this.#proposals)) {
            throw new Error(
              `Vote references unknown GovernanceActionId ${key}`,
            );
          }
          this.govTrace(`Vote for ${key}: vote=${votingProcedure.vote}`);
          this.#proposals[key]!.votes.push({
            voter: Voter.fromCore(voter),
            vote: votingProcedure.vote,
          });
        }
      }
    }
  }

  /**
   * Create a snapshot of current stake delegations for deterministic vote counting
   */
  private createStakeSnapshot(): void {
    const snapshot: StakeSnapshot = {
      drepDelegation: {},
      spoDelegation: {},
    };

    for (const [, account] of this.accounts.entries()) {
      const stake = account.balance;
      if (stake === 0n) continue;

      // Aggregate DRep delegations
      if (account.drep) {
        const drepId = account.drep.toCbor();
        snapshot.drepDelegation[drepId] =
          (snapshot.drepDelegation[drepId] ?? 0n) + stake;
      }

      // Aggregate SPO delegations
      if (account.poolId) {
        snapshot.spoDelegation[account.poolId] =
          (snapshot.spoDelegation[account.poolId] ?? 0n) + stake;
      }
    }

    this.snapshots[this.clock.epoch] = snapshot;
    const drepTotal = Object.values(snapshot.drepDelegation).reduce(
      (a, b) => a + b,
      0n,
    );
    const spoTotal = Object.values(snapshot.spoDelegation).reduce(
      (a, b) => a + b,
      0n,
    );
    this.govTrace(
      `Snapshot epoch=${this.clock.epoch}: drepTotal=${drepTotal} spoTotal=${spoTotal} drepKeys=${Object.keys(snapshot.drepDelegation).length} spoKeys=${Object.keys(snapshot.spoDelegation).length}`,
    );
  }

  /**
   * Ratify active governance proposals based on vote tallies and thresholds
   */
  private ratifyGovernanceActions(): void {
    const currentEpoch = this.clock.epoch;
    const snapshot = this.snapshots[currentEpoch - 1]; // Use previous epoch's snapshot

    if (!snapshot) {
      this.govTrace(`No snapshot for epoch ${currentEpoch - 1}; skip RATIFY`);
      return;
    }

    for (const [actionId, proposal] of Object.entries(this.#proposals)) {
      if (proposal.status !== ProposalStatus.Active) continue;

      // Check if proposal has expired
      if (proposal.expiryEpoch <= currentEpoch) {
        proposal.status = ProposalStatus.Expired;
        this.refundProposalDeposit(proposal);
        continue;
      }

      // Tally votes by role
      const tallies: Tallies = {
        drep: { yes: 0n, no: 0n },
        spo: { yes: 0n, no: 0n },
        cc: { yes: 0n, no: 0n },
      };

      for (const { voter, vote } of proposal.votes) {
        const voterCore = voter.toCore();
        const stake = this.getVoterStake(voterCore, snapshot);

        switch (voter.kind()) {
          case VoterKind.DrepKeyHash:
          case VoterKind.DRepScriptHash:
            tallies.drep[vote === Vote.yes ? "yes" : "no"] += stake;
            break;
          case VoterKind.StakePoolKeyHash:
            tallies.spo[vote === Vote.yes ? "yes" : "no"] += stake;
            break;
          case VoterKind.ConstitutionalCommitteeKeyHash:
          case VoterKind.ConstitutionalCommitteeScriptHash:
            tallies.cc[vote === Vote.yes ? "yes" : "no"] += stake;
            break;
        }
      }

      this.govTrace(
        `Tallies ${actionId}: drep(y=${tallies.drep.yes},n=${tallies.drep.no}) spo(y=${tallies.spo.yes},n=${tallies.spo.no}) cc(y=${tallies.cc.yes},n=${tallies.cc.no})`,
      );
      // Check ratification thresholds based on proposal type
      const isRatified = this.checkRatificationThresholds(proposal, tallies);

      if (isRatified) {
        proposal.status = ProposalStatus.Ratified;
        this.enactQueue.push({
          actionId: actionId as SerialisedGovId,
          enactAtEpoch: currentEpoch + 1,
        });
      } else {
        this.govTrace(`Proposal ${actionId} not ratified; stays Active`);
      }
    }
  }

  /**
   * Enact ratified governance actions that are due for this epoch
   */
  private enactGovernanceActions(): void {
    const currentEpoch = this.clock.epoch;
    const toEnact = this.enactQueue.filter(
      (item) => item.enactAtEpoch === currentEpoch,
    );

    for (const item of toEnact) {
      const proposal = this.#proposals[item.actionId];
      if (!proposal) continue;

      // Apply the governance action effects based on type
      this.applyGovernanceEffect(proposal);
      proposal.status = ProposalStatus.Enacted;
      this.refundProposalDeposit(proposal);
    }

    // Remove enacted items from queue
    this.enactQueue = this.enactQueue.filter(
      (item) => item.enactAtEpoch !== currentEpoch,
    );
  }

  /**
   * Expire inactive DReps based on delegateRepresentativeMaxIdleTime
   */
  private expireDReps(): void {
    const maxIdleTime = this.params.delegateRepresentativeMaxIdleTime;
    if (!maxIdleTime) return;

    const currentEpoch = this.clock.epoch;
    for (const drep of Object.values(this.dreps)) {
      if (
        drep.isRegistered &&
        currentEpoch - drep.lastActiveEpoch > maxIdleTime
      ) {
        drep.isRegistered = false;
        // Refund deposit would be handled here if we track it separately
      }
    }
  }

  private getVoterStake(voter: VoterCore, snapshot: StakeSnapshot): bigint {
    const v = Voter.fromCore(voter);
    switch (v.kind()) {
      case VoterKind.DrepKeyHash:
      case VoterKind.DRepScriptHash: {
        const cred = v.toDrepCred()!;
        let dRep: DRep;
        if (cred.type === CredentialType.KeyHash) {
          dRep = DRep.newKeyHash(
            Ed25519KeyHashHex(cred.hash as Hash28ByteBase16),
          );
        } else {
          dRep = DRep.newScriptHash(cred.hash as ScriptHash);
        }
        const dRepId = dRep.toCbor();
        const stake = snapshot.drepDelegation[dRepId] ?? 0n;
        this.govTrace(`Stake DRep ${dRepId} = ${stake}`);
        return stake;
      }
      case VoterKind.StakePoolKeyHash: {
        const keyHash = v.toStakingPoolKeyHash()!;
        for (const [poolId, poolParams] of Object.entries(this.activePools)) {
          if (
            poolParams.owners.some(
              (o) =>
                RewardAccount.toHash(o) ===
                Hash28ByteBase16.fromEd25519KeyHashHex(keyHash),
            )
          ) {
            const stake = snapshot.spoDelegation[poolId as PoolId] ?? 0n;
            this.govTrace(`Stake SPO ${poolId} = ${stake}`);
            return stake;
          }
        }
        this.govTrace(`Stake SPO (no match) = 0`);
        return 0n;
      }
      case VoterKind.ConstitutionalCommitteeKeyHash:
      case VoterKind.ConstitutionalCommitteeScriptHash: {
        this.govTrace(`Stake CC = 1`);
        return 1n; // Each CC member has one vote, stake is irrelevant
      }
      default:
        return 0n;
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
        "Trying to enact governance action without full conway parameters",
      );
    }
    const dRepThresh = this.params.delegateRepresentativeVotingThresholds;
    const spoThresh = this.params.stakePoolVotingThresholds;

    const getParamsGroups = () => {
      const p = proposal.procedure.getParameterChangeAction();
      if (!p) throw new Error("Unreachable: Parameter change action not found");
      const u = p.toCore().protocolParamUpdate;

      const drepGroups: (keyof DelegateRepresentativeThresholds)[] = [];
      const spoGroups: (keyof PoolVotingThresholds)[] = [];

      // Network group
      if (
        objectHasAnyKeys(
          u,
          "maxBlockBodySize",
          "maxTxSize",
          "maxBlockHeaderSize",
          "maxExecutionUnitsPerTransaction",
          "maxExecutionUnitsPerBlock",
          "maxValueSize",
          "maxCollateralInputs",
        )
      )
        drepGroups.push("ppNetworkGroup");

      // Economic group
      if (
        objectHasAnyKeys(
          u,
          "minFeeCoefficient",
          "minFeeConstant",
          "stakeKeyDeposit",
          "poolDeposit",
          "monetaryExpansion",
          "treasuryExpansion",
          "coinsPerUtxoByte",
          "prices",
          "minFeeRefScriptCostPerByte",
          "minPoolCost",
          "poolInfluence",
        )
      )
        drepGroups.push("ppEconomicGroup");

      // Technical group
      if (
        objectHasAnyKeys(
          u,
          "poolRetirementEpochBound",
          "desiredNumberOfPools",
          "poolInfluence",
          "collateralPercentage",
          "costModels",
        )
      )
        drepGroups.push("ppTechnicalGroup");

      // Governance group
      if (
        objectHasAnyKeys(
          u,
          "poolVotingThresholds",
          "dRepVotingThresholds",
          "minCommitteeSize",
          "committeeTermLimit",
          "governanceActionValidityPeriod",
          "governanceActionDeposit",
          "dRepDeposit",
          "dRepInactivityPeriod",
        )
      )
        drepGroups.push("ppGovernanceGroup");

      // SPO security-relevant keys (Security group)
      if (
        objectHasAnyKeys(
          u,
          "maxBlockBodySize",
          "maxTxSize",
          "maxBlockHeaderSize",
          "maxValueSize",
          "maxExecutionUnitsPerBlock",
          "minFeeRefScriptCostPerByte",
          "coinsPerUtxoByte",
          "governanceActionDeposit",
          "minFeeCoefficient", // a
          "minFeeConstant", // b
        )
      ) {
        spoGroups.push("securityRelevantParamVotingThreshold");
      }

      return {
        drep: drepGroups,
        spo: spoGroups,
      };
    };

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
        const groups = getParamsGroups();
        // Pick the strictest dRep threshold among all impacted groups (largest ratio)
        const drepFraction = fractionMax(
          ...groups.drep.map((g) => dRepThresh[g]),
        );
        const spoFraction = fractionMax(...groups.spo.map((g) => spoThresh[g]));
        this.govTrace(
          `Thresholds ParamChange drep=${JSON.stringify(
            drepFraction,
          )} spo=${JSON.stringify(spoFraction)} groups=${JSON.stringify(groups)}`,
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

  private fractionAtLeast(yes: bigint, no: bigint, thresh?: Fraction): boolean {
    if (!thresh) return true;
    const total = yes + no;
    if (total === 0n) return false;
    const num = BigInt(thresh.numerator);
    const den = BigInt(thresh.denominator);
    return yes * den >= num * total;
  }

  private checkRatificationThresholds(
    proposal: GovProposal,
    tallies: Tallies,
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

    const { drep, spo } = this.getActionThresholds(proposal);

    const drepPass = this.fractionAtLeast(
      tallies.drep.yes,
      tallies.drep.no,
      drep,
    );
    const spoPass = this.fractionAtLeast(tallies.spo.yes, tallies.spo.no, spo);

    // CC quorum: yes votes against total committee members
    const ccMembers = BigInt(this.cc.members.length);
    const quorum = this.cc.quorumThreshold;
    const ccPass =
      kind === GovernanceActionKind.UpdateCommittee ||
      kind === GovernanceActionKind.NoConfidence ||
      ccMembers === 0n ||
      (quorum !== undefined &&
        tallies.cc.yes * BigInt(quorum.denominator) >=
          BigInt(quorum.numerator) * ccMembers);

    const pass = drepPass && spoPass && ccPass;
    this.govTrace(
      `Check kind=${kind} drepPass=${drepPass} spoPass=${spoPass} ccPass=${ccPass} => pass=${pass}`,
    );
    return pass;
  }

  private applyGovernanceEffect(proposal: GovProposal): void {
    const actionKind = proposal.procedure.kind();

    switch (actionKind) {
      case GovernanceActionKind.ParameterChange:
        const paramChange = proposal.procedure.getParameterChangeAction();
        if (paramChange) {
          const updates = paramChange.toCore().protocolParamUpdate;
          if (updates.minFeeRefScriptCostPerByte) {
            this.params.minFeeRefScriptCostPerByte = Number(
              updates.minFeeRefScriptCostPerByte,
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
      case GovernanceActionKind.HardForkInitiation:
        // No-op in emulator
        break;
      case GovernanceActionKind.TreasuryWithdrawals:
        const treasuryAction =
          proposal.procedure.getTreasuryWithdrawalsAction();
        if (treasuryAction) {
          for (const [rewardAccount, amount] of treasuryAction
            .withdrawals()
            .entries()) {
            if (this.treasury >= amount) {
              this.treasury -= amount;
              const account = this.accounts.get(rewardAccount);
              if (account) {
                account.balance += amount;
              }
            }
          }
        }
        break;
      case GovernanceActionKind.UpdateCommittee:
        const committeeUpdate = proposal.procedure.getUpdateCommittee();
        if (committeeUpdate) {
          const update = committeeUpdate.toCore();
          const membersToRemove = new Set(
            Array.from(update.membersToBeRemoved.values()).map(
              (cred) => cred.hash,
            ),
          );
          // Filter out removed members
          this.cc.members = this.cc.members.filter(
            (member) => !membersToRemove.has(member.coldCredential.hash),
          );
          // Add new members
          this.cc.members.push(...update.membersToBeAdded.values());
        }
        break;
      case GovernanceActionKind.NewConstitution:
        const newConstitution = proposal.procedure.getNewConstitution();
        if (newConstitution) {
          this.constitution = newConstitution.toCore().constitution;
        }
        break;
      case GovernanceActionKind.Info:
        // No state change required
        break;
    }
  }

  private refundProposalDeposit(proposal: GovProposal): void {
    const deposit = BigInt(proposal.procedure.deposit());
    const rewardAccount = proposal.procedure.rewardAccount();

    this.depositPot -= deposit;

    const account = this.accounts.get(rewardAccount);
    if (account) {
      account.balance += deposit;
    }
  }
}
