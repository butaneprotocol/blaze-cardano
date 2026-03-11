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
var _RewardAddress_type, _RewardAddress_networkId, _RewardAddress_paymentPart;
import { Address, AddressType, CredentialType } from './Address.js';
import { Hash28ByteBase16 } from '@cardano-sdk/crypto';
import { InvalidArgumentError } from '@cardano-sdk/util';
export class RewardAddress {
    constructor(props) {
        _RewardAddress_type.set(this, void 0);
        _RewardAddress_networkId.set(this, void 0);
        _RewardAddress_paymentPart.set(this, void 0);
        __classPrivateFieldSet(this, _RewardAddress_networkId, props.networkId, "f");
        __classPrivateFieldSet(this, _RewardAddress_paymentPart, props.paymentPart, "f");
        __classPrivateFieldSet(this, _RewardAddress_type, props.type, "f");
    }
    static fromCredentials(networkId, payment) {
        let type = AddressType.RewardKey;
        if (payment.type === CredentialType.ScriptHash)
            type |= 0b0001;
        return new RewardAddress({
            networkId,
            paymentPart: payment,
            type
        });
    }
    getPaymentCredential() {
        return __classPrivateFieldGet(this, _RewardAddress_paymentPart, "f");
    }
    toAddress() {
        return new Address({
            networkId: __classPrivateFieldGet(this, _RewardAddress_networkId, "f"),
            paymentPart: __classPrivateFieldGet(this, _RewardAddress_paymentPart, "f"),
            type: __classPrivateFieldGet(this, _RewardAddress_type, "f")
        });
    }
    static fromAddress(addr) {
        let address;
        switch (addr.getProps().type) {
            case AddressType.RewardKey:
            case AddressType.RewardScript:
                address = new RewardAddress(addr.getProps());
                break;
            default:
        }
        return address;
    }
    static packParts(props) {
        return Buffer.concat([
            Buffer.from([(props.type << 4) | props.networkId]),
            Buffer.from(props.paymentPart.hash, 'hex')
        ]);
    }
    static unpackParts(type, data) {
        if (data.length !== 29)
            throw new InvalidArgumentError('data', 'Enterprise address data length should be 29 bytes long.');
        const network = data[0] & 15;
        const stakeCredential = Hash28ByteBase16(Buffer.from(data.slice(1, 29)).toString('hex'));
        return new Address({
            networkId: network,
            paymentPart: {
                hash: stakeCredential,
                type: type === AddressType.RewardScript ? CredentialType.ScriptHash : CredentialType.KeyHash
            },
            type
        });
    }
}
_RewardAddress_type = new WeakMap(), _RewardAddress_networkId = new WeakMap(), _RewardAddress_paymentPart = new WeakMap();
