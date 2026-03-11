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
var _SingleHostAddr_port, _SingleHostAddr_ipV4, _SingleHostAddr_ipV6, _SingleHostAddr_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../../CBOR/index.js';
import { InvalidArgumentError } from "../../../../../deps/util.js";
import { byteArrayToIPv6String, byteArrayToIpV4String, ipV4StringToByteArray, ipV6StringToByteArray } from './ipUtils.js';
const EMBEDDED_GROUP_SIZE = 4;
const SINGLE_HOST_ADDR_RELAY_ID = 0;
export class SingleHostAddr {
    constructor(port, ipv4, ipv6) {
        _SingleHostAddr_port.set(this, void 0);
        _SingleHostAddr_ipV4.set(this, void 0);
        _SingleHostAddr_ipV6.set(this, void 0);
        _SingleHostAddr_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _SingleHostAddr_port, port, "f");
        __classPrivateFieldSet(this, _SingleHostAddr_ipV4, ipv4, "f");
        __classPrivateFieldSet(this, _SingleHostAddr_ipV6, ipv6, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _SingleHostAddr_originalBytes, "f"))
            return __classPrivateFieldGet(this, _SingleHostAddr_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(SINGLE_HOST_ADDR_RELAY_ID);
        __classPrivateFieldGet(this, _SingleHostAddr_port, "f") ? writer.writeInt(__classPrivateFieldGet(this, _SingleHostAddr_port, "f")) : writer.writeNull();
        __classPrivateFieldGet(this, _SingleHostAddr_ipV4, "f") ? writer.writeByteString(ipV4StringToByteArray(__classPrivateFieldGet(this, _SingleHostAddr_ipV4, "f"))) : writer.writeNull();
        __classPrivateFieldGet(this, _SingleHostAddr_ipV6, "f") ? writer.writeByteString(ipV6StringToByteArray(__classPrivateFieldGet(this, _SingleHostAddr_ipV6, "f"))) : writer.writeNull();
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const id = Number(reader.readInt());
        if (id !== SINGLE_HOST_ADDR_RELAY_ID)
            throw new InvalidArgumentError('cbor', `Expected SingleHostAddr id ${SINGLE_HOST_ADDR_RELAY_ID}, but got ${id}`);
        let port;
        let ipV4;
        let ipV6;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
            port = undefined;
        }
        else {
            port = reader.readInt();
        }
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
            ipV4 = undefined;
        }
        else {
            ipV4 = byteArrayToIpV4String(reader.readByteString());
        }
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
            ipV6 = undefined;
        }
        else {
            ipV6 = byteArrayToIPv6String(reader.readByteString());
        }
        const relay = new SingleHostAddr(port ? Number(port) : undefined, ipV4, ipV6);
        __classPrivateFieldSet(relay, _SingleHostAddr_originalBytes, cbor, "f");
        return relay;
    }
    toCore() {
        return {
            __typename: 'RelayByAddress',
            ipv4: __classPrivateFieldGet(this, _SingleHostAddr_ipV4, "f"),
            ipv6: __classPrivateFieldGet(this, _SingleHostAddr_ipV6, "f"),
            port: __classPrivateFieldGet(this, _SingleHostAddr_port, "f")
        };
    }
    static fromCore(relay) {
        return new SingleHostAddr(relay.port, relay.ipv4, relay.ipv6);
    }
    port() {
        return __classPrivateFieldGet(this, _SingleHostAddr_port, "f");
    }
    setPort(port) {
        __classPrivateFieldSet(this, _SingleHostAddr_port, port, "f");
        __classPrivateFieldSet(this, _SingleHostAddr_originalBytes, undefined, "f");
    }
    ipv4() {
        return __classPrivateFieldGet(this, _SingleHostAddr_ipV4, "f");
    }
    setIpv4(ipV4) {
        __classPrivateFieldSet(this, _SingleHostAddr_ipV4, ipV4, "f");
        __classPrivateFieldSet(this, _SingleHostAddr_originalBytes, undefined, "f");
    }
    ipv6() {
        return __classPrivateFieldGet(this, _SingleHostAddr_ipV6, "f");
    }
    setIpv6(ipV6) {
        __classPrivateFieldSet(this, _SingleHostAddr_ipV6, ipV6, "f");
        __classPrivateFieldSet(this, _SingleHostAddr_originalBytes, undefined, "f");
    }
}
_SingleHostAddr_port = new WeakMap(), _SingleHostAddr_ipV4 = new WeakMap(), _SingleHostAddr_ipV6 = new WeakMap(), _SingleHostAddr_originalBytes = new WeakMap();
