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
var _StakeRegistration_credential, _StakeRegistration_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 2;
export class StakeRegistration {
    constructor(credential) {
        _StakeRegistration_credential.set(this, void 0);
        _StakeRegistration_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _StakeRegistration_credential, credential, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _StakeRegistration_originalBytes, "f"))
            return __classPrivateFieldGet(this, _StakeRegistration_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(CertificateKind.StakeRegistration);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _StakeRegistration_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeRegistration_credential, "f").hash, 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.StakeRegistration)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.StakeRegistration}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        reader.readEndArray();
        const cert = new StakeRegistration({ hash, type });
        __classPrivateFieldSet(cert, _StakeRegistration_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.StakeRegistration,
            stakeCredential: __classPrivateFieldGet(this, _StakeRegistration_credential, "f")
        };
    }
    static fromCore(cert) {
        return new StakeRegistration(cert.stakeCredential);
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _StakeRegistration_credential, "f");
    }
    setStakeCredential(credential) {
        __classPrivateFieldSet(this, _StakeRegistration_credential, credential, "f");
        __classPrivateFieldSet(this, _StakeRegistration_originalBytes, undefined, "f");
    }
}
_StakeRegistration_credential = new WeakMap(), _StakeRegistration_originalBytes = new WeakMap();
