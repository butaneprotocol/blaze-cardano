import { type Ed25519PrivateKey } from "@blaze-cardano/core";
import { type CIP30DataSignature } from "./types";
export declare function signData(addressHex: string, payload: string, privateKey: Ed25519PrivateKey): Promise<CIP30DataSignature>;
//# sourceMappingURL=utils.d.ts.map