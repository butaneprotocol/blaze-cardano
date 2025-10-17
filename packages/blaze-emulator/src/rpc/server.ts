import { serve } from '@hono/node-server';
import app from './app';

export interface RpcServerOptions {
  port?: number;
  hostname?: string;
}

export interface RpcServer {
  stop: () => void;
}

export const startRpcServer = ({
  port = 8787,
  hostname = '0.0.0.0',
}: RpcServerOptions = {}): RpcServer => {
  const server = serve({
    fetch: app.fetch,
    port,
    hostname,
  });

  return {
    stop: () => {
      server.close();
    },
  };
};
