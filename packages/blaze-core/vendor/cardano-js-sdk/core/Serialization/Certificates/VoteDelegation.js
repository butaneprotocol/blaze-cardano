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
var _VoteDelegation_credential, _VoteDelegation_dRep, _VoteDelegation_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { DRep } from './DRep/index.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { hexToBytes } from '../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class VoteDelegation {
    constructor(stakeCredential, dRep) {
        _VoteDelegation_credential.set(this, void 0);
        _VoteDelegation_dRep.set(this, void 0);
        _VoteDelegation_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _VoteDelegation_credential, stakeCredential, "f");
        __classPrivateFieldSet(this, _VoteDelegation_dRep, dRep, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _VoteDelegation_originalBytes, "f"))
            return __classPrivateFieldGet(this, _VoteDelegation_originalBytes, "f");
        writer.writeStartArray(3);
        writer.writeInt(CertificateKind.VoteDelegation);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _VoteDelegation_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _VoteDelegation_credential, "f").hash, 'hex'));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _VoteDelegation_dRep, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 3)
            throw new InvalidArgumentError('cbor', `Expected an array of 3 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.VoteDelegation)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.VoteDelegation}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const dRep = DRep.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        reader.readEndArray();
        const cert = new VoteDelegation({ hash, type }, dRep);
        __classPrivateFieldSet(cert, _VoteDelegation_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.VoteDelegation,
            dRep: __classPrivateFieldGet(this, _VoteDelegation_dRep, "f").toCore(),
            stakeCredential: __classPrivateFieldGet(this, _VoteDelegation_credential, "f")
        };
    }
    static fromCore(deleg) {
        return new VoteDelegation(deleg.stakeCredential, DRep.fromCore(deleg.dRep));
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _VoteDelegation_credential, "f");
    }
    dRep() {
        return __classPrivateFieldGet(this, _VoteDelegation_dRep, "f");
    }
}
_VoteDelegation_credential = new WeakMap(), _VoteDelegation_dRep = new WeakMap(), _VoteDelegation_originalBytes = new WeakMap();
