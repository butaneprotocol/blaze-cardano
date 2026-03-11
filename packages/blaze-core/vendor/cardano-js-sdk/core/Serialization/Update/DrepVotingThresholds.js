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
var _DrepVotingThresholds_motionNoConfidence, _DrepVotingThresholds_committeeNormal, _DrepVotingThresholds_committeeNoConfidence, _DrepVotingThresholds_updateConstitution, _DrepVotingThresholds_hardForkInitiation, _DrepVotingThresholds_ppNetworkGroup, _DrepVotingThresholds_ppEconomicGroup, _DrepVotingThresholds_ppTechnicalGroup, _DrepVotingThresholds_ppGovernanceGroup, _DrepVotingThresholds_treasuryWithdrawal, _DrepVotingThresholds_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { UnitInterval } from '../Common/index.js';
const EX_DREP_VOTING_THRESHOLDS_SIZE = 10;
export class DrepVotingThresholds {
    constructor(motionNoConfidence, committeeNormal, committeeNoConfidence, updateConstitution, hardForkInitiation, ppNetworkGroup, ppEconomicGroup, ppTechnicalGroup, ppGovernanceGroup, treasuryWithdrawal) {
        _DrepVotingThresholds_motionNoConfidence.set(this, void 0);
        _DrepVotingThresholds_committeeNormal.set(this, void 0);
        _DrepVotingThresholds_committeeNoConfidence.set(this, void 0);
        _DrepVotingThresholds_updateConstitution.set(this, void 0);
        _DrepVotingThresholds_hardForkInitiation.set(this, void 0);
        _DrepVotingThresholds_ppNetworkGroup.set(this, void 0);
        _DrepVotingThresholds_ppEconomicGroup.set(this, void 0);
        _DrepVotingThresholds_ppTechnicalGroup.set(this, void 0);
        _DrepVotingThresholds_ppGovernanceGroup.set(this, void 0);
        _DrepVotingThresholds_treasuryWithdrawal.set(this, void 0);
        _DrepVotingThresholds_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _DrepVotingThresholds_motionNoConfidence, motionNoConfidence, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_committeeNormal, committeeNormal, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_committeeNoConfidence, committeeNoConfidence, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_updateConstitution, updateConstitution, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_hardForkInitiation, hardForkInitiation, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppNetworkGroup, ppNetworkGroup, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppEconomicGroup, ppEconomicGroup, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppTechnicalGroup, ppTechnicalGroup, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppGovernanceGroup, ppGovernanceGroup, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_treasuryWithdrawal, treasuryWithdrawal, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _DrepVotingThresholds_originalBytes, "f"))
            return __classPrivateFieldGet(this, _DrepVotingThresholds_originalBytes, "f");
        writer.writeStartArray(EX_DREP_VOTING_THRESHOLDS_SIZE);
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_motionNoConfidence, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_committeeNormal, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_committeeNoConfidence, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_updateConstitution, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_hardForkInitiation, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_ppNetworkGroup, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_ppEconomicGroup, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_ppTechnicalGroup, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_ppGovernanceGroup, "f").toCbor(), 'hex'));
        writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _DrepVotingThresholds_treasuryWithdrawal, "f").toCbor(), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EX_DREP_VOTING_THRESHOLDS_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EX_DREP_VOTING_THRESHOLDS_SIZE} elements, but got an array of ${length} elements`);
        const motionNoConfidence = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const committeeNormal = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const committeeNoConfidence = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const updateConstitution = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const hardForkInitiation = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const ppNetworkGroup = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const ppEconomicGroup = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const ppTechnicalGroup = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const ppGovernanceGroup = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        const treasuryWithdrawal = UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        reader.readEndArray();
        const thresholds = new DrepVotingThresholds(motionNoConfidence, committeeNormal, committeeNoConfidence, updateConstitution, hardForkInitiation, ppNetworkGroup, ppEconomicGroup, ppTechnicalGroup, ppGovernanceGroup, treasuryWithdrawal);
        __classPrivateFieldSet(thresholds, _DrepVotingThresholds_originalBytes, cbor, "f");
        return thresholds;
    }
    toCore() {
        return {
            committeeNoConfidence: __classPrivateFieldGet(this, _DrepVotingThresholds_committeeNoConfidence, "f").toCore(),
            committeeNormal: __classPrivateFieldGet(this, _DrepVotingThresholds_committeeNormal, "f").toCore(),
            hardForkInitiation: __classPrivateFieldGet(this, _DrepVotingThresholds_hardForkInitiation, "f").toCore(),
            motionNoConfidence: __classPrivateFieldGet(this, _DrepVotingThresholds_motionNoConfidence, "f").toCore(),
            ppEconomicGroup: __classPrivateFieldGet(this, _DrepVotingThresholds_ppEconomicGroup, "f").toCore(),
            ppGovernanceGroup: __classPrivateFieldGet(this, _DrepVotingThresholds_ppGovernanceGroup, "f").toCore(),
            ppNetworkGroup: __classPrivateFieldGet(this, _DrepVotingThresholds_ppNetworkGroup, "f").toCore(),
            ppTechnicalGroup: __classPrivateFieldGet(this, _DrepVotingThresholds_ppTechnicalGroup, "f").toCore(),
            treasuryWithdrawal: __classPrivateFieldGet(this, _DrepVotingThresholds_treasuryWithdrawal, "f").toCore(),
            updateConstitution: __classPrivateFieldGet(this, _DrepVotingThresholds_updateConstitution, "f").toCore()
        };
    }
    static fromCore(core) {
        return new DrepVotingThresholds(UnitInterval.fromCore(core.motionNoConfidence), UnitInterval.fromCore(core.committeeNormal), UnitInterval.fromCore(core.committeeNoConfidence), UnitInterval.fromCore(core.updateConstitution), UnitInterval.fromCore(core.hardForkInitiation), UnitInterval.fromCore(core.ppNetworkGroup), UnitInterval.fromCore(core.ppEconomicGroup), UnitInterval.fromCore(core.ppTechnicalGroup), UnitInterval.fromCore(core.ppGovernanceGroup), UnitInterval.fromCore(core.treasuryWithdrawal));
    }
    setMotionNoConfidence(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_motionNoConfidence, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setCommitteeNormal(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_committeeNormal, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setCommitteeNoConfidence(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_committeeNoConfidence, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setUpdateConstitution(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_updateConstitution, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setHardForkInitiation(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_hardForkInitiation, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setPpNetworkGroup(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppNetworkGroup, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setPpEconomicGroup(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppEconomicGroup, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setPpTechnicalGroup(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppTechnicalGroup, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setPpGovernanceGroup(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_ppGovernanceGroup, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    setTreasuryWithdrawal(threshold) {
        __classPrivateFieldSet(this, _DrepVotingThresholds_treasuryWithdrawal, threshold, "f");
        __classPrivateFieldSet(this, _DrepVotingThresholds_originalBytes, undefined, "f");
    }
    motionNoConfidence() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_motionNoConfidence, "f");
    }
    committeeNormal() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_committeeNormal, "f");
    }
    committeeNoConfidence() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_committeeNoConfidence, "f");
    }
    updateConstitution() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_updateConstitution, "f");
    }
    hardForkInitiation() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_hardForkInitiation, "f");
    }
    ppNetworkGroup() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_ppNetworkGroup, "f");
    }
    ppEconomicGroup() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_ppEconomicGroup, "f");
    }
    ppTechnicalGroup() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_ppTechnicalGroup, "f");
    }
    ppGovernanceGroup() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_ppGovernanceGroup, "f");
    }
    treasuryWithdrawal() {
        return __classPrivateFieldGet(this, _DrepVotingThresholds_treasuryWithdrawal, "f");
    }
}
_DrepVotingThresholds_motionNoConfidence = new WeakMap(), _DrepVotingThresholds_committeeNormal = new WeakMap(), _DrepVotingThresholds_committeeNoConfidence = new WeakMap(), _DrepVotingThresholds_updateConstitution = new WeakMap(), _DrepVotingThresholds_hardForkInitiation = new WeakMap(), _DrepVotingThresholds_ppNetworkGroup = new WeakMap(), _DrepVotingThresholds_ppEconomicGroup = new WeakMap(), _DrepVotingThresholds_ppTechnicalGroup = new WeakMap(), _DrepVotingThresholds_ppGovernanceGroup = new WeakMap(), _DrepVotingThresholds_treasuryWithdrawal = new WeakMap(), _DrepVotingThresholds_originalBytes = new WeakMap();
