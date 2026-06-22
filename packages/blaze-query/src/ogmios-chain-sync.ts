import {
  AsyncEventQueue,
  chainEventMatches,
  type ChainEvent,
  type ChainEventFilter,
  type ChainPoint,
} from "./events";

/** @public */
export type WebSocketLike = {
  send(data: string): void;
  close(): void;
  addEventListener?(
    type: "open" | "message" | "error" | "close",
    listener: (event: unknown) => void,
  ): void;
  onopen?: (event: unknown) => void;
  onmessage?: (event: { data: unknown }) => void;
  onerror?: (event: unknown) => void;
  onclose?: (event: unknown) => void;
};

type SocketEventName = "open" | "message" | "error" | "close";

/** @public */
export type OgmiosChainSyncOptions = {
  url: string;
  filter?: ChainEventFilter;
  signal?: AbortSignal;
  socketFactory?: (url: string) => WebSocketLike;
};

const FIND_INTERSECTION_ID = "blaze-find-intersection";
const NEXT_BLOCK_ID = "blaze-next-block";

const openRequest = () =>
  JSON.stringify({
    jsonrpc: "2.0",
    method: "findIntersection",
    params: { points: ["origin"] },
    id: FIND_INTERSECTION_ID,
  });

const nextBlockRequest = () =>
  JSON.stringify({
    jsonrpc: "2.0",
    method: "nextBlock",
    id: NEXT_BLOCK_ID,
  });

const asPoint = (value: unknown): ChainPoint | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const point = value as Record<string, unknown>;
  const slot = Number(point["slot"]);
  const hash =
    typeof point["hash"] === "string"
      ? point["hash"]
      : typeof point["id"] === "string"
        ? point["id"]
        : undefined;
  if (!Number.isFinite(slot) || !hash) return undefined;
  return { slot, hash };
};

const listen = (
  socket: WebSocketLike,
  type: SocketEventName,
  listener: (event: unknown) => void,
): void => {
  if (socket.addEventListener) {
    socket.addEventListener(type, listener);
    return;
  }

  if (type === "open") socket.onopen = listener;
  if (type === "message") {
    socket.onmessage = listener as (event: { data: unknown }) => void;
  }
  if (type === "error") socket.onerror = listener;
  if (type === "close") socket.onclose = listener;
};

/** @public */
export const ogmiosChainSyncEvents = (
  input: OgmiosChainSyncOptions,
): AsyncIterable<ChainEvent> => {
  const { url, filter, signal, socketFactory } = input;
  const queue = new AsyncEventQueue<ChainEvent>();
  const socket =
    socketFactory?.(url) ?? (new WebSocket(url) as unknown as WebSocketLike);

  const sendNext = () => socket.send(nextBlockRequest());
  const close = () => {
    socket.close();
    queue.close();
  };

  const onOpen = () => {
    socket.send(openRequest());
  };

  const onMessage = (event: { data: unknown }) => {
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(String(event.data)) as Record<string, unknown>;
    } catch {
      close();
      return;
    }
    if (payload["error"]) {
      close();
      return;
    }
    const result = payload["result"] as Record<string, unknown> | undefined;
    if (payload["id"] === FIND_INTERSECTION_ID) {
      sendNext();
      return;
    }
    if (!result) return;

    const direction = result?.["direction"];
    if (direction === "forward" || "block" in (result ?? {})) {
      const point = asPoint(result?.["tip"]) ??
        asPoint(
          (result?.["block"] as Record<string, unknown> | undefined)?.["id"],
        ) ?? {
          slot: 0,
          hash: "unknown",
        };
      const chainEvent: ChainEvent = {
        type: "rollForward",
        point,
        block: result?.["block"],
      };
      if (chainEventMatches(chainEvent, filter)) queue.push(chainEvent);
    } else if (direction === "backward" || "point" in (result ?? {})) {
      const point = asPoint(result?.["point"]) ?? "origin";
      const chainEvent: ChainEvent = { type: "rollBackward", point };
      if (chainEventMatches(chainEvent, filter)) queue.push(chainEvent);
    }
    if (!signal?.aborted) sendNext();
  };

  const onError = () => close();
  const onClose = () => queue.close();

  listen(socket, "open", onOpen);
  listen(socket, "message", (event) => onMessage(event as { data: unknown }));
  listen(socket, "error", onError);
  listen(socket, "close", onClose);
  signal?.addEventListener("abort", close, { once: true });
  if (signal?.aborted) close();

  return queue;
};
