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
var _VoteRegistrationDelegation_credential, _VoteRegistrationDelegation_dRep, _VoteRegistrationDelegation_deposit, _VoteRegistrationDelegation_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { DRep } from './DRep/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { hexToBytes } from '../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class VoteRegistrationDelegation {
    constructor(stakeCredential, deposit, dRep) {
        _VoteRegistrationDelegation_credential.set(this, void 0);
        _VoteRegistrationDelegation_dRep.set(this, void 0);
        _VoteRegistrationDelegation_deposit.set(this, void 0);
        _VoteRegistrationDelegation_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _VoteRegistrationDelegation_credential, stakeCredential, "f");
        __classPrivateFieldSet(this, _VoteRegistrationDelegation_deposit, deposit, "f");
        __classPrivateFieldSet(this, _VoteRegistrationDelegation_dRep, dRep, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _VoteRegistrationDelegation_originalBytes, "f"))
            return __classPrivateFieldGet(this, _VoteRegistrationDelegation_originalBytes, "f");
        writer.writeStartArray(4);
        writer.writeInt(CertificateKind.VoteRegistrationDelegation);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _VoteRegistrationDelegation_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _VoteRegistrationDelegation_credential, "f").hash, 'hex'));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _VoteRegistrationDelegation_dRep, "f").toCbor()));
        writer.writeInt(__classPrivateFieldGet(this, _VoteRegistrationDelegation_deposit, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 4)
            throw new InvalidArgumentError('cbor', `Expected an array of 4 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.VoteRegistrationDelegation)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.VoteRegistrationDelegation}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const dRep = DRep.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const deposit = reader.readInt();
        reader.readEndArray();
        const cert = new VoteRegistrationDelegation({ hash, type }, deposit, dRep);
        __classPrivateFieldSet(cert, _VoteRegistrationDelegation_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.VoteRegistrationDelegation,
            dRep: __classPrivateFieldGet(this, _VoteRegistrationDelegation_dRep, "f").toCore(),
            deposit: __classPrivateFieldGet(this, _VoteRegistrationDelegation_deposit, "f"),
            stakeCredential: __classPrivateFieldGet(this, _VoteRegistrationDelegation_credential, "f")
        };
    }
    static fromCore(deleg) {
        return new VoteRegistrationDelegation(deleg.stakeCredential, deleg.deposit, DRep.fromCore(deleg.dRep));
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _VoteRegistrationDelegation_credential, "f");
    }
    deposit() {
        return __classPrivateFieldGet(this, _VoteRegistrationDelegation_deposit, "f");
    }
    dRep() {
        return __classPrivateFieldGet(this, _VoteRegistrationDelegation_dRep, "f");
    }
}
_VoteRegistrationDelegation_credential = new WeakMap(), _VoteRegistrationDelegation_dRep = new WeakMap(), _VoteRegistrationDelegation_deposit = new WeakMap(), _VoteRegistrationDelegation_originalBytes = new WeakMap();
