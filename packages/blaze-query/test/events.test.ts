import { describe, expect, test } from "vitest";
import {
  NetworkId,
  TransactionId,
  TransactionInput,
  type Address,
  type PlutusData,
  type ProtocolParameters,
  type Redeemers,
  type TransactionUnspentOutput,
} from "@blaze-cardano/core";
import {
  AsyncEventQueue,
  Provider,
  pollAddressEvents,
  transactionInputKey,
} from "../src";

const input = (digit: string): TransactionInput =>
  new TransactionInput(TransactionId(digit.repeat(64)), 0n);

const utxo = (digit: string): TransactionUnspentOutput =>
  ({ input: () => input(digit) }) as TransactionUnspentOutput;

class PollProvider extends Provider {
  readonly states: TransactionUnspentOutput[][];

  constructor(states: TransactionUnspentOutput[][]) {
    super(NetworkId.Testnet, "cardano-preview");
    this.states = states;
  }

  async getParameters(): Promise<ProtocolParameters> {
    return {} as ProtocolParameters;
  }

  async getUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    return this.states.shift() ?? [];
  }

  async getUnspentOutputsWithAsset(): Promise<TransactionUnspentOutput[]> {
    return this.getUnspentOutputs();
  }

  async getUnspentOutputByNFT(): Promise<TransactionUnspentOutput> {
    return utxo("1");
  }

  async resolveUnspentOutputs(): Promise<TransactionUnspentOutput[]> {
    return [];
  }

  async resolveDatum(): Promise<PlutusData> {
    return {} as PlutusData;
  }

  async resolveScriptRef(): Promise<TransactionUnspentOutput | undefined> {
    return undefined;
  }

  async awaitTransactionConfirmation(): Promise<boolean> {
    return true;
  }

  async postTransactionToChain(): Promise<TransactionId> {
    return TransactionId("1".repeat(64));
  }

  async evaluateTransaction(): Promise<Redeemers> {
    return {} as Redeemers;
  }
}

describe("chain event helpers", () => {
  test("AsyncEventQueue yields pushed events in order and then closes", async () => {
    const queue = new AsyncEventQueue<number>();
    const iterator = queue[Symbol.asyncIterator]();

    queue.push(1);
    queue.push(2);
    queue.close();

    await expect(iterator.next()).resolves.toEqual({ done: false, value: 1 });
    await expect(iterator.next()).resolves.toEqual({ done: false, value: 2 });
    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    });
  });

  test("AsyncEventQueue closes when an iterator is returned", async () => {
    const queue = new AsyncEventQueue<number>();
    const iterator = queue[Symbol.asyncIterator]();

    queue.push(1);

    await expect(iterator.next()).resolves.toEqual({ done: false, value: 1 });
    await expect(iterator.return?.()).resolves.toEqual({
      done: true,
      value: undefined,
    });

    queue.push(2);

    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    });
  });

  test("AsyncEventQueue resolves pending reads when an iterator is returned", async () => {
    const queue = new AsyncEventQueue<number>();
    const iterator = queue[Symbol.asyncIterator]();
    const pending = iterator.next();

    await expect(iterator.return?.()).resolves.toEqual({
      done: true,
      value: undefined,
    });
    await expect(pending).resolves.toEqual({
      done: true,
      value: undefined,
    });
  });

  test("pollAddressEvents emits produced and spent UTxO events", async () => {
    const controller = new AbortController();
    const address = "addr" as unknown as Address;
    const events = pollAddressEvents(
      new PollProvider([[utxo("1")], [utxo("2")]]),
      { address, intervalMs: 1, signal: controller.signal },
    );
    const iterator = events[Symbol.asyncIterator]();

    const produced = await iterator.next();
    const spent = await iterator.next();
    controller.abort();

    expect(produced.value).toMatchObject({
      type: "utxoProduced",
      address,
    });
    expect(transactionInputKey(produced.value.input)).toBe(
      transactionInputKey(input("2")),
    );
    expect(spent.value).toMatchObject({
      type: "utxoSpent",
      address,
    });
    expect(transactionInputKey(spent.value.input)).toBe(
      transactionInputKey(input("1")),
    );
  });
});
