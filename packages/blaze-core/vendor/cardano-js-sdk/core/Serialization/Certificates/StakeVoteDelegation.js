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
var _StakeVoteDelegation_credential, _StakeVoteDelegation_poolKeyHash, _StakeVoteDelegation_dRep, _StakeVoteDelegation_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { DRep } from './DRep/index.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { PoolId } from '../../Cardano/types/StakePool/index.js';
import { hexToBytes } from '../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class StakeVoteDelegation {
    constructor(stakeCredential, drep, poolKeyHash) {
        _StakeVoteDelegation_credential.set(this, void 0);
        _StakeVoteDelegation_poolKeyHash.set(this, void 0);
        _StakeVoteDelegation_dRep.set(this, void 0);
        _StakeVoteDelegation_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _StakeVoteDelegation_credential, stakeCredential, "f");
        __classPrivateFieldSet(this, _StakeVoteDelegation_dRep, drep, "f");
        __classPrivateFieldSet(this, _StakeVoteDelegation_poolKeyHash, poolKeyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _StakeVoteDelegation_originalBytes, "f"))
            return __classPrivateFieldGet(this, _StakeVoteDelegation_originalBytes, "f");
        writer.writeStartArray(4);
        writer.writeInt(CertificateKind.StakeVoteDelegation);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _StakeVoteDelegation_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeVoteDelegation_credential, "f").hash, 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeVoteDelegation_poolKeyHash, "f"), 'hex'));
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _StakeVoteDelegation_dRep, "f").toCbor()));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 4)
            throw new InvalidArgumentError('cbor', `Expected an array of 4 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.StakeVoteDelegation)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.StakeVoteDelegation}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const poolKeyHash = Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(reader.readByteString()));
        const dRep = DRep.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        reader.readEndArray();
        const cert = new StakeVoteDelegation({ hash, type }, dRep, poolKeyHash);
        __classPrivateFieldSet(cert, _StakeVoteDelegation_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.StakeVoteDelegation,
            dRep: __classPrivateFieldGet(this, _StakeVoteDelegation_dRep, "f").toCore(),
            poolId: PoolId.fromKeyHash(__classPrivateFieldGet(this, _StakeVoteDelegation_poolKeyHash, "f")),
            stakeCredential: __classPrivateFieldGet(this, _StakeVoteDelegation_credential, "f")
        };
    }
    static fromCore(deleg) {
        return new StakeVoteDelegation(deleg.stakeCredential, DRep.fromCore(deleg.dRep), PoolId.toKeyHash(deleg.poolId));
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _StakeVoteDelegation_credential, "f");
    }
    drep() {
        return __classPrivateFieldGet(this, _StakeVoteDelegation_dRep, "f");
    }
    poolKeyHash() {
        return __classPrivateFieldGet(this, _StakeVoteDelegation_poolKeyHash, "f");
    }
}
_StakeVoteDelegation_credential = new WeakMap(), _StakeVoteDelegation_poolKeyHash = new WeakMap(), _StakeVoteDelegation_dRep = new WeakMap(), _StakeVoteDelegation_originalBytes = new WeakMap();
