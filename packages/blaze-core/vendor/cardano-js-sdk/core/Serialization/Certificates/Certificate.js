var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Certificate_kind, _Certificate_genesisKeyDelegation, _Certificate_moveInstantaneousReward, _Certificate_poolRegistration, _Certificate_poolRetirement, _Certificate_stakeDelegation, _Certificate_stakeDeregistration, _Certificate_stakeRegistration, _Certificate_registration, _Certificate_unregistration, _Certificate_voteDelegation, _Certificate_stakeVoteDelegation, _Certificate_stakeRegistrationDelegation, _Certificate_voteRegistrationDelegation, _Certificate_stakeVoteRegistrationDelegation, _Certificate_authCommitteeHot, _Certificate_resignCommitteeCold, _Certificate_drepRegistration, _Certificate_drepUnregistration, _Certificate_updateDrep, _Certificate_originalBytes;
import { AuthCommitteeHot } from './AuthCommitteeHot.js';
import { CborReader } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { GenesisKeyDelegation } from './GenesisKeyDelegation.js';
import { InvalidStateError } from "../../../deps/util.js";
import { MoveInstantaneousReward } from './MoveInstantaneousReward/index.js';
import { PoolRegistration } from './PoolRegistration.js';
import { PoolRetirement } from './PoolRetirement.js';
import { RegisterDelegateRepresentative } from './RegisterDelegateRepresentative.js';
import { Registration } from './Registration.js';
import { ResignCommitteeCold } from './ResignCommitteeCold.js';
import { StakeDelegation } from './StakeDelegation.js';
import { StakeDeregistration } from './StakeDeregistration.js';
import { StakeRegistration } from './StakeRegistration.js';
import { StakeRegistrationDelegation } from './StakeRegistrationDelegation.js';
import { StakeVoteDelegation } from './StakeVoteDelegation.js';
import { StakeVoteRegistrationDelegation } from './StakeVoteRegistrationDelegation.js';
import { UnregisterDelegateRepresentative } from './UnregisterDelegateRepresentative.js';
import { Unregistration } from './Unregistration.js';
import { UpdateDelegateRepresentative } from './UpdateDelegateRepresentative.js';
import { VoteDelegation } from './VoteDelegation.js';
import { VoteRegistrationDelegation } from './VoteRegistrationDelegation.js';
export class Certificate {
    constructor() {
        _Certificate_kind.set(this, void 0);
        _Certificate_genesisKeyDelegation.set(this, void 0);
        _Certificate_moveInstantaneousReward.set(this, void 0);
        _Certificate_poolRegistration.set(this, void 0);
        _Certificate_poolRetirement.set(this, void 0);
        _Certificate_stakeDelegation.set(this, void 0);
        _Certificate_stakeDeregistration.set(this, void 0);
        _Certificate_stakeRegistration.set(this, void 0);
        _Certificate_registration.set(this, void 0);
        _Certificate_unregistration.set(this, void 0);
        _Certificate_voteDelegation.set(this, void 0);
        _Certificate_stakeVoteDelegation.set(this, void 0);
        _Certificate_stakeRegistrationDelegation.set(this, void 0);
        _Certificate_voteRegistrationDelegation.set(this, void 0);
        _Certificate_stakeVoteRegistrationDelegation.set(this, void 0);
        _Certificate_authCommitteeHot.set(this, void 0);
        _Certificate_resignCommitteeCold.set(this, void 0);
        _Certificate_drepRegistration.set(this, void 0);
        _Certificate_drepUnregistration.set(this, void 0);
        _Certificate_updateDrep.set(this, void 0);
        _Certificate_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _Certificate_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Certificate_originalBytes, "f");
        let cbor;
        switch (__classPrivateFieldGet(this, _Certificate_kind, "f")) {
            case CertificateKind.StakeRegistration:
                cbor = __classPrivateFieldGet(this, _Certificate_stakeRegistration, "f").toCbor();
                break;
            case CertificateKind.StakeDeregistration:
                cbor = __classPrivateFieldGet(this, _Certificate_stakeDeregistration, "f").toCbor();
                break;
            case CertificateKind.StakeDelegation:
                cbor = __classPrivateFieldGet(this, _Certificate_stakeDelegation, "f").toCbor();
                break;
            case CertificateKind.PoolRetirement:
                cbor = __classPrivateFieldGet(this, _Certificate_poolRetirement, "f").toCbor();
                break;
            case CertificateKind.PoolRegistration:
                cbor = __classPrivateFieldGet(this, _Certificate_poolRegistration, "f").toCbor();
                break;
            case CertificateKind.MoveInstantaneousRewards:
                cbor = __classPrivateFieldGet(this, _Certificate_moveInstantaneousReward, "f").toCbor();
                break;
            case CertificateKind.GenesisKeyDelegation:
                cbor = __classPrivateFieldGet(this, _Certificate_genesisKeyDelegation, "f").toCbor();
                break;
            case CertificateKind.Registration:
                cbor = __classPrivateFieldGet(this, _Certificate_registration, "f").toCbor();
                break;
            case CertificateKind.Unregistration:
                cbor = __classPrivateFieldGet(this, _Certificate_unregistration, "f").toCbor();
                break;
            case CertificateKind.VoteDelegation:
                cbor = __classPrivateFieldGet(this, _Certificate_voteDelegation, "f").toCbor();
                break;
            case CertificateKind.StakeVoteDelegation:
                cbor = __classPrivateFieldGet(this, _Certificate_stakeVoteDelegation, "f").toCbor();
                break;
            case CertificateKind.StakeRegistrationDelegation:
                cbor = __classPrivateFieldGet(this, _Certificate_stakeRegistrationDelegation, "f").toCbor();
                break;
            case CertificateKind.VoteRegistrationDelegation:
                cbor = __classPrivateFieldGet(this, _Certificate_voteRegistrationDelegation, "f").toCbor();
                break;
            case CertificateKind.StakeVoteRegistrationDelegation:
                cbor = __classPrivateFieldGet(this, _Certificate_stakeVoteRegistrationDelegation, "f").toCbor();
                break;
            case CertificateKind.AuthCommitteeHot:
                cbor = __classPrivateFieldGet(this, _Certificate_authCommitteeHot, "f").toCbor();
                break;
            case CertificateKind.ResignCommitteeCold:
                cbor = __classPrivateFieldGet(this, _Certificate_resignCommitteeCold, "f").toCbor();
                break;
            case CertificateKind.DrepRegistration:
                cbor = __classPrivateFieldGet(this, _Certificate_drepRegistration, "f").toCbor();
                break;
            case CertificateKind.DrepUnregistration:
                cbor = __classPrivateFieldGet(this, _Certificate_drepUnregistration, "f").toCbor();
                break;
            case CertificateKind.UpdateDrep:
                cbor = __classPrivateFieldGet(this, _Certificate_updateDrep, "f").toCbor();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _Certificate_kind, "f")}`);
        }
        return cbor;
    }
    static fromCbor(cbor) {
        let certificate;
        const reader = new CborReader(cbor);
        reader.readStartArray();
        const kind = Number(reader.readInt());
        switch (kind) {
            case CertificateKind.StakeRegistration:
                certificate = Certificate.newStakeRegistration(StakeRegistration.fromCbor(cbor));
                break;
            case CertificateKind.StakeDeregistration:
                certificate = Certificate.newStakeDeregistration(StakeDeregistration.fromCbor(cbor));
                break;
            case CertificateKind.StakeDelegation:
                certificate = Certificate.newStakeDelegation(StakeDelegation.fromCbor(cbor));
                break;
            case CertificateKind.PoolRetirement:
                certificate = Certificate.newPoolRetirement(PoolRetirement.fromCbor(cbor));
                break;
            case CertificateKind.PoolRegistration:
                certificate = Certificate.newPoolRegistration(PoolRegistration.fromCbor(cbor));
                break;
            case CertificateKind.MoveInstantaneousRewards:
                certificate = Certificate.newMoveInstantaneousRewardsCert(MoveInstantaneousReward.fromCbor(cbor));
                break;
            case CertificateKind.GenesisKeyDelegation:
                certificate = Certificate.newGenesisKeyDelegation(GenesisKeyDelegation.fromCbor(cbor));
                break;
            case CertificateKind.Registration:
                certificate = Certificate.newRegistrationCert(Registration.fromCbor(cbor));
                break;
            case CertificateKind.Unregistration:
                certificate = Certificate.newUnregistrationCert(Unregistration.fromCbor(cbor));
                break;
            case CertificateKind.VoteDelegation:
                certificate = Certificate.newVoteDelegationCert(VoteDelegation.fromCbor(cbor));
                break;
            case CertificateKind.StakeVoteDelegation:
                certificate = Certificate.newStakeVoteDelegationCert(StakeVoteDelegation.fromCbor(cbor));
                break;
            case CertificateKind.StakeRegistrationDelegation:
                certificate = Certificate.newStakeRegistrationDelegationCert(StakeRegistrationDelegation.fromCbor(cbor));
                break;
            case CertificateKind.VoteRegistrationDelegation:
                certificate = Certificate.newVoteRegistrationDelegationCert(VoteRegistrationDelegation.fromCbor(cbor));
                break;
            case CertificateKind.StakeVoteRegistrationDelegation:
                certificate = Certificate.newStakeVoteRegistrationDelegationCert(StakeVoteRegistrationDelegation.fromCbor(cbor));
                break;
            case CertificateKind.AuthCommitteeHot:
                certificate = Certificate.newAuthCommitteeHotCert(AuthCommitteeHot.fromCbor(cbor));
                break;
            case CertificateKind.ResignCommitteeCold:
                certificate = Certificate.newResignCommitteeColdCert(ResignCommitteeCold.fromCbor(cbor));
                break;
            case CertificateKind.DrepRegistration:
                certificate = Certificate.newRegisterDelegateRepresentativeCert(RegisterDelegateRepresentative.fromCbor(cbor));
                break;
            case CertificateKind.DrepUnregistration:
                certificate = Certificate.newUnregisterDelegateRepresentativeCert(UnregisterDelegateRepresentative.fromCbor(cbor));
                break;
            case CertificateKind.UpdateDrep:
                certificate = Certificate.newUpdateDelegateRepresentativeCert(UpdateDelegateRepresentative.fromCbor(cbor));
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${kind}`);
        }
        __classPrivateFieldSet(certificate, _Certificate_originalBytes, cbor, "f");
        return certificate;
    }
    toCore() {
        let core;
        switch (__classPrivateFieldGet(this, _Certificate_kind, "f")) {
            case CertificateKind.StakeRegistration:
                core = __classPrivateFieldGet(this, _Certificate_stakeRegistration, "f").toCore();
                break;
            case CertificateKind.StakeDeregistration:
                core = __classPrivateFieldGet(this, _Certificate_stakeDeregistration, "f").toCore();
                break;
            case CertificateKind.StakeDelegation:
                core = __classPrivateFieldGet(this, _Certificate_stakeDelegation, "f").toCore();
                break;
            case CertificateKind.PoolRetirement:
                core = __classPrivateFieldGet(this, _Certificate_poolRetirement, "f").toCore();
                break;
            case CertificateKind.PoolRegistration:
                core = __classPrivateFieldGet(this, _Certificate_poolRegistration, "f").toCore();
                break;
            case CertificateKind.MoveInstantaneousRewards:
                core = __classPrivateFieldGet(this, _Certificate_moveInstantaneousReward, "f").toCore();
                break;
            case CertificateKind.GenesisKeyDelegation:
                core = __classPrivateFieldGet(this, _Certificate_genesisKeyDelegation, "f").toCore();
                break;
            case CertificateKind.Registration:
                core = __classPrivateFieldGet(this, _Certificate_registration, "f").toCore();
                break;
            case CertificateKind.Unregistration:
                core = __classPrivateFieldGet(this, _Certificate_unregistration, "f").toCore();
                break;
            case CertificateKind.VoteDelegation:
                core = __classPrivateFieldGet(this, _Certificate_voteDelegation, "f").toCore();
                break;
            case CertificateKind.StakeVoteDelegation:
                core = __classPrivateFieldGet(this, _Certificate_stakeVoteDelegation, "f").toCore();
                break;
            case CertificateKind.StakeRegistrationDelegation:
                core = __classPrivateFieldGet(this, _Certificate_stakeRegistrationDelegation, "f").toCore();
                break;
            case CertificateKind.VoteRegistrationDelegation:
                core = __classPrivateFieldGet(this, _Certificate_voteRegistrationDelegation, "f").toCore();
                break;
            case CertificateKind.StakeVoteRegistrationDelegation:
                core = __classPrivateFieldGet(this, _Certificate_stakeVoteRegistrationDelegation, "f").toCore();
                break;
            case CertificateKind.AuthCommitteeHot:
                core = __classPrivateFieldGet(this, _Certificate_authCommitteeHot, "f").toCore();
                break;
            case CertificateKind.ResignCommitteeCold:
                core = __classPrivateFieldGet(this, _Certificate_resignCommitteeCold, "f").toCore();
                break;
            case CertificateKind.DrepRegistration:
                core = __classPrivateFieldGet(this, _Certificate_drepRegistration, "f").toCore();
                break;
            case CertificateKind.DrepUnregistration:
                core = __classPrivateFieldGet(this, _Certificate_drepUnregistration, "f").toCore();
                break;
            case CertificateKind.UpdateDrep:
                core = __classPrivateFieldGet(this, _Certificate_updateDrep, "f").toCore();
                break;
            default:
                throw new InvalidStateError(`Unexpected kind value: ${__classPrivateFieldGet(this, _Certificate_kind, "f")}`);
        }
        return core;
    }
    static fromCore(certificate) {
        let cert;
        switch (certificate.__typename) {
            case CertificateType.StakeRegistration:
                cert = Certificate.newStakeRegistration(StakeRegistration.fromCore(certificate));
                break;
            case CertificateType.StakeDeregistration:
                cert = Certificate.newStakeDeregistration(StakeDeregistration.fromCore(certificate));
                break;
            case CertificateType.StakeDelegation:
                cert = Certificate.newStakeDelegation(StakeDelegation.fromCore(certificate));
                break;
            case CertificateType.PoolRetirement:
                cert = Certificate.newPoolRetirement(PoolRetirement.fromCore(certificate));
                break;
            case CertificateType.PoolRegistration:
                cert = Certificate.newPoolRegistration(PoolRegistration.fromCore(certificate));
                break;
            case CertificateType.MIR:
                cert = Certificate.newMoveInstantaneousRewardsCert(MoveInstantaneousReward.fromCore(certificate));
                break;
            case CertificateType.GenesisKeyDelegation:
                cert = Certificate.newGenesisKeyDelegation(GenesisKeyDelegation.fromCore(certificate));
                break;
            case CertificateType.Registration:
                cert = Certificate.newRegistrationCert(Registration.fromCore(certificate));
                break;
            case CertificateType.Unregistration:
                cert = Certificate.newUnregistrationCert(Unregistration.fromCore(certificate));
                break;
            case CertificateType.VoteDelegation:
                cert = Certificate.newVoteDelegationCert(VoteDelegation.fromCore(certificate));
                break;
            case CertificateType.StakeVoteDelegation:
                cert = Certificate.newStakeVoteDelegationCert(StakeVoteDelegation.fromCore(certificate));
                break;
            case CertificateType.StakeRegistrationDelegation:
                cert = Certificate.newStakeRegistrationDelegationCert(StakeRegistrationDelegation.fromCore(certificate));
                break;
            case CertificateType.VoteRegistrationDelegation:
                cert = Certificate.newVoteRegistrationDelegationCert(VoteRegistrationDelegation.fromCore(certificate));
                break;
            case CertificateType.StakeVoteRegistrationDelegation:
                cert = Certificate.newStakeVoteRegistrationDelegationCert(StakeVoteRegistrationDelegation.fromCore(certificate));
                break;
            case CertificateType.AuthorizeCommitteeHot:
                cert = Certificate.newAuthCommitteeHotCert(AuthCommitteeHot.fromCore(certificate));
                break;
            case CertificateType.ResignCommitteeCold:
                cert = Certificate.newResignCommitteeColdCert(ResignCommitteeCold.fromCore(certificate));
                break;
            case CertificateType.RegisterDelegateRepresentative:
                cert = Certificate.newRegisterDelegateRepresentativeCert(RegisterDelegateRepresentative.fromCore(certificate));
                break;
            case CertificateType.UnregisterDelegateRepresentative:
                cert = Certificate.newUnregisterDelegateRepresentativeCert(UnregisterDelegateRepresentative.fromCore(certificate));
                break;
            case CertificateType.UpdateDelegateRepresentative:
                cert = Certificate.newUpdateDelegateRepresentativeCert(UpdateDelegateRepresentative.fromCore(certificate));
                break;
            default:
                throw new InvalidStateError('Unexpected certificate type');
        }
        return cert;
    }
    static newStakeRegistration(stakeRegistration) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_stakeRegistration, stakeRegistration, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.StakeRegistration, "f");
        return cert;
    }
    static newStakeDeregistration(stakeDeregistration) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_stakeDeregistration, stakeDeregistration, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.StakeDeregistration, "f");
        return cert;
    }
    static newStakeDelegation(stakeDelegation) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_stakeDelegation, stakeDelegation, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.StakeDelegation, "f");
        return cert;
    }
    static newPoolRegistration(poolRegistration) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_poolRegistration, poolRegistration, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.PoolRegistration, "f");
        return cert;
    }
    static newPoolRetirement(poolRetirement) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_poolRetirement, poolRetirement, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.PoolRetirement, "f");
        return cert;
    }
    static newGenesisKeyDelegation(genesisKeyDelegation) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_genesisKeyDelegation, genesisKeyDelegation, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.GenesisKeyDelegation, "f");
        return cert;
    }
    static newMoveInstantaneousRewardsCert(moveInstantaneousRewards) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_moveInstantaneousReward, moveInstantaneousRewards, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.MoveInstantaneousRewards, "f");
        return cert;
    }
    static newRegistrationCert(registration) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_registration, registration, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.Registration, "f");
        return cert;
    }
    static newUnregistrationCert(unregistration) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_unregistration, unregistration, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.Unregistration, "f");
        return cert;
    }
    static newVoteDelegationCert(voteDelegation) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_voteDelegation, voteDelegation, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.VoteDelegation, "f");
        return cert;
    }
    static newStakeVoteDelegationCert(stakeVoteDelegation) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_stakeVoteDelegation, stakeVoteDelegation, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.StakeVoteDelegation, "f");
        return cert;
    }
    static newStakeRegistrationDelegationCert(stakeRegistrationDelegation) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_stakeRegistrationDelegation, stakeRegistrationDelegation, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.StakeRegistrationDelegation, "f");
        return cert;
    }
    static newVoteRegistrationDelegationCert(voteRegistrationDelegation) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_voteRegistrationDelegation, voteRegistrationDelegation, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.VoteRegistrationDelegation, "f");
        return cert;
    }
    static newStakeVoteRegistrationDelegationCert(stakeVoteRegistrationDelegation) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_stakeVoteRegistrationDelegation, stakeVoteRegistrationDelegation, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.StakeVoteRegistrationDelegation, "f");
        return cert;
    }
    static newAuthCommitteeHotCert(authCommitteeHot) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_authCommitteeHot, authCommitteeHot, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.AuthCommitteeHot, "f");
        return cert;
    }
    static newResignCommitteeColdCert(resignCommitteeCold) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_resignCommitteeCold, resignCommitteeCold, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.ResignCommitteeCold, "f");
        return cert;
    }
    static newRegisterDelegateRepresentativeCert(drepRegistration) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_drepRegistration, drepRegistration, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.DrepRegistration, "f");
        return cert;
    }
    static newUnregisterDelegateRepresentativeCert(drepUnregistration) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_drepUnregistration, drepUnregistration, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.DrepUnregistration, "f");
        return cert;
    }
    static newUpdateDelegateRepresentativeCert(updateDrep) {
        const cert = new Certificate();
        __classPrivateFieldSet(cert, _Certificate_updateDrep, updateDrep, "f");
        __classPrivateFieldSet(cert, _Certificate_kind, CertificateKind.UpdateDrep, "f");
        return cert;
    }
    kind() {
        return __classPrivateFieldGet(this, _Certificate_kind, "f");
    }
    asStakeRegistration() {
        return __classPrivateFieldGet(this, _Certificate_stakeRegistration, "f");
    }
    asStakeDeregistration() {
        return __classPrivateFieldGet(this, _Certificate_stakeDeregistration, "f");
    }
    asStakeDelegation() {
        return __classPrivateFieldGet(this, _Certificate_stakeDelegation, "f");
    }
    asPoolRegistration() {
        return __classPrivateFieldGet(this, _Certificate_poolRegistration, "f");
    }
    asPoolRetirement() {
        return __classPrivateFieldGet(this, _Certificate_poolRetirement, "f");
    }
    asGenesisKeyDelegation() {
        return __classPrivateFieldGet(this, _Certificate_genesisKeyDelegation, "f");
    }
    asMoveInstantaneousRewardsCert() {
        return __classPrivateFieldGet(this, _Certificate_moveInstantaneousReward, "f");
    }
    asRegistrationCert() {
        return __classPrivateFieldGet(this, _Certificate_registration, "f");
    }
    asUnregistrationCert() {
        return __classPrivateFieldGet(this, _Certificate_unregistration, "f");
    }
    asVoteDelegationCert() {
        return __classPrivateFieldGet(this, _Certificate_voteDelegation, "f");
    }
    asStakeVoteDelegationCert() {
        return __classPrivateFieldGet(this, _Certificate_stakeVoteDelegation, "f");
    }
    asStakeRegistrationDelegationCert() {
        return __classPrivateFieldGet(this, _Certificate_stakeRegistrationDelegation, "f");
    }
    asVoteRegistrationDelegationCert() {
        return __classPrivateFieldGet(this, _Certificate_voteRegistrationDelegation, "f");
    }
    asStakeVoteRegistrationDelegationCert() {
        return __classPrivateFieldGet(this, _Certificate_stakeVoteRegistrationDelegation, "f");
    }
    asAuthCommitteeHotCert() {
        return __classPrivateFieldGet(this, _Certificate_authCommitteeHot, "f");
    }
    asResignCommitteeColdCert() {
        return __classPrivateFieldGet(this, _Certificate_resignCommitteeCold, "f");
    }
    asRegisterDelegateRepresentativeCert() {
        return __classPrivateFieldGet(this, _Certificate_drepRegistration, "f");
    }
    asUnregisterDelegateRepresentativeCert() {
        return __classPrivateFieldGet(this, _Certificate_drepUnregistration, "f");
    }
    asUpdateDelegateRepresentativeCert() {
        return __classPrivateFieldGet(this, _Certificate_updateDrep, "f");
    }
}
_Certificate_kind = new WeakMap(), _Certificate_genesisKeyDelegation = new WeakMap(), _Certificate_moveInstantaneousReward = new WeakMap(), _Certificate_poolRegistration = new WeakMap(), _Certificate_poolRetirement = new WeakMap(), _Certificate_stakeDelegation = new WeakMap(), _Certificate_stakeDeregistration = new WeakMap(), _Certificate_stakeRegistration = new WeakMap(), _Certificate_registration = new WeakMap(), _Certificate_unregistration = new WeakMap(), _Certificate_voteDelegation = new WeakMap(), _Certificate_stakeVoteDelegation = new WeakMap(), _Certificate_stakeRegistrationDelegation = new WeakMap(), _Certificate_voteRegistrationDelegation = new WeakMap(), _Certificate_stakeVoteRegistrationDelegation = new WeakMap(), _Certificate_authCommitteeHot = new WeakMap(), _Certificate_resignCommitteeCold = new WeakMap(), _Certificate_drepRegistration = new WeakMap(), _Certificate_drepUnregistration = new WeakMap(), _Certificate_updateDrep = new WeakMap(), _Certificate_originalBytes = new WeakMap();
