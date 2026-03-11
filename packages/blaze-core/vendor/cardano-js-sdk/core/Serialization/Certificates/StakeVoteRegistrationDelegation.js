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
var _StakeVoteRegistrationDelegation_credential, _StakeVoteRegistrationDelegation_dRep, _StakeVoteRegistrationDelegation_poolKeyHash, _StakeVoteRegistrationDelegation_deposit, _StakeVoteRegistrationDelegation_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { DRep } from './DRep/index.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { PoolId } from '../../Cardano/types/StakePool/index.js';
import { hexToBytes } from '../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class StakeVoteRegistrationDelegation {
    constructor(stakeCredential, deposit, dRep, poolKeyHash) {
        _StakeVoteRegistrationDelegation_credential.set(this, void 0);
        _StakeVoteRegistrationDelegation_dRep.set(this, void 0);
        _StakeVoteRegistrationDelegation_poolKeyHash.set(this, void 0);
        _StakeVoteRegistrationDelegation_deposit.set(this, void 0);
        _StakeVoteRegistrationDelegation_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _StakeVoteRegistrationDelegation_credential, stakeCredential, "f");
        __classPrivateFieldSet(this, _StakeVoteRegistrationDelegation_deposit, deposit, "f");
        __classPrivateFieldSet(this, _StakeVoteRegistrationDelegation_dRep, dRep, "f");
        __classPrivateFieldSet(this, _StakeVoteRegistrationDelegation_poolKeyHash, poolKeyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_originalBytes, "f"))
            return __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_originalBytes, "f");
        writer.writeStartArray(5);
        writer.writeInt(CertificateKind.StakeVoteRegistrationDelegation);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_credential, "f").hash, 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_poolKeyHash, "f"), 'hex'));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_dRep, "f").toCbor()));
        writer.writeInt(__classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_deposit, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 5)
            throw new InvalidArgumentError('cbor', `Expected an array of 5 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.StakeVoteRegistrationDelegation)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.StakeVoteRegistrationDelegation}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const poolKeyHash = Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(reader.readByteString()));
        const dRep = DRep.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const deposit = reader.readInt();
        reader.readEndArray();
        const cert = new StakeVoteRegistrationDelegation({ hash, type }, deposit, dRep, poolKeyHash);
        __classPrivateFieldSet(cert, _StakeVoteRegistrationDelegation_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.StakeVoteRegistrationDelegation,
            dRep: __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_dRep, "f").toCore(),
            deposit: __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_deposit, "f"),
            poolId: PoolId.fromKeyHash(__classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_poolKeyHash, "f")),
            stakeCredential: __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_credential, "f")
        };
    }
    static fromCore(deleg) {
        return new StakeVoteRegistrationDelegation(deleg.stakeCredential, deleg.deposit, DRep.fromCore(deleg.dRep), PoolId.toKeyHash(deleg.poolId));
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_credential, "f");
    }
    deposit() {
        return __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_deposit, "f");
    }
    dRep() {
        return __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_dRep, "f");
    }
    poolKeyHash() {
        return __classPrivateFieldGet(this, _StakeVoteRegistrationDelegation_poolKeyHash, "f");
    }
}
_StakeVoteRegistrationDelegation_credential = new WeakMap(), _StakeVoteRegistrationDelegation_dRep = new WeakMap(), _StakeVoteRegistrationDelegation_poolKeyHash = new WeakMap(), _StakeVoteRegistrationDelegation_deposit = new WeakMap(), _StakeVoteRegistrationDelegation_originalBytes = new WeakMap();
