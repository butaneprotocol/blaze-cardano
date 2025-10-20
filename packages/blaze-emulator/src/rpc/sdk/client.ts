import { hc } from "hono/client";
import type app from "../app";

export type EmulatorRpcClient = ReturnType<typeof hc<typeof app>>;

export const createEmulatorRpcClient = (baseUrl: string): EmulatorRpcClient =>
  hc<typeof app>(baseUrl);
