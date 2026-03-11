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
var _StakeRegistrationDelegation_credential, _StakeRegistrationDelegation_poolKeyHash, _StakeRegistrationDelegation_deposit, _StakeRegistrationDelegation_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { PoolId } from '../../Cardano/types/StakePool/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class StakeRegistrationDelegation {
    constructor(stakeCredential, deposit, poolKeyHash) {
        _StakeRegistrationDelegation_credential.set(this, void 0);
        _StakeRegistrationDelegation_poolKeyHash.set(this, void 0);
        _StakeRegistrationDelegation_deposit.set(this, void 0);
        _StakeRegistrationDelegation_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _StakeRegistrationDelegation_credential, stakeCredential, "f");
        __classPrivateFieldSet(this, _StakeRegistrationDelegation_deposit, deposit, "f");
        __classPrivateFieldSet(this, _StakeRegistrationDelegation_poolKeyHash, poolKeyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _StakeRegistrationDelegation_originalBytes, "f"))
            return __classPrivateFieldGet(this, _StakeRegistrationDelegation_originalBytes, "f");
        writer.writeStartArray(4);
        writer.writeInt(CertificateKind.StakeRegistrationDelegation);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _StakeRegistrationDelegation_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeRegistrationDelegation_credential, "f").hash, 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeRegistrationDelegation_poolKeyHash, "f"), 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _StakeRegistrationDelegation_deposit, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 4)
            throw new InvalidArgumentError('cbor', `Expected an array of 4 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.StakeRegistrationDelegation)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.StakeRegistrationDelegation}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const poolKeyHash = Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(reader.readByteString()));
        const deposit = reader.readInt();
        reader.readEndArray();
        const cert = new StakeRegistrationDelegation({ hash, type }, deposit, poolKeyHash);
        __classPrivateFieldSet(cert, _StakeRegistrationDelegation_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.StakeRegistrationDelegation,
            deposit: __classPrivateFieldGet(this, _StakeRegistrationDelegation_deposit, "f"),
            poolId: PoolId.fromKeyHash(__classPrivateFieldGet(this, _StakeRegistrationDelegation_poolKeyHash, "f")),
            stakeCredential: __classPrivateFieldGet(this, _StakeRegistrationDelegation_credential, "f")
        };
    }
    static fromCore(deleg) {
        return new StakeRegistrationDelegation(deleg.stakeCredential, deleg.deposit, PoolId.toKeyHash(deleg.poolId));
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _StakeRegistrationDelegation_credential, "f");
    }
    deposit() {
        return __classPrivateFieldGet(this, _StakeRegistrationDelegation_deposit, "f");
    }
    poolKeyHash() {
        return __classPrivateFieldGet(this, _StakeRegistrationDelegation_poolKeyHash, "f");
    }
}
_StakeRegistrationDelegation_credential = new WeakMap(), _StakeRegistrationDelegation_poolKeyHash = new WeakMap(), _StakeRegistrationDelegation_deposit = new WeakMap(), _StakeRegistrationDelegation_originalBytes = new WeakMap();
