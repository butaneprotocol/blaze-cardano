import { NetworkId } from "@cardano-sdk/core/dist/cjs/Cardano";
import {
  TransactionUnspentOutput,
  ProtocolParameters,
  TransactionOutput,
  Transaction,
  TransactionId,
  TransactionInput,
  RewardAccount,
  StakeRegistration,
  Address,
  AddressType,
} from "../translucent-core";
import { hardCodedProtocolParams } from "../translucent-core/params";

export class LedgerTimer {
  block: number = 0;
  slot: number = 0;
  time: number = 0;
}

/**
 * The Emulator class is used to simulate the behavior of a ledger.
 * It maintains a ledger of unspent transaction outputs, protocol parameters, and a clock.
 * It also provides methods to start and stop an event loop for the ledger.
 */
export class Emulator {
  /**
   * The ledger of unspent transaction outputs.
   */
  ledger: Set<TransactionUnspentOutput> = new Set();

  /**
   * The map of reward accounts and their balances.
   */
  accounts: Map<RewardAccount, BigInt> = new Map();

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
   * (todo)
   */
  datumHashes: undefined;

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
  ) {
    for (let i = 0; i < genesisOutputs.length; i++) {
      let txIn = new TransactionInput(
        TransactionId("00".repeat(32)),
        BigInt(i),
      );
      this.ledger.add(new TransactionUnspentOutput(txIn, genesisOutputs[i]));
    }
    this.params = params;
  }

  stepForwardBlock(): void {
    // To be implemented
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
   *   - Withdrawals: If the transaction involves withdrawals, ensure that the withdrawal amount matches the actual reward balance.
   *   - Validity Interval: Check that the transaction's validity interval is within the slot range.
   *   - Input Existence: Check that all inputs in the transaction exist and have not been spent.
   *   - Script Refs: For each input, check if it has a script ref and handle it accordingly.
   *   - Collateral Inputs: Check that all collateral inputs only contain vkeys.
   *   - Required Signers: Check that all required signers are included in the transaction.
   *   - Mint Witnesses: Check that all mint witnesses are included in the transaction.
   *   - Cert Witnesses: Check that all cert witnesses are included in the transaction.
   *   - Input Witnesses: Check that all input witnesses are included in the transaction.
   *   - Create Outputs and Consume Datum Hashes: For each output, create a new unspent output and consume the datum hash.
   *   - Check Consumed Witnesses: Check that all witnesses have been consumed.
   *   - Apply Transitions: Apply the necessary transitions to the ledger, mempool, withdrawal requests, cert requests, and outputs.
   */
  async submitTransaction(tx: Transaction): Promise<TransactionId> {
    // ... todo: checks ...

    this.acceptTransaction(tx);
    return tx.getId();
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
    for (const utxo of this.ledger.values()) {
      if (inputs.find((x) => x == utxo.input())) {
        this.ledger.delete(utxo);
      }
    }
    const outputs = tx.body().outputs();
    const txId = tx.getId();
    for (let i = 0; i < outputs.length; i++) {
      const utxo = new TransactionUnspentOutput(
        new TransactionInput(txId, BigInt(i)),
        outputs[i],
      );
      this.ledger.add(utxo);
    }
    const certs = tx.body().certs()?.values() ?? [];
    for (let i = 0; i < certs.length; i++) {
      const cert = certs[i];
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
  }
}
