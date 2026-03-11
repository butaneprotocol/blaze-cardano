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
var _Registration_credential, _Registration_deposit, _Registration_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
const EMBEDDED_GROUP_SIZE = 2;
export class Registration {
    constructor(credential, deposit) {
        _Registration_credential.set(this, void 0);
        _Registration_deposit.set(this, void 0);
        _Registration_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Registration_credential, credential, "f");
        __classPrivateFieldSet(this, _Registration_deposit, deposit, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Registration_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Registration_originalBytes, "f");
        writer.writeStartArray(3);
        writer.writeInt(CertificateKind.Registration);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _Registration_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _Registration_credential, "f").hash, 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _Registration_deposit, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 3)
            throw new InvalidArgumentError('cbor', `Expected an array of 3 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.Registration)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.Registration}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const deposit = reader.readInt();
        reader.readEndArray();
        const cert = new Registration({ hash, type }, deposit);
        __classPrivateFieldSet(cert, _Registration_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.Registration,
            deposit: __classPrivateFieldGet(this, _Registration_deposit, "f"),
            stakeCredential: __classPrivateFieldGet(this, _Registration_credential, "f")
        };
    }
    static fromCore(cert) {
        return new Registration(cert.stakeCredential, cert.deposit);
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _Registration_credential, "f");
    }
    setStakeCredential(credential) {
        __classPrivateFieldSet(this, _Registration_credential, credential, "f");
        __classPrivateFieldSet(this, _Registration_originalBytes, undefined, "f");
    }
    deposit() {
        return __classPrivateFieldGet(this, _Registration_deposit, "f");
    }
    setDeposit(deposit) {
        __classPrivateFieldSet(this, _Registration_deposit, deposit, "f");
        __classPrivateFieldSet(this, _Registration_originalBytes, undefined, "f");
    }
}
_Registration_credential = new WeakMap(), _Registration_deposit = new WeakMap(), _Registration_originalBytes = new WeakMap();
