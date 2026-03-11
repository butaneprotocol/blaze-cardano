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
var _PoolVotingThresholds_motionNoConfidence, _PoolVotingThresholds_committeeNormal, _PoolVotingThresholds_committeeNoConfidence, _PoolVotingThresholds_hardForkInitiation, _PoolVotingThresholds_securityRelevantParam, _PoolVotingThresholds_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { UnitInterval } from '../Common/index.js';
const POOL_VOTING_THRESHOLDS_SIZE = 5;
export class PoolVotingThresholds {
    constructor(motionNoConfidence, committeeNormal, committeeNoConfidence, hardForkInitiation, securityRelevantParam) {
        _PoolVotingThresholds_motionNoConfidence.set(this, void 0);
        _PoolVotingThresholds_committeeNormal.set(this, void 0);
        _PoolVotingThresholds_committeeNoConfidence.set(this, void 0);
        _PoolVotingThresholds_hardForkInitiation.set(this, void 0);
        _PoolVotingThresholds_securityRelevantParam.set(this, void 0);
        _PoolVotingThresholds_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _PoolVotingThresholds_motionNoConfidence, motionNoConfidence, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_committeeNormal, committeeNormal, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_committeeNoConfidence, committeeNoConfidence, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_hardForkInitiation, hardForkInitiation, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_securityRelevantParam, securityRelevantParam, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _PoolVotingThresholds_originalBytes, "f"))
            return __classPrivateFieldGet(this, _PoolVotingThresholds_originalBytes, "f");
        writer.writeStartArray(POOL_VOTING_THRESHOLDS_SIZE);
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolVotingThresholds_motionNoConfidence, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolVotingThresholds_committeeNormal, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolVotingThresholds_committeeNoConfidence, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolVotingThresholds_hardForkInitiation, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _PoolVotingThresholds_securityRelevantParam, "f").toCbor(), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== POOL_VOTING_THRESHOLDS_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${POOL_VOTING_THRESHOLDS_SIZE} elements, but got an array of ${length} elements`);
        const motionNoConfidence = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const committeeNormal = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const committeeNoConfidence = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const hardForkInitiation = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const securityRelevantParamVotingThreshold = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        reader.readEndArray();
        const thresholds = new PoolVotingThresholds(motionNoConfidence, committeeNormal, committeeNoConfidence, hardForkInitiation, securityRelevantParamVotingThreshold);
        __classPrivateFieldSet(thresholds, _PoolVotingThresholds_originalBytes, cbor, "f");
        return thresholds;
    }
    toCore() {
        return {
            committeeNoConfidence: __classPrivateFieldGet(this, _PoolVotingThresholds_committeeNoConfidence, "f").toCore(),
            committeeNormal: __classPrivateFieldGet(this, _PoolVotingThresholds_committeeNormal, "f").toCore(),
            hardForkInitiation: __classPrivateFieldGet(this, _PoolVotingThresholds_hardForkInitiation, "f").toCore(),
            motionNoConfidence: __classPrivateFieldGet(this, _PoolVotingThresholds_motionNoConfidence, "f").toCore(),
            securityRelevantParamVotingThreshold: __classPrivateFieldGet(this, _PoolVotingThresholds_securityRelevantParam, "f").toCore()
        };
    }
    static fromCore(core) {
        return new PoolVotingThresholds(UnitInterval.fromCore(core.motionNoConfidence), UnitInterval.fromCore(core.committeeNormal), UnitInterval.fromCore(core.committeeNoConfidence), UnitInterval.fromCore(core.hardForkInitiation), UnitInterval.fromCore(core.securityRelevantParamVotingThreshold));
    }
    setMotionNoConfidence(threshold) {
        __classPrivateFieldSet(this, _PoolVotingThresholds_motionNoConfidence, threshold, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_originalBytes, undefined, "f");
    }
    setCommitteeNormal(threshold) {
        __classPrivateFieldSet(this, _PoolVotingThresholds_committeeNormal, threshold, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_originalBytes, undefined, "f");
    }
    setCommitteeNoConfidence(threshold) {
        __classPrivateFieldSet(this, _PoolVotingThresholds_committeeNoConfidence, threshold, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_originalBytes, undefined, "f");
    }
    setHardForkInitiation(threshold) {
        __classPrivateFieldSet(this, _PoolVotingThresholds_hardForkInitiation, threshold, "f");
        __classPrivateFieldSet(this, _PoolVotingThresholds_originalBytes, undefined, "f");
    }
    motionNoConfidence() {
        return __classPrivateFieldGet(this, _PoolVotingThresholds_motionNoConfidence, "f");
    }
    committeeNormal() {
        return __classPrivateFieldGet(this, _PoolVotingThresholds_committeeNormal, "f");
    }
    committeeNoConfidence() {
        return __classPrivateFieldGet(this, _PoolVotingThresholds_committeeNoConfidence, "f");
    }
    hardForkInitiation() {
        return __classPrivateFieldGet(this, _PoolVotingThresholds_hardForkInitiation, "f");
    }
    securityRelevantParam() {
        return __classPrivateFieldGet(this, _PoolVotingThresholds_securityRelevantParam, "f");
    }
}
_PoolVotingThresholds_motionNoConfidence = new WeakMap(), _PoolVotingThresholds_committeeNormal = new WeakMap(), _PoolVotingThresholds_committeeNoConfidence = new WeakMap(), _PoolVotingThresholds_hardForkInitiation = new WeakMap(), _PoolVotingThresholds_securityRelevantParam = new WeakMap(), _PoolVotingThresholds_originalBytes = new WeakMap();
