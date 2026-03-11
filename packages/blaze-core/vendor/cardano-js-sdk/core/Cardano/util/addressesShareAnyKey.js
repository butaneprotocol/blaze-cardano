import { Address, AddressType } from '../Address/Address.js';
import { InvalidStringError } from '@cardano-sdk/util';
const getAddressKeyIDs = (input) => {
    const address = typeof input === 'string' ? Address.fromString(input) : input;
    if (!address) {
        throw new InvalidStringError('Expected either bech32 or base58 address');
    }
    switch (address.getType()) {
        case AddressType.BasePaymentKeyStakeKey:
        case AddressType.BasePaymentKeyStakeScript:
        case AddressType.BasePaymentScriptStakeKey:
        case AddressType.BasePaymentScriptStakeScript: {
            const baseAddr = address.asBase();
            return {
                paymentId: { credential: baseAddr.getPaymentCredential() },
                stakeId: { credential: baseAddr.getStakeCredential() }
            };
        }
        case AddressType.Byron:
            return {
                paymentId: { byronRoot: address.asByron().getRoot() }
            };
        case AddressType.EnterpriseKey:
        case AddressType.EnterpriseScript: {
            const enterpriseAddr = address.asEnterprise();
            return {
                paymentId: { credential: enterpriseAddr.getPaymentCredential() }
            };
        }
        case AddressType.PointerKey:
        case AddressType.PointerScript: {
            const pointerAddr = address.asPointer();
            return {
                paymentId: { credential: pointerAddr.getPaymentCredential() },
                stakeId: { pointer: pointerAddr.getStakePointer() }
            };
        }
        case AddressType.RewardKey:
        case AddressType.RewardScript: {
            const rewardAddr = address.asReward();
            return {
                stakeId: { credential: rewardAddr.getPaymentCredential() }
            };
        }
    }
};
const isPaymentIdPresentAndEquals = (id1, id2) => {
    if (!id1 || !id2)
        return false;
    if ('credential' in id1 && 'credential' in id2) {
        return id1.credential.hash === id2.credential.hash;
    }
    if ('byronRoot' in id1 && 'byronRoot' in id2) {
        return id1.byronRoot === id2.byronRoot;
    }
    return false;
};
const isStakeIdPresentAndEquals = (id1, id2) => {
    if (!id1 || !id2)
        return false;
    if ('credential' in id1 && 'credential' in id2) {
        return id1.credential.hash === id2.credential.hash;
    }
    if ('pointer' in id1 && 'pointer' in id2) {
        return (id1.pointer.slot === id2.pointer.slot &&
            id1.pointer.txIndex === id2.pointer.txIndex &&
            id1.pointer.certIndex === id2.pointer.certIndex);
    }
    return false;
};
export const addressesShareAnyKey = (address1, address2) => {
    if (address1 === address2)
        return true;
    const ids1 = getAddressKeyIDs(address1);
    const ids2 = getAddressKeyIDs(address2);
    return (isPaymentIdPresentAndEquals(ids1.paymentId, ids2.paymentId) || isStakeIdPresentAndEquals(ids1.stakeId, ids2.stakeId));
};
