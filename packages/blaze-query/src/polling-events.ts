import type { Address, TransactionUnspentOutput } from "@blaze-cardano/core";
import type { Provider } from "./provider";
import {
  chainEventMatches,
  transactionInputKey,
  type ChainEvent,
  type ChainEventFilter,
} from "./events";

/** @public */
export type PollingAddressEventOptions = ChainEventFilter & {
  address: Address;
  intervalMs?: number;
  signal?: AbortSignal;
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });

const indexUtxos = (
  utxos: readonly TransactionUnspentOutput[],
): Map<string, TransactionUnspentOutput> =>
  new Map(utxos.map((utxo) => [transactionInputKey(utxo.input()), utxo]));

/** @public */
export async function* pollAddressEvents(
  provider: Provider,
  options: PollingAddressEventOptions,
): AsyncIterable<ChainEvent> {
  const intervalMs = options.intervalMs ?? 5_000;
  let previous = indexUtxos(await provider.getUnspentOutputs(options.address));

  while (!options.signal?.aborted) {
    await sleep(intervalMs, options.signal);
    if (options.signal?.aborted) return;

    const current = indexUtxos(
      await provider.getUnspentOutputs(options.address),
    );
    for (const [key, utxo] of current) {
      if (previous.has(key)) continue;
      const event: ChainEvent = {
        type: "utxoProduced",
        address: options.address,
        input: utxo.input(),
      };
      if (chainEventMatches(event, options)) yield event;
    }
    for (const [key, utxo] of previous) {
      if (current.has(key)) continue;
      const event: ChainEvent = {
        type: "utxoSpent",
        address: options.address,
        input: utxo.input(),
      };
      if (chainEventMatches(event, options)) yield event;
    }
    previous = current;
  }
}
