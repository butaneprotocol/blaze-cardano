var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Hash_value;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob } from "../../../deps/util.js";
export class Hash {
    constructor(value) {
        _Hash_value.set(this, void 0);
        __classPrivateFieldSet(this, _Hash_value, value, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _Hash_value, "f"), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        return new Hash(HexBlob.fromBytes(reader.readByteString()));
    }
    toCore() {
        return __classPrivateFieldGet(this, _Hash_value, "f");
    }
    static fromCore(hash) {
        return new Hash(hash);
    }
    value() {
        return __classPrivateFieldGet(this, _Hash_value, "f");
    }
}
_Hash_value = new WeakMap();
