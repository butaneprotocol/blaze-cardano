import { Address, CredentialType } from '../Address/index.js';
export const isScriptAddress = (address) => {
    if (!Address.isValidBech32(address)) {
        return false;
    }
    const baseAddress = Address.fromBech32(address).asBase();
    const paymentCredential = baseAddress?.getPaymentCredential();
    const stakeCredential = baseAddress?.getStakeCredential();
    return paymentCredential?.type === CredentialType.ScriptHash && stakeCredential?.type === CredentialType.ScriptHash;
};
