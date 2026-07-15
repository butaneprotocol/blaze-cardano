import { describe, expect, test } from "vitest";
import { ogmiosChainSyncEvents, type OgmiosChainSyncClient } from "../src";

class FakeOgmios implements OgmiosChainSyncClient {
  readonly calls: string[] = [];
  readonly intersectionPoints: unknown[] = [];
  #nextRequestCount = 0;
  #nextResolvers: ((
    value: Awaited<ReturnType<FakeOgmios["nextBlock"]>>,
  ) => void)[] = [];
  #nextRejecters: ((reason: unknown) => void)[] = [];
  #nextWaiters: { count: number; resolve: () => void }[] = [];

  constructor(private readonly intersectionError?: unknown) {}

  async findIntersection(
    points?: unknown[],
  ): ReturnType<OgmiosChainSyncClient["findIntersection"]> {
    this.calls.push("findIntersection");
    this.intersectionPoints.push(points);
    if (this.intersectionError) throw this.intersectionError;
    return {
      intersection: "origin",
      tip: { slot: 11, id: "tip" },
    } as Awaited<ReturnType<OgmiosChainSyncClient["findIntersection"]>>;
  }

  nextBlock(): ReturnType<OgmiosChainSyncClient["nextBlock"]> {
    this.calls.push("nextBlock");
    this.#nextRequestCount += 1;
    const ready = this.#nextWaiters.filter(
      (waiter) => this.#nextRequestCount >= waiter.count,
    );
    this.#nextWaiters = this.#nextWaiters.filter(
      (waiter) => this.#nextRequestCount < waiter.count,
    );
    ready.forEach((waiter) => waiter.resolve());
    return new Promise((resolve, reject) => {
      this.#nextResolvers.push(resolve);
      this.#nextRejecters.push(reject);
    });
  }

  async waitForNextBlockRequest(count = 1): Promise<void> {
    if (this.#nextRequestCount >= count) return;
    await new Promise<void>((resolve) =>
      this.#nextWaiters.push({ count, resolve }),
    );
  }

  emitNextBlock(
    result: Awaited<ReturnType<OgmiosChainSyncClient["nextBlock"]>>,
  ): void {
    const resolve = this.#nextResolvers.shift();
    this.#nextRejecters.shift();
    resolve?.(result);
  }

  rejectNextBlock(reason: unknown): void {
    this.#nextResolvers.shift();
    const reject = this.#nextRejecters.shift();
    reject?.(reason);
  }
}

describe("ogmiosChainSyncEvents", () => {
  test("finds an intersection and yields roll-forward events", async () => {
    const ogmios = new FakeOgmios();
    const events = ogmiosChainSyncEvents({ ogmios });
    const iterator = events[Symbol.asyncIterator]();

    await ogmios.waitForNextBlockRequest();
    ogmios.emitNextBlock({
      direction: "forward",
      tip: { slot: 12, id: "abc" },
      block: { id: "block" },
    } as Awaited<ReturnType<OgmiosChainSyncClient["nextBlock"]>>);

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "rollForward",
        point: { slot: 12, hash: "abc" },
        block: { id: "block" },
      },
    });
    expect(ogmios.calls.slice(0, 2)).toEqual(["findIntersection", "nextBlock"]);
    expect(ogmios.intersectionPoints).toEqual([["origin"]]);
    await iterator.return?.();
  });

  test("yields rollback events and applies event filters", async () => {
    const ogmios = new FakeOgmios();
    const events = ogmiosChainSyncEvents({
      ogmios,
      filter: { types: ["rollBackward"] },
    });
    const iterator = events[Symbol.asyncIterator]();

    await ogmios.waitForNextBlockRequest();
    ogmios.emitNextBlock({
      direction: "forward",
      tip: { slot: 12, id: "abc" },
      block: { id: "block" },
    } as Awaited<ReturnType<OgmiosChainSyncClient["nextBlock"]>>);
    await ogmios.waitForNextBlockRequest(2);
    ogmios.emitNextBlock({
      direction: "backward",
      point: { slot: 10, id: "rollback" },
    } as Awaited<ReturnType<OgmiosChainSyncClient["nextBlock"]>>);

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "rollBackward",
        point: { slot: 10, hash: "rollback" },
      },
    });
    await iterator.return?.();
  });

  test("closes the stream when the abort signal fires", async () => {
    const ogmios = new FakeOgmios();
    const controller = new AbortController();
    const events = ogmiosChainSyncEvents({
      ogmios,
      signal: controller.signal,
    });
    const iterator = events[Symbol.asyncIterator]();

    await ogmios.waitForNextBlockRequest();
    controller.abort();

    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    });
  });

  test("closes immediately when created with an aborted signal", async () => {
    const ogmios = new FakeOgmios();
    const controller = new AbortController();
    controller.abort();
    const events = ogmiosChainSyncEvents({
      ogmios,
      signal: controller.signal,
    });

    await expect(events[Symbol.asyncIterator]().next()).resolves.toEqual({
      done: true,
      value: undefined,
    });
    expect(ogmios.calls).toEqual([]);
  });

  test("closes the stream when intersection fails", async () => {
    const events = ogmiosChainSyncEvents({
      ogmios: new FakeOgmios(new Error("intersection failed")),
    });

    await expect(events[Symbol.asyncIterator]().next()).resolves.toEqual({
      done: true,
      value: undefined,
    });
  });

  test("closes the stream when nextBlock fails", async () => {
    const ogmios = new FakeOgmios();
    const events = ogmiosChainSyncEvents({ ogmios });
    const iterator = events[Symbol.asyncIterator]();

    await ogmios.waitForNextBlockRequest();
    ogmios.rejectNextBlock(new Error("nextBlock failed"));

    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    });
  });
});
