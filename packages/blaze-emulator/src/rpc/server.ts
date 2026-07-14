import { serve } from "@hono/node-server";
import app from "./app";

export interface RpcServerOptions {
  port?: number;
  hostname?: string;
}

export interface RpcServer {
  ready: Promise<void>;
  stop: () => void;
}

export const startRpcServer = ({
  port = 8787,
  hostname = "127.0.0.1",
}: RpcServerOptions = {}): RpcServer => {
  const server = serve({
    fetch: app.fetch,
    port,
    hostname,
  });
  const ready = new Promise<void>((resolve, reject) => {
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    server.once("listening", onListening);
    server.once("error", onError);
  });

  return {
    ready,
    stop: () => {
      server.close();
    },
  };
};
