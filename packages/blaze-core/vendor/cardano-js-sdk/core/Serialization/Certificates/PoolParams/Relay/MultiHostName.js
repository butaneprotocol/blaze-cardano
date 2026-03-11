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
var _MultiHostName_dnsName, _MultiHostName_originalBytes;
import { CborReader, CborWriter } from '../../../CBOR/index.js';
import { InvalidArgumentError } from "../../../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 2;
const MULTI_HOST_NAME_RELAY_ID = 2;
const MAX_DNS_SIZE_STR_LENGTH = 64;
export class MultiHostName {
    constructor(dnsName) {
        _MultiHostName_dnsName.set(this, void 0);
        _MultiHostName_originalBytes.set(this, undefined);
        if (dnsName.length > MAX_DNS_SIZE_STR_LENGTH)
            throw new InvalidArgumentError('dnsName', `dnsName must be less or equal to 64 characters long, actual size ${dnsName.length}`);
        __classPrivateFieldSet(this, _MultiHostName_dnsName, dnsName, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _MultiHostName_originalBytes, "f"))
            return __classPrivateFieldGet(this, _MultiHostName_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(MULTI_HOST_NAME_RELAY_ID);
        writer.writeTextString(__classPrivateFieldGet(this, _MultiHostName_dnsName, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const id = Number(reader.readInt());
        if (id !== MULTI_HOST_NAME_RELAY_ID)
            throw new InvalidArgumentError('cbor', `Expected MultiHostName id ${MULTI_HOST_NAME_RELAY_ID}, but got ${id}`);
        const dnsName = reader.readTextString();
        const relay = new MultiHostName(dnsName);
        __classPrivateFieldSet(relay, _MultiHostName_originalBytes, cbor, "f");
        return relay;
    }
    toCore() {
        return {
            __typename: 'RelayByNameMultihost',
            dnsName: __classPrivateFieldGet(this, _MultiHostName_dnsName, "f")
        };
    }
    static fromCore(relay) {
        return new MultiHostName(relay.dnsName);
    }
    dnsName() {
        return __classPrivateFieldGet(this, _MultiHostName_dnsName, "f");
    }
    setDnsName(dnsName) {
        if (dnsName.length > MAX_DNS_SIZE_STR_LENGTH)
            throw new InvalidArgumentError('dnsName', `dnsName must be less or equal to 64 characters long, actual size ${dnsName.length}`);
        __classPrivateFieldSet(this, _MultiHostName_dnsName, dnsName, "f");
        __classPrivateFieldSet(this, _MultiHostName_originalBytes, undefined, "f");
    }
}
_MultiHostName_dnsName = new WeakMap(), _MultiHostName_originalBytes = new WeakMap();
