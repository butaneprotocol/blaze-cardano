import type * as Schema from "@cardano-ogmios/schema";
import {
  AsyncEventQueue,
  chainEventMatches,
  type ChainEvent,
  type ChainEventFilter,
  type ChainPoint,
} from "./events";

/** @public */
export type OgmiosChainSyncClient = {
  findIntersection(
    points?: Schema.PointOrOrigin[],
  ): Promise<Schema.IntersectionFound["result"]>;
  nextBlock(): Promise<Schema.NextBlockResponse["result"]>;
};

/** @public */
export type OgmiosChainSyncOptions = {
  ogmios: OgmiosChainSyncClient;
  filter?: ChainEventFilter;
  signal?: AbortSignal;
};

const asChainPoint = (value: Schema.Point | Schema.Tip): ChainPoint => ({
  slot: value.slot,
  hash: value.id,
});

const asChainPointOrOrigin = (
  value: Schema.Point | Schema.Origin,
): ChainPoint | "origin" => {
  if (value === "origin") return "origin";
  return asChainPoint(value);
};

const toChainEvent = (
  result: Schema.NextBlockResponse["result"],
): ChainEvent | undefined => {
  if (result.direction === "forward") {
    return {
      type: "rollForward",
      point: asChainPoint(result.tip),
      block: result.block,
    };
  }
  return {
    type: "rollBackward",
    point: asChainPointOrOrigin(result.point),
  };
};

/** @public */
export const ogmiosChainSyncEvents = (
  input: OgmiosChainSyncOptions,
): AsyncIterable<ChainEvent> => {
  const { ogmios, filter, signal } = input;
  const queue = new AsyncEventQueue<ChainEvent>();
  let closed = false;

  const close = () => {
    closed = true;
    queue.close();
  };

  const run = async () => {
    try {
      if (signal?.aborted) {
        close();
        return;
      }
      await ogmios.findIntersection(["origin"]);
      while (!closed && !signal?.aborted) {
        const chainEvent = toChainEvent(await ogmios.nextBlock());
        if (chainEvent && chainEventMatches(chainEvent, filter)) {
          queue.push(chainEvent);
        }
      }
    } catch {
      close();
      return;
    }
    close();
  };

  signal?.addEventListener("abort", close, { once: true });
  void run();

  return {
    [Symbol.asyncIterator]: () => {
      const iterator = queue[Symbol.asyncIterator]();
      return {
        next: () => iterator.next(),
        return: () => {
          close();
          return (
            iterator.return?.() ??
            Promise.resolve({ done: true, value: undefined })
          );
        },
      };
    },
  };
};
