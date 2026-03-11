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
var _StakeDeregistration_credential, _StakeDeregistration_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 2;
export class StakeDeregistration {
    constructor(credential) {
        _StakeDeregistration_credential.set(this, void 0);
        _StakeDeregistration_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _StakeDeregistration_credential, credential, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _StakeDeregistration_originalBytes, "f"))
            return __classPrivateFieldGet(this, _StakeDeregistration_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(CertificateKind.StakeDeregistration);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _StakeDeregistration_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeDeregistration_credential, "f").hash, 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.StakeDeregistration)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.StakeDeregistration}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        reader.readEndArray();
        const cert = new StakeDeregistration({ hash, type });
        __classPrivateFieldSet(cert, _StakeDeregistration_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.StakeDeregistration,
            stakeCredential: __classPrivateFieldGet(this, _StakeDeregistration_credential, "f")
        };
    }
    static fromCore(cert) {
        return new StakeDeregistration(cert.stakeCredential);
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _StakeDeregistration_credential, "f");
    }
    setStakeCredential(credential) {
        __classPrivateFieldSet(this, _StakeDeregistration_credential, credential, "f");
        __classPrivateFieldSet(this, _StakeDeregistration_originalBytes, undefined, "f");
    }
}
_StakeDeregistration_credential = new WeakMap(), _StakeDeregistration_originalBytes = new WeakMap();
