import * as Address from '../../Cardano/Address/index.js';
import * as Cardano from '../../Cardano/types/index.js';
import { BigIntMath } from "../../../deps/util.js";
import { Ed25519KeyHashHex } from "../../../deps/crypto.js";
const stakeCredentialInRewardAccounts = (stakeCredential, rewardAccounts) => {
    if (rewardAccounts.length === 0)
        return true;
    const networkId = Address.RewardAccount.toNetworkId(rewardAccounts[0]);
    return rewardAccounts.includes(Address.RewardAccount.fromCredential(stakeCredential, networkId));
};
const computeShellyDeposits = (depositParams, certificates, rewardAccounts) => {
    let deposit = 0n;
    let reclaimDeposit = 0n;
    const anyRewardAccount = rewardAccounts.length === 0;
    const poolIds = new Set(rewardAccounts.map((account) => Cardano.PoolId.fromKeyHash(Ed25519KeyHashHex(Address.RewardAccount.toHash(account)))));
    for (const cert of certificates) {
        switch (cert.__typename) {
            case Cardano.CertificateType.StakeRegistration:
                if (stakeCredentialInRewardAccounts(cert.stakeCredential, rewardAccounts))
                    deposit += depositParams.stakeKeyDeposit;
                break;
            case Cardano.CertificateType.StakeDeregistration:
                if (stakeCredentialInRewardAccounts(cert.stakeCredential, rewardAccounts))
                    reclaimDeposit += depositParams.stakeKeyDeposit;
                break;
            case Cardano.CertificateType.PoolRegistration:
                if (anyRewardAccount || rewardAccounts.some((acct) => cert.poolParameters.owners.includes(acct)))
                    deposit += depositParams.poolDeposit;
                break;
            case Cardano.CertificateType.PoolRetirement: {
                if (anyRewardAccount || poolIds.has(cert.poolId))
                    reclaimDeposit += depositParams.poolDeposit;
                break;
            }
        }
    }
    return {
        deposit,
        reclaimDeposit
    };
};
const computeConwayDeposits = (certificates, rewardAccounts, dRepKeyHash, proposalProcedures) => {
    let deposit = 0n;
    let reclaimDeposit = 0n;
    for (const cert of certificates) {
        switch (cert.__typename) {
            case Cardano.CertificateType.Registration:
            case Cardano.CertificateType.StakeRegistrationDelegation:
            case Cardano.CertificateType.VoteRegistrationDelegation:
            case Cardano.CertificateType.StakeVoteRegistrationDelegation:
                if (stakeCredentialInRewardAccounts(cert.stakeCredential, rewardAccounts))
                    deposit += cert.deposit;
                break;
            case Cardano.CertificateType.Unregistration:
                if (stakeCredentialInRewardAccounts(cert.stakeCredential, rewardAccounts))
                    reclaimDeposit += cert.deposit;
                break;
            case Cardano.CertificateType.RegisterDelegateRepresentative:
            case Cardano.CertificateType.UnregisterDelegateRepresentative:
                if (!dRepKeyHash ||
                    (cert.dRepCredential.type === Address.CredentialType.KeyHash && cert.dRepCredential.hash === dRepKeyHash)) {
                    cert.__typename === Cardano.CertificateType.RegisterDelegateRepresentative
                        ? (deposit += cert.deposit)
                        : (reclaimDeposit += cert.deposit);
                }
                break;
        }
    }
    if (proposalProcedures)
        for (const proposal of proposalProcedures)
            deposit += proposal.deposit;
    return {
        deposit,
        reclaimDeposit
    };
};
const getTxDeposits = ({ stakeKeyDeposit, poolDeposit }, certificates, rewardAccounts = [], dRepKeyHash, proposalProcedures) => {
    if (certificates.length === 0 && (!proposalProcedures || proposalProcedures.length === 0))
        return { deposit: 0n, reclaimDeposit: 0n };
    const depositParams = {
        poolDeposit: poolDeposit ? BigInt(poolDeposit) : 0n,
        stakeKeyDeposit: BigInt(stakeKeyDeposit)
    };
    const shelleyDeposits = computeShellyDeposits(depositParams, certificates, rewardAccounts);
    const conwayDeposits = computeConwayDeposits(certificates, rewardAccounts, dRepKeyHash, proposalProcedures);
    return {
        deposit: shelleyDeposits.deposit + conwayDeposits.deposit,
        reclaimDeposit: shelleyDeposits.reclaimDeposit + conwayDeposits.reclaimDeposit
    };
};
const getOwnWithdrawalsTotal = (withdrawals, rewardAccounts) => BigIntMath.sum(withdrawals.filter(({ stakeAddress }) => rewardAccounts.includes(stakeAddress)).map(({ quantity }) => quantity));
export const computeImplicitCoin = ({ stakeKeyDeposit, poolDeposit }, { certificates, proposalProcedures, withdrawals = [] }, rewardAccounts, dRepKeyHash) => {
    const { deposit, reclaimDeposit } = getTxDeposits({ poolDeposit, stakeKeyDeposit }, certificates ?? [], rewardAccounts, dRepKeyHash, proposalProcedures);
    const hasRewardAccount = !!rewardAccounts?.length;
    const allWithdrawalsTotal = BigIntMath.sum(withdrawals.map(({ quantity }) => quantity));
    const withdrawalsTotal = hasRewardAccount ? getOwnWithdrawalsTotal(withdrawals, rewardAccounts) : allWithdrawalsTotal;
    return {
        deposit,
        input: withdrawalsTotal + reclaimDeposit,
        reclaimDeposit,
        withdrawals: withdrawalsTotal
    };
};
