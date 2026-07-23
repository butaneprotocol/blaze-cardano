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
var _SingleHostName_port, _SingleHostName_dnsName, _SingleHostName_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../../../CBOR/index.js';
import { InvalidArgumentError } from "../../../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 3;
const SINGLE_HOST_NAME_RELAY_ID = 1;
const MAX_DNS_SIZE_STR_LENGTH = 64;
export class SingleHostName {
    constructor(dnsName, port) {
        _SingleHostName_port.set(this, void 0);
        _SingleHostName_dnsName.set(this, void 0);
        _SingleHostName_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _SingleHostName_port, port, "f");
        if (dnsName.length > MAX_DNS_SIZE_STR_LENGTH)
            throw new InvalidArgumentError('dnsName', `dnsName must be less or equal to 64 characters long, actual size ${dnsName.length}`);
        __classPrivateFieldSet(this, _SingleHostName_dnsName, dnsName, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _SingleHostName_originalBytes, "f"))
            return __classPrivateFieldGet(this, _SingleHostName_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(SINGLE_HOST_NAME_RELAY_ID);
        __classPrivateFieldGet(this, _SingleHostName_port, "f") ? writer.writeInt(__classPrivateFieldGet(this, _SingleHostName_port, "f")) : writer.writeNull();
        writer.writeTextString(__classPrivateFieldGet(this, _SingleHostName_dnsName, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const id = Number(reader.readInt());
        if (id !== SINGLE_HOST_NAME_RELAY_ID)
            throw new InvalidArgumentError('cbor', `Expected SingleHostName id ${SINGLE_HOST_NAME_RELAY_ID}, but got ${id}`);
        let port;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
            port = undefined;
        }
        else {
            port = reader.readInt();
        }
        const dnsName = reader.readTextString();
        const relay = new SingleHostName(dnsName, port ? Number(port) : undefined);
        __classPrivateFieldSet(relay, _SingleHostName_originalBytes, cbor, "f");
        return relay;
    }
    toCore() {
        return {
            __typename: 'RelayByName',
            hostname: __classPrivateFieldGet(this, _SingleHostName_dnsName, "f"),
            port: __classPrivateFieldGet(this, _SingleHostName_port, "f")
        };
    }
    static fromCore(relay) {
        return new SingleHostName(relay.hostname, relay.port);
    }
    port() {
        return __classPrivateFieldGet(this, _SingleHostName_port, "f");
    }
    setPort(port) {
        __classPrivateFieldSet(this, _SingleHostName_port, port, "f");
        __classPrivateFieldSet(this, _SingleHostName_originalBytes, undefined, "f");
    }
    dnsName() {
        return __classPrivateFieldGet(this, _SingleHostName_dnsName, "f");
    }
    setDnsName(dnsName) {
        if (dnsName.length > MAX_DNS_SIZE_STR_LENGTH)
            throw new InvalidArgumentError('dnsName', `dnsName must be less or equal to 64 characters long, actual size ${dnsName.length}`);
        __classPrivateFieldSet(this, _SingleHostName_dnsName, dnsName, "f");
        __classPrivateFieldSet(this, _SingleHostName_originalBytes, undefined, "f");
    }
}
_SingleHostName_port = new WeakMap(), _SingleHostName_dnsName = new WeakMap(), _SingleHostName_originalBytes = new WeakMap();
