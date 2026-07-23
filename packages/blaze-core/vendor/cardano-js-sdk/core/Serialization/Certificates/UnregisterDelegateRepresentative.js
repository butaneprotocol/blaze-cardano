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
var _UnregisterDelegateRepresentative_drepCredential, _UnregisterDelegateRepresentative_deposit, _UnregisterDelegateRepresentative_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
const EMBEDDED_GROUP_SIZE = 2;
export class UnregisterDelegateRepresentative {
    constructor(drepCredential, deposit) {
        _UnregisterDelegateRepresentative_drepCredential.set(this, void 0);
        _UnregisterDelegateRepresentative_deposit.set(this, void 0);
        _UnregisterDelegateRepresentative_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _UnregisterDelegateRepresentative_drepCredential, drepCredential, "f");
        __classPrivateFieldSet(this, _UnregisterDelegateRepresentative_deposit, deposit, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _UnregisterDelegateRepresentative_originalBytes, "f"))
            return __classPrivateFieldGet(this, _UnregisterDelegateRepresentative_originalBytes, "f");
        writer.writeStartArray(3);
        writer.writeInt(CertificateKind.DrepUnregistration);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _UnregisterDelegateRepresentative_drepCredential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _UnregisterDelegateRepresentative_drepCredential, "f").hash, 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _UnregisterDelegateRepresentative_deposit, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 3)
            throw new InvalidArgumentError('cbor', `Expected an array of 3 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.DrepUnregistration)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.DrepUnregistration}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const deposit = reader.readInt();
        reader.readEndArray();
        const cert = new UnregisterDelegateRepresentative({ hash, type }, deposit);
        __classPrivateFieldSet(cert, _UnregisterDelegateRepresentative_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.UnregisterDelegateRepresentative,
            dRepCredential: __classPrivateFieldGet(this, _UnregisterDelegateRepresentative_drepCredential, "f"),
            deposit: __classPrivateFieldGet(this, _UnregisterDelegateRepresentative_deposit, "f")
        };
    }
    static fromCore(cert) {
        return new UnregisterDelegateRepresentative(cert.dRepCredential, cert.deposit);
    }
    credential() {
        return __classPrivateFieldGet(this, _UnregisterDelegateRepresentative_drepCredential, "f");
    }
    deposit() {
        return __classPrivateFieldGet(this, _UnregisterDelegateRepresentative_deposit, "f");
    }
}
_UnregisterDelegateRepresentative_drepCredential = new WeakMap(), _UnregisterDelegateRepresentative_deposit = new WeakMap(), _UnregisterDelegateRepresentative_originalBytes = new WeakMap();
