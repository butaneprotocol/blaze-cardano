import { CredentialType, RewardAccount } from '../Address/index.js';
import { isNotNil } from '@cardano-sdk/util';
export var CertificateType;
(function (CertificateType) {
    CertificateType["StakeRegistration"] = "StakeRegistrationCertificate";
    CertificateType["StakeDeregistration"] = "StakeDeregistrationCertificate";
    CertificateType["PoolRegistration"] = "PoolRegistrationCertificate";
    CertificateType["PoolRetirement"] = "PoolRetirementCertificate";
    CertificateType["StakeDelegation"] = "StakeDelegationCertificate";
    CertificateType["MIR"] = "MirCertificate";
    CertificateType["GenesisKeyDelegation"] = "GenesisKeyDelegationCertificate";
    CertificateType["Registration"] = "RegistrationCertificate";
    CertificateType["Unregistration"] = "UnRegistrationCertificate";
    CertificateType["VoteDelegation"] = "VoteDelegationCertificate";
    CertificateType["StakeVoteDelegation"] = "StakeVoteDelegationCertificate";
    CertificateType["StakeRegistrationDelegation"] = "StakeRegistrationDelegateCertificate";
    CertificateType["VoteRegistrationDelegation"] = "VoteRegistrationDelegateCertificate";
    CertificateType["StakeVoteRegistrationDelegation"] = "StakeVoteRegistrationDelegateCertificate";
    CertificateType["AuthorizeCommitteeHot"] = "AuthorizeCommitteeHotCertificate";
    CertificateType["ResignCommitteeCold"] = "ResignCommitteeColdCertificate";
    CertificateType["RegisterDelegateRepresentative"] = "RegisterDelegateRepresentativeCertificate";
    CertificateType["UnregisterDelegateRepresentative"] = "UnregisterDelegateRepresentativeCertificate";
    CertificateType["UpdateDelegateRepresentative"] = "UpdateDelegateRepresentativeCertificate";
})(CertificateType || (CertificateType = {}));
export var MirCertificatePot;
(function (MirCertificatePot) {
    MirCertificatePot["Reserves"] = "reserve";
    MirCertificatePot["Treasury"] = "treasury";
})(MirCertificatePot || (MirCertificatePot = {}));
export var MirCertificateKind;
(function (MirCertificateKind) {
    MirCertificateKind["ToOtherPot"] = "toOtherPot";
    MirCertificateKind["ToStakeCreds"] = "ToStakeCreds";
})(MirCertificateKind || (MirCertificateKind = {}));
export const PostConwayStakeRegistrationCertificateTypes = [
    CertificateType.Registration,
    CertificateType.VoteRegistrationDelegation,
    CertificateType.StakeRegistrationDelegation,
    CertificateType.StakeVoteRegistrationDelegation
];
export const StakeRegistrationCertificateTypes = [
    CertificateType.StakeRegistration,
    ...PostConwayStakeRegistrationCertificateTypes
];
export const StakeDelegationCertificateTypes = [
    CertificateType.StakeDelegation,
    CertificateType.StakeVoteDelegation,
    CertificateType.StakeRegistrationDelegation,
    CertificateType.StakeVoteRegistrationDelegation
];
export const RegAndDeregCertificateTypes = [
    ...StakeRegistrationCertificateTypes,
    CertificateType.Unregistration,
    CertificateType.StakeDeregistration
];
export const StakeCredentialCertificateTypes = [
    ...RegAndDeregCertificateTypes,
    ...StakeDelegationCertificateTypes,
    CertificateType.VoteDelegation
];
export const VoteDelegationCredentialCertificateTypes = [
    CertificateType.VoteDelegation,
    CertificateType.VoteRegistrationDelegation,
    CertificateType.StakeVoteDelegation,
    CertificateType.StakeVoteRegistrationDelegation
];
export const isCertType = (certificate, certificateTypes) => certificateTypes.includes(certificate.__typename);
export const createStakeRegistrationCert = (rewardAccount) => ({
    __typename: CertificateType.StakeRegistration,
    stakeCredential: {
        hash: RewardAccount.toHash(rewardAccount),
        type: CredentialType.KeyHash
    }
});
export const createStakeDeregistrationCert = (rewardAccount, deposit) => deposit === undefined
    ? {
        __typename: CertificateType.StakeDeregistration,
        stakeCredential: {
            hash: RewardAccount.toHash(rewardAccount),
            type: CredentialType.KeyHash
        }
    }
    : {
        __typename: CertificateType.Unregistration,
        deposit,
        stakeCredential: {
            hash: RewardAccount.toHash(rewardAccount),
            type: CredentialType.KeyHash
        }
    };
export const createDelegationCert = (rewardAccount, poolId) => ({
    __typename: CertificateType.StakeDelegation,
    poolId,
    stakeCredential: {
        hash: RewardAccount.toHash(rewardAccount),
        type: CredentialType.KeyHash
    }
});
export const stakeKeyCertificates = (certificates) => certificates?.map((cert) => (isCertType(cert, RegAndDeregCertificateTypes) ? cert : undefined)).filter(isNotNil) ||
    [];
export const includesAnyCertificate = (haystack, needle) => haystack.some(({ __typename }) => needle.includes(__typename)) || false;
