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
var _ProtocolVersion_major, _ProtocolVersion_minor, _ProtocolVersion_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { InvalidArgumentError } from '@cardano-sdk/util';
const PROTOCOL_VERSION_ARRAY_SIZE = 2;
export class ProtocolVersion {
    constructor(major, minor) {
        _ProtocolVersion_major.set(this, void 0);
        _ProtocolVersion_minor.set(this, void 0);
        _ProtocolVersion_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _ProtocolVersion_major, major, "f");
        __classPrivateFieldSet(this, _ProtocolVersion_minor, minor, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ProtocolVersion_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ProtocolVersion_originalBytes, "f");
        writer.writeStartArray(PROTOCOL_VERSION_ARRAY_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _ProtocolVersion_major, "f"));
        writer.writeInt(__classPrivateFieldGet(this, _ProtocolVersion_minor, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== PROTOCOL_VERSION_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${PROTOCOL_VERSION_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const major = Number(reader.readInt());
        const minor = Number(reader.readInt());
        reader.readEndArray();
        const version = new ProtocolVersion(major, minor);
        __classPrivateFieldSet(version, _ProtocolVersion_originalBytes, cbor, "f");
        return version;
    }
    toCore() {
        return {
            major: Number(__classPrivateFieldGet(this, _ProtocolVersion_major, "f")),
            minor: Number(__classPrivateFieldGet(this, _ProtocolVersion_minor, "f"))
        };
    }
    static fromCore(version) {
        return new ProtocolVersion(version.major, version.minor);
    }
    major() {
        return __classPrivateFieldGet(this, _ProtocolVersion_major, "f");
    }
    setMajor(major) {
        __classPrivateFieldSet(this, _ProtocolVersion_major, major, "f");
        __classPrivateFieldSet(this, _ProtocolVersion_originalBytes, undefined, "f");
    }
    minor() {
        return __classPrivateFieldGet(this, _ProtocolVersion_minor, "f");
    }
    setMinor(minor) {
        __classPrivateFieldSet(this, _ProtocolVersion_minor, minor, "f");
        __classPrivateFieldSet(this, _ProtocolVersion_originalBytes, undefined, "f");
    }
}
_ProtocolVersion_major = new WeakMap(), _ProtocolVersion_minor = new WeakMap(), _ProtocolVersion_originalBytes = new WeakMap();
