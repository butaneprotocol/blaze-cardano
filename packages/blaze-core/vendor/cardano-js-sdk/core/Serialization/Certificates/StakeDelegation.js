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
var _StakeDelegation_credential, _StakeDelegation_poolKeyHash, _StakeDelegation_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { PoolId } from '../../Cardano/types/StakePool/index.js';
const EMBEDDED_GROUP_SIZE = 3;
const CREDENTIAL_SIZE = 2;
export class StakeDelegation {
    constructor(credential, poolKeyHash) {
        _StakeDelegation_credential.set(this, void 0);
        _StakeDelegation_poolKeyHash.set(this, void 0);
        _StakeDelegation_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _StakeDelegation_credential, credential, "f");
        __classPrivateFieldSet(this, _StakeDelegation_poolKeyHash, poolKeyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _StakeDelegation_originalBytes, "f"))
            return __classPrivateFieldGet(this, _StakeDelegation_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(CertificateKind.StakeDelegation);
        writer.writeStartArray(CREDENTIAL_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _StakeDelegation_credential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeDelegation_credential, "f").hash, 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _StakeDelegation_poolKeyHash, "f"), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.StakeDelegation)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.StakeDelegation}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== CREDENTIAL_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${CREDENTIAL_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const poolKeyHash = Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const cert = new StakeDelegation({ hash, type }, poolKeyHash);
        __classPrivateFieldSet(cert, _StakeDelegation_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.StakeDelegation,
            poolId: PoolId.fromKeyHash(__classPrivateFieldGet(this, _StakeDelegation_poolKeyHash, "f")),
            stakeCredential: __classPrivateFieldGet(this, _StakeDelegation_credential, "f")
        };
    }
    static fromCore(cert) {
        return new StakeDelegation(cert.stakeCredential, PoolId.toKeyHash(cert.poolId));
    }
    stakeCredential() {
        return __classPrivateFieldGet(this, _StakeDelegation_credential, "f");
    }
    setStakeCredential(credential) {
        __classPrivateFieldSet(this, _StakeDelegation_credential, credential, "f");
        __classPrivateFieldSet(this, _StakeDelegation_originalBytes, undefined, "f");
    }
    poolKeyHash() {
        return __classPrivateFieldGet(this, _StakeDelegation_poolKeyHash, "f");
    }
    setPoolKeyHash(poolKeyHash) {
        __classPrivateFieldSet(this, _StakeDelegation_poolKeyHash, poolKeyHash, "f");
        __classPrivateFieldSet(this, _StakeDelegation_originalBytes, undefined, "f");
    }
}
_StakeDelegation_credential = new WeakMap(), _StakeDelegation_poolKeyHash = new WeakMap(), _StakeDelegation_originalBytes = new WeakMap();
