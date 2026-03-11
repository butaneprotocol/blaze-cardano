import * as BaseEncoding from '@scure/base';
import { Address, AddressType, CredentialType } from './Address.js';
import { Hash28ByteBase16 } from '@cardano-sdk/crypto';
import { typedBech32 } from '@cardano-sdk/util';
const MAX_BECH32_LENGTH_LIMIT = 1023;
const CIP_105_DREP_ID_LENGTH = 28;
const CIP_129_DREP_ID_LENGTH = 29;
export const DRepID = (value) => {
    try {
        return typedBech32(value, ['drep'], 47);
    }
    catch {
        return typedBech32(value, ['drep', 'drep_script'], 45);
    }
};
DRepID.isValid = (value) => {
    try {
        DRepID(value);
        return true;
    }
    catch {
        return false;
    }
};
DRepID.cip105FromCredential = (credential) => {
    let prefix = 'drep';
    if (credential.type === CredentialType.ScriptHash) {
        prefix = 'drep_script';
    }
    const words = BaseEncoding.bech32.toWords(Buffer.from(credential.hash, 'hex'));
    return BaseEncoding.bech32.encode(prefix, words, MAX_BECH32_LENGTH_LIMIT);
};
DRepID.cip129FromCredential = (credential) => {
    let header = '22';
    if (credential.type === CredentialType.ScriptHash) {
        header = '23';
    }
    const cip129payload = `${header}${credential.hash}`;
    const words = BaseEncoding.bech32.toWords(Buffer.from(cip129payload, 'hex'));
    return BaseEncoding.bech32.encode('drep', words, MAX_BECH32_LENGTH_LIMIT);
};
DRepID.toCredential = (drepId) => {
    const { words } = BaseEncoding.bech32.decode(drepId, MAX_BECH32_LENGTH_LIMIT);
    const payload = BaseEncoding.bech32.fromWords(words);
    if (payload.length !== CIP_105_DREP_ID_LENGTH && payload.length !== CIP_129_DREP_ID_LENGTH) {
        throw new Error('Invalid DRepID payload');
    }
    if (payload.length === CIP_105_DREP_ID_LENGTH) {
        const isScriptHash = drepId.includes('drep_script');
        return {
            hash: Hash28ByteBase16(Buffer.from(payload).toString('hex')),
            type: isScriptHash ? CredentialType.ScriptHash : CredentialType.KeyHash
        };
    }
    const header = payload[0];
    const hash = payload.slice(1);
    const isDrepGovCred = (header & 0x20) === 0x20;
    const isScriptHash = (header & 0x03) === 0x03;
    if (!isDrepGovCred) {
        throw new Error('Invalid governance credential type');
    }
    return {
        hash: Hash28ByteBase16(Buffer.from(hash).toString('hex')),
        type: isScriptHash ? CredentialType.ScriptHash : CredentialType.KeyHash
    };
};
DRepID.toCip105DRepID = (drepId) => {
    const credential = DRepID.toCredential(drepId);
    return DRepID.cip105FromCredential(credential);
};
DRepID.toCip129DRepID = (drepId) => {
    const credential = DRepID.toCredential(drepId);
    return DRepID.cip129FromCredential(credential);
};
DRepID.toAddress = (drepId) => {
    const credential = DRepID.toCredential(drepId);
    return new Address({
        paymentPart: credential,
        type: credential.type === CredentialType.KeyHash ? AddressType.EnterpriseKey : AddressType.EnterpriseScript
    }).asEnterprise();
};
