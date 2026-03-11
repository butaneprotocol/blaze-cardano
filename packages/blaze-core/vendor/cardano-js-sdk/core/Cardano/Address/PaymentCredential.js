import * as BaseEncoding from '@scure/base';
import { CredentialType } from './Address.js';
import { typedBech32 } from '@cardano-sdk/util';
export const PaymentCredential = (value) => {
    try {
        return typedBech32(value, ['addr_vkh'], 45);
    }
    catch {
        return typedBech32(value, ['script'], 45);
    }
};
PaymentCredential.fromCredential = (credential) => {
    const words = BaseEncoding.bech32.toWords(Buffer.from(credential.hash, 'hex'));
    const prefix = credential.type === CredentialType.KeyHash ? 'addr_vkh' : 'script';
    return BaseEncoding.bech32.encode(prefix, words, 1023);
};
