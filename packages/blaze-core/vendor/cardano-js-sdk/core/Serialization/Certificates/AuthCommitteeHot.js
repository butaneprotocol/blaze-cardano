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
var _AuthCommitteeHot_committeeColdCred, _AuthCommitteeHot_committeeHotCred, _AuthCommitteeHot_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
const EMBEDDED_GROUP_SIZE = 2;
export class AuthCommitteeHot {
    constructor(committeeColdCred, committeeHotCred) {
        _AuthCommitteeHot_committeeColdCred.set(this, void 0);
        _AuthCommitteeHot_committeeHotCred.set(this, void 0);
        _AuthCommitteeHot_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _AuthCommitteeHot_committeeColdCred, committeeColdCred, "f");
        __classPrivateFieldSet(this, _AuthCommitteeHot_committeeHotCred, committeeHotCred, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _AuthCommitteeHot_originalBytes, "f"))
            return __classPrivateFieldGet(this, _AuthCommitteeHot_originalBytes, "f");
        writer.writeStartArray(3);
        writer.writeInt(CertificateKind.AuthCommitteeHot);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _AuthCommitteeHot_committeeColdCred, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _AuthCommitteeHot_committeeColdCred, "f").hash, 'hex'));
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _AuthCommitteeHot_committeeHotCred, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _AuthCommitteeHot_committeeHotCred, "f").hash, 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 3)
            throw new InvalidArgumentError('cbor', `Expected an array of 3 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.AuthCommitteeHot)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.AuthCommitteeHot}, but got ${kind}`);
        const coldCredLength = reader.readStartArray();
        if (coldCredLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const coldType = Number(reader.readInt());
        const coldHash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const hotCredLength = reader.readStartArray();
        if (hotCredLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const hotType = Number(reader.readInt());
        const hotHash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        reader.readEndArray();
        const cert = new AuthCommitteeHot({ hash: coldHash, type: coldType }, { hash: hotHash, type: hotType });
        __classPrivateFieldSet(cert, _AuthCommitteeHot_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.AuthorizeCommitteeHot,
            coldCredential: __classPrivateFieldGet(this, _AuthCommitteeHot_committeeColdCred, "f"),
            hotCredential: __classPrivateFieldGet(this, _AuthCommitteeHot_committeeHotCred, "f")
        };
    }
    static fromCore(cert) {
        return new AuthCommitteeHot(cert.coldCredential, cert.hotCredential);
    }
    coldCredential() {
        return __classPrivateFieldGet(this, _AuthCommitteeHot_committeeColdCred, "f");
    }
    hotCredential() {
        return __classPrivateFieldGet(this, _AuthCommitteeHot_committeeHotCred, "f");
    }
}
_AuthCommitteeHot_committeeColdCred = new WeakMap(), _AuthCommitteeHot_committeeHotCred = new WeakMap(), _AuthCommitteeHot_originalBytes = new WeakMap();
