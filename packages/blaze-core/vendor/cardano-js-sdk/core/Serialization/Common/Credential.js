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
var _Credential_value;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { hexToBytes } from '../../util/misc/index.js';
const CREDENTIAL_ARRAY_SIZE = 2;
export class Credential {
    constructor(value) {
        _Credential_value.set(this, void 0);
        __classPrivateFieldSet(this, _Credential_value, value, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        writer.writeStartArray(CREDENTIAL_ARRAY_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _Credential_value, "f").type);
        writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _Credential_value, "f").hash));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        if (reader.readStartArray() !== CREDENTIAL_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${CREDENTIAL_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readUInt());
        const hash = HexBlob.fromBytes(reader.readByteString());
        reader.readEndArray();
        return new Credential({ hash, type });
    }
    toCore() {
        return { ...__classPrivateFieldGet(this, _Credential_value, "f") };
    }
    static fromCore(credential) {
        return new Credential({ ...credential });
    }
    value() {
        return { ...__classPrivateFieldGet(this, _Credential_value, "f") };
    }
}
_Credential_value = new WeakMap();
