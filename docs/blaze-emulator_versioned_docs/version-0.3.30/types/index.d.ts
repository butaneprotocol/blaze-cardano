import { Address } from '@blaze-cardano/core';
import type { AssetId } from '@blaze-cardano/core';
import { Blaze } from '@blaze-cardano/sdk';
import { DatumHash } from '@blaze-cardano/core';
import { Evaluator } from '@blaze-cardano/core';
import { PlutusData } from '@blaze-cardano/core';
import { ProtocolParameters } from '@blaze-cardano/core';
import { Provider } from '@blaze-cardano/sdk';
import { Provider as Provider_2 } from '@blaze-cardano/query';
import type { Redeemers } from '@blaze-cardano/core';
import { RewardAccount } from '@blaze-cardano/core';
import { Script } from '@blaze-cardano/core';
import { Slot } from '@blaze-cardano/core';
import { SlotConfig } from '@blaze-cardano/core';
import { Transaction } from '@blaze-cardano/core';
import { TransactionId } from '@blaze-cardano/core';
import { TransactionInput } from '@blaze-cardano/core';
import { TransactionOutput } from '@blaze-cardano/core';
import { TransactionUnspentOutput } from '@blaze-cardano/core';
import { TxBuilder } from '@blaze-cardano/tx';
import { Value } from '@blaze-cardano/core';
import { Wallet } from '@blaze-cardano/sdk';

/**
 * The Emulator class is used to simulate the behavior of a ledger.
 * It maintains a ledger of unspent transaction outputs, reward accounts, protocol parameters, and a clock.
 * It also provides methods to start and stop an event loop for the ledger.
 */
export declare class Emulator {
    #private;
    /**
     * The map of reward accounts and their balances.
     */
    accounts: Map<RewardAccount, bigint>;
    /**
     * A map from label to blaze instance for that wallet
     */
    mockedWallets: Map<string, Wallet>;
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
    eventLoop?: NodeJS.Timeout;
    /**
     * A lookup table of hashes to datums.
     */
    datumHashes: Record<DatumHash, PlutusData>;
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
    constructor(genesisOutputs: TransactionOutput[], params?: ProtocolParameters, { evaluator, slotConfig }?: EmulatorOptions);
    private getOrAddWallet;
    register(label: string, value?: Value, datum?: PlutusData): Promise<Address>;
    addressOf(label: string): Promise<Address>;
    fund(label: string, value?: Value, datum?: PlutusData): Promise<void>;
    as<T = void>(label: string, callback: (blaze: Blaze<Provider, Wallet>, address: Address) => Promise<T>): Promise<T>;
    publishScript(script: Script): Promise<void>;
    lookupScript(script: Script): TransactionUnspentOutput;
    expectValidTransaction(blaze: Blaze<Provider, Wallet>, tx: TxBuilder): Promise<void>;
    expectValidMultisignedTransaction(signers: string[], tx: TxBuilder): Promise<void>;
    expectScriptFailure(tx: TxBuilder, pattern?: RegExp): Promise<void>;
    unixToSlot(unix_millis: bigint | number): Slot;
    slotToUnix(slot: Slot | number | bigint): number;
    stepForwardToSlot(slot: number | bigint): void;
    stepForwardToUnix(unix: number | bigint): void;
    stepForwardBlock(): void;
    awaitTransactionConfirmation(txId: TransactionId): void;
    /**
     * Starts the event loop for the ledger.
     * If the event loop is already running, it is cleared and restarted.
     * The event loop calls the stepForwardBlock method every 20 slots.
     */
    startEventLoop(): void;
    /**
     * Stops the event loop for the ledger.
     * If the event loop is running, it is cleared.
     */
    stopEventLoop(): void;
    /**
     * Adds a given UTxO to the Emulator's ledger. Overwrites any existing UTxO with the same input.
     *
     * @param utxo - The UTxO to add to the ledger.
     */
    addUtxo(utxo: TransactionUnspentOutput): void;
    /**
     * Removes a given UTxO from the Emulator's ledger by input.
     *
     * @param inp - The input to remove from the ledger.
     */
    removeUtxo(inp: TransactionInput): void;
    /**
     * Retrieves an output from the ledger by input.
     *
     * @param inp - The input to retrieve the output for.
     * @returns The output corresponding to the input, or undefined if the input is not found.
     */
    getOutput(inp: TransactionInput): TransactionOutput | undefined;
    /**
     * Retrieves the Emulator's ledger as an array of UTxOs.
     * @returns The full list of UTxOs in the Emulator's ledger.
     */
    utxos(): TransactionUnspentOutput[];
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
    submitTransaction(tx: Transaction): Promise<TransactionId>;
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
    private acceptTransaction;
}

export declare interface EmulatorOptions {
    evaluator?: Evaluator;
    slotConfig?: SlotConfig;
}

/**
 * The EmulatorProvider class implements the Provider interface.
 * It provides methods to interact with the Emulator.
 */
export declare class EmulatorProvider extends Provider_2 {
    /**
     * The Emulator instance.
     */
    private emulator;
    constructor(emulator: Emulator);
    getParameters(): Promise<ProtocolParameters>;
    getSlotConfig(): SlotConfig;
    getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputsWithAsset(address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    awaitTransactionConfirmation(txId: TransactionId, _timeout?: number | undefined): Promise<boolean>;
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
}

export declare class LedgerTimer {
    zeroTime: number;
    block: number;
    slot: number;
    time: number;
    slotLength: number;
    constructor(slotConfig?: SlotConfig);
}

export { }
