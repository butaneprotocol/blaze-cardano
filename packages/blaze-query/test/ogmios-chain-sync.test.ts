import { describe, expect, test } from "vitest";
import { ogmiosChainSyncEvents, type WebSocketLike } from "../src";

class FakeSocket implements WebSocketLike {
  sent: string[] = [];
  closed = false;
  onopen?: (event: unknown) => void;
  onmessage?: (event: { data: unknown }) => void;
  onerror?: (event: unknown) => void;
  onclose?: (event: unknown) => void;

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closed = true;
    this.onclose?.({});
  }

  emitOpen(): void {
    this.onopen?.({});
  }

  emitMessage(data: unknown): void {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  emitRawMessage(data: unknown): void {
    this.onmessage?.({ data });
  }
}

class EventListenerSocket extends FakeSocket {
  readonly listeners = new Map<string, (event: unknown) => void>();

  addEventListener(
    type: "open" | "message" | "error" | "close",
    listener: (event: unknown) => void,
  ): void {
    this.listeners.set(type, listener);
  }

  override emitOpen(): void {
    this.listeners.get("open")?.({});
  }

  override emitMessage(data: unknown): void {
    this.listeners.get("message")?.({ data: JSON.stringify(data) });
  }
}

describe("ogmiosChainSyncEvents", () => {
  test("opens chain sync and yields roll-forward events", async () => {
    let socket: FakeSocket | undefined;
    const events = ogmiosChainSyncEvents({
      url: "ws://ogmios",
      socketFactory: () => {
        socket = new FakeSocket();
        return socket;
      },
    });
    const iterator = events[Symbol.asyncIterator]();

    socket!.emitOpen();
    socket!.emitMessage({
      id: "blaze-find-intersection",
      result: {
        intersection: "origin",
        tip: { slot: 11, id: "tip" },
      },
    });
    socket!.emitMessage({
      id: "blaze-next-block",
      result: {
        direction: "forward",
        tip: { slot: 12, id: "abc" },
        block: { id: "block" },
      },
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "rollForward",
        point: { slot: 12, hash: "abc" },
        block: { id: "block" },
      },
    });
    expect(socket!.sent.map((value) => JSON.parse(value).method)).toEqual([
      "findIntersection",
      "nextBlock",
      "nextBlock",
    ]);
  });

  test("does not double-register addEventListener sockets", () => {
    let socket: EventListenerSocket | undefined;
    ogmiosChainSyncEvents({
      url: "ws://ogmios",
      socketFactory: () => {
        socket = new EventListenerSocket();
        return socket;
      },
    });

    socket!.emitOpen();

    expect(socket!.sent).toHaveLength(1);
    expect(socket!.onopen).toBeUndefined();
    expect(socket!.onmessage).toBeUndefined();
  });

  test("yields rollback events and applies event filters", async () => {
    let socket: FakeSocket | undefined;
    const events = ogmiosChainSyncEvents({
      url: "ws://ogmios",
      filter: { types: ["rollBackward"] },
      socketFactory: () => {
        socket = new FakeSocket();
        return socket;
      },
    });
    const iterator = events[Symbol.asyncIterator]();

    socket!.emitOpen();
    socket!.emitMessage({
      id: "blaze-find-intersection",
      result: {
        intersection: "origin",
        tip: { slot: 11, id: "tip" },
      },
    });
    socket!.emitMessage({
      id: "blaze-next-block",
      result: {
        direction: "forward",
        tip: { slot: 12, id: "abc" },
        block: { id: "block" },
      },
    });
    socket!.emitMessage({
      id: "blaze-next-block",
      result: {
        direction: "backward",
        point: { slot: 10, id: "rollback" },
      },
    });

    await expect(iterator.next()).resolves.toMatchObject({
      done: false,
      value: {
        type: "rollBackward",
        point: { slot: 10, hash: "rollback" },
      },
    });
  });

  test("closes the socket when the abort signal fires", async () => {
    let socket: FakeSocket | undefined;
    const controller = new AbortController();

    ogmiosChainSyncEvents({
      url: "ws://ogmios",
      signal: controller.signal,
      socketFactory: () => {
        socket = new FakeSocket();
        return socket;
      },
    });

    controller.abort();

    expect(socket!.closed).toBe(true);
  });

  test("closes immediately when created with an aborted signal", () => {
    let socket: FakeSocket | undefined;
    const controller = new AbortController();
    controller.abort();

    ogmiosChainSyncEvents({
      url: "ws://ogmios",
      signal: controller.signal,
      socketFactory: () => {
        socket = new FakeSocket();
        return socket;
      },
    });

    expect(socket!.closed).toBe(true);
  });

  test("closes the stream on malformed websocket messages", async () => {
    let socket: FakeSocket | undefined;
    const events = ogmiosChainSyncEvents({
      url: "ws://ogmios",
      socketFactory: () => {
        socket = new FakeSocket();
        return socket;
      },
    });
    const iterator = events[Symbol.asyncIterator]();

    socket!.emitRawMessage("{");

    expect(socket!.closed).toBe(true);
    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    });
  });
});
