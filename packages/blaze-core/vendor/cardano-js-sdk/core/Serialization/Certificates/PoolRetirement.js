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
var _PoolRetirement_poolKeyHash, _PoolRetirement_epoch, _PoolRetirement_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { EpochNo } from '../../Cardano/types/Block.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { PoolId } from '../../Cardano/types/StakePool/index.js';
const EMBEDDED_GROUP_SIZE = 3;
export class PoolRetirement {
    constructor(poolKeyHash, epoch) {
        _PoolRetirement_poolKeyHash.set(this, void 0);
        _PoolRetirement_epoch.set(this, void 0);
        _PoolRetirement_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _PoolRetirement_poolKeyHash, poolKeyHash, "f");
        __classPrivateFieldSet(this, _PoolRetirement_epoch, epoch, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _PoolRetirement_originalBytes, "f"))
            return __classPrivateFieldGet(this, _PoolRetirement_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(CertificateKind.PoolRetirement);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _PoolRetirement_poolKeyHash, "f"), 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _PoolRetirement_epoch, "f"));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.PoolRetirement)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.PoolRetirement}, but got ${kind}`);
        const poolKeyHash = Crypto.Ed25519KeyHashHex(HexBlob.fromBytes(reader.readByteString()));
        const epoch = reader.readInt();
        reader.readEndArray();
        const cert = new PoolRetirement(poolKeyHash, EpochNo(Number(epoch)));
        __classPrivateFieldSet(cert, _PoolRetirement_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.PoolRetirement,
            epoch: __classPrivateFieldGet(this, _PoolRetirement_epoch, "f"),
            poolId: PoolId.fromKeyHash(__classPrivateFieldGet(this, _PoolRetirement_poolKeyHash, "f"))
        };
    }
    static fromCore(cert) {
        return new PoolRetirement(PoolId.toKeyHash(cert.poolId), cert.epoch);
    }
    poolKeyHash() {
        return __classPrivateFieldGet(this, _PoolRetirement_poolKeyHash, "f");
    }
    setPoolKeyHash(poolKeyHash) {
        __classPrivateFieldSet(this, _PoolRetirement_poolKeyHash, poolKeyHash, "f");
        __classPrivateFieldSet(this, _PoolRetirement_originalBytes, undefined, "f");
    }
    epoch() {
        return __classPrivateFieldGet(this, _PoolRetirement_epoch, "f");
    }
    setEpoch(epoch) {
        __classPrivateFieldSet(this, _PoolRetirement_epoch, epoch, "f");
        __classPrivateFieldSet(this, _PoolRetirement_originalBytes, undefined, "f");
    }
}
_PoolRetirement_poolKeyHash = new WeakMap(), _PoolRetirement_epoch = new WeakMap(), _PoolRetirement_originalBytes = new WeakMap();
