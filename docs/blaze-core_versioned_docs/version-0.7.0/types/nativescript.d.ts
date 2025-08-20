import { NativeScript, type NetworkId, type Slot, type Address } from "./types";
export declare function allOf(...addresses: NativeScript[]): NativeScript;
export declare function anyOf(...addresses: NativeScript[]): NativeScript;
export declare function atLeastNOfK(n: number, ...addresses: NativeScript[]): NativeScript;
export declare function justAddress(address: string, networkId: NetworkId): NativeScript;
export declare function before(slot: Slot): NativeScript;
export declare function after(slot: Slot): NativeScript;
export declare function address(ns: NativeScript, networkId: NetworkId): Address;
//# sourceMappingURL=nativescript.d.ts.map