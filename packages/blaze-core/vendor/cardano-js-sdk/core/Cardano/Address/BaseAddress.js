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
var _BaseAddress_type, _BaseAddress_networkId, _BaseAddress_paymentPart, _BaseAddress_delegationPart;
import { Address, AddressType, CredentialType } from './Address.js';
import { Hash28ByteBase16 } from '@cardano-sdk/crypto';
import { InvalidArgumentError } from '@cardano-sdk/util';
export class BaseAddress {
    constructor(props) {
        _BaseAddress_type.set(this, void 0);
        _BaseAddress_networkId.set(this, void 0);
        _BaseAddress_paymentPart.set(this, void 0);
        _BaseAddress_delegationPart.set(this, void 0);
        __classPrivateFieldSet(this, _BaseAddress_networkId, props.networkId, "f");
        __classPrivateFieldSet(this, _BaseAddress_paymentPart, props.paymentPart, "f");
        __classPrivateFieldSet(this, _BaseAddress_delegationPart, props.delegationPart, "f");
        __classPrivateFieldSet(this, _BaseAddress_type, props.type, "f");
    }
    static fromCredentials(networkId, payment, stake) {
        let type = AddressType.BasePaymentKeyStakeKey;
        if (payment.type === CredentialType.ScriptHash)
            type |= 0b0001;
        if (stake.type === CredentialType.ScriptHash)
            type |= 0b0010;
        return new BaseAddress({
            delegationPart: stake,
            networkId,
            paymentPart: payment,
            type
        });
    }
    getPaymentCredential() {
        return __classPrivateFieldGet(this, _BaseAddress_paymentPart, "f");
    }
    getStakeCredential() {
        return __classPrivateFieldGet(this, _BaseAddress_delegationPart, "f");
    }
    toAddress() {
        return new Address({
            delegationPart: __classPrivateFieldGet(this, _BaseAddress_delegationPart, "f"),
            networkId: __classPrivateFieldGet(this, _BaseAddress_networkId, "f"),
            paymentPart: __classPrivateFieldGet(this, _BaseAddress_paymentPart, "f"),
            type: __classPrivateFieldGet(this, _BaseAddress_type, "f")
        });
    }
    static fromAddress(addr) {
        let address;
        switch (addr.getProps().type) {
            case AddressType.BasePaymentKeyStakeKey:
            case AddressType.BasePaymentScriptStakeKey:
            case AddressType.BasePaymentKeyStakeScript:
            case AddressType.BasePaymentScriptStakeScript:
                address = new BaseAddress(addr.getProps());
                break;
            default:
        }
        return address;
    }
    static packParts(props) {
        return Buffer.concat([
            Buffer.from([(props.type << 4) | props.networkId]),
            Buffer.from(props.paymentPart.hash, 'hex'),
            Buffer.from(props.delegationPart.hash, 'hex')
        ]);
    }
    static unpackParts(type, data) {
        if (data.length !== 57)
            throw new InvalidArgumentError('data', 'Base address data length should be 57 bytes long.');
        const network = data[0] & 15;
        const paymentCredential = Hash28ByteBase16(Buffer.from(data.slice(1, 29)).toString('hex'));
        const stakeCredential = Hash28ByteBase16(Buffer.from(data.slice(29, 57)).toString('hex'));
        const delegationCredType = type === AddressType.BasePaymentKeyStakeScript || type === AddressType.BasePaymentScriptStakeScript
            ? CredentialType.ScriptHash
            : CredentialType.KeyHash;
        const paymentCredType = type === AddressType.BasePaymentScriptStakeKey || type === AddressType.BasePaymentScriptStakeScript
            ? CredentialType.ScriptHash
            : CredentialType.KeyHash;
        return new Address({
            delegationPart: {
                hash: stakeCredential,
                type: delegationCredType
            },
            networkId: network,
            paymentPart: {
                hash: paymentCredential,
                type: paymentCredType
            },
            type
        });
    }
}
_BaseAddress_type = new WeakMap(), _BaseAddress_networkId = new WeakMap(), _BaseAddress_paymentPart = new WeakMap(), _BaseAddress_delegationPart = new WeakMap();
