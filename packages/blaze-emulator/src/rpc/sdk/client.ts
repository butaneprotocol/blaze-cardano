import { hc } from "hono/client";
import type { AppType } from "../app";

export const createEmulatorRpcClient = (baseUrl: string) =>
  hc<AppType>(baseUrl);

export type EmulatorRpcClient = ReturnType<typeof createEmulatorRpcClient>;
