import type { Address, TransactionInput } from "@blaze-cardano/core";

/** @public */
export type ChainPoint = {
  slot: number;
  hash: string;
};

/** @public */
export type ChainEvent =
  | {
      type: "rollForward";
      point: ChainPoint;
      block: unknown;
    }
  | {
      type: "rollBackward";
      point: ChainPoint | "origin";
    }
  | {
      type: "utxoProduced";
      address: Address;
      input: TransactionInput;
    }
  | {
      type: "utxoSpent";
      address: Address;
      input: TransactionInput;
    };

/** @public */
export type ChainEventType = ChainEvent["type"];

/** @public */
export type ChainEventFilter = {
  types?: readonly ChainEventType[];
};

/** @public */
export interface ChainEventSource {
  events(
    filter?: ChainEventFilter,
    signal?: AbortSignal,
  ): AsyncIterable<ChainEvent>;
}

/** @public */
export const chainEventMatches = (
  event: ChainEvent,
  filter: ChainEventFilter = {},
): boolean => !filter.types || filter.types.includes(event.type);

/** @public */
export const transactionInputKey = (input: TransactionInput): string =>
  `${input.transactionId()}#${input.index()}`;

/** @public */
export class AsyncEventQueue<T> implements AsyncIterable<T> {
  readonly #values: T[] = [];
  readonly #waiters: ((result: IteratorResult<T>) => void)[] = [];
  #closed = false;

  push(value: T): void {
    if (this.#closed) return;
    const waiter = this.#waiters.shift();
    if (waiter) {
      waiter({ done: false, value });
      return;
    }
    this.#values.push(value);
  }

  close(): void {
    this.#closed = true;
    for (const waiter of this.#waiters.splice(0)) {
      waiter({ done: true, value: undefined });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: () => {
        const value = this.#values.shift();
        if (value !== undefined) {
          return Promise.resolve({ done: false, value });
        }
        if (this.#closed) {
          return Promise.resolve({ done: true, value: undefined });
        }
        return new Promise<IteratorResult<T>>((resolve) => {
          this.#waiters.push(resolve);
        });
      },
      return: () => {
        this.close();
        return Promise.resolve({ done: true, value: undefined });
      },
    };
  }
}
