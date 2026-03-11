import { Address, AddressType } from './Address.js';
import { DRepID } from './DRepID.js';
import { HexBlob, InvalidStringError, assertIsBech32WithPrefix, assertIsHexString } from '@cardano-sdk/util';
export const isRewardAccount = (address) => {
    try {
        assertIsBech32WithPrefix(address, ['stake', 'stake_test']);
        return true;
    }
    catch {
        return false;
    }
};
export const PaymentAddress = (value) => {
    if (Address.isValid(value)) {
        if (isRewardAccount(value) || DRepID.isValid(value)) {
            throw new InvalidStringError(value, 'Address type can only be used for payment addresses');
        }
        return value;
    }
    try {
        assertIsHexString(value);
    }
    catch {
        throw new InvalidStringError(value, 'Expected payment address as bech32, base58 or hex-encoded bytes');
    }
    const address = Address.fromBytes(HexBlob.fromBytes(Buffer.from(value, 'hex')));
    return (address.getType() === AddressType.Byron ? address.toBase58() : address.toBech32());
};
export const isAddressWithin = (addresses) => ({ address }) => addresses.includes(address);
export const inputsWithAddresses = (tx, ownAddresses) => tx.body.inputs.filter(isAddressWithin(ownAddresses));
export const addressNetworkId = (address) => {
    const addr = Address.fromString(address);
    return addr.getNetworkId();
};
