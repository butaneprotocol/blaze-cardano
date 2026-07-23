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
var _Address_props;
import * as BaseEncoding from '@scure/base';
import { BaseAddress } from './BaseAddress.js';
import { ByronAddress } from './ByronAddress.js';
import { EnterpriseAddress } from './EnterpriseAddress.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { NetworkId } from '../ChainId.js';
import { PointerAddress } from './PointerAddress.js';
import { RewardAddress } from './RewardAddress.js';
const MAX_BECH32_LENGTH_LIMIT = 1023;
export var AddressType;
(function (AddressType) {
    AddressType[AddressType["BasePaymentKeyStakeKey"] = 0] = "BasePaymentKeyStakeKey";
    AddressType[AddressType["BasePaymentScriptStakeKey"] = 1] = "BasePaymentScriptStakeKey";
    AddressType[AddressType["BasePaymentKeyStakeScript"] = 2] = "BasePaymentKeyStakeScript";
    AddressType[AddressType["BasePaymentScriptStakeScript"] = 3] = "BasePaymentScriptStakeScript";
    AddressType[AddressType["PointerKey"] = 4] = "PointerKey";
    AddressType[AddressType["PointerScript"] = 5] = "PointerScript";
    AddressType[AddressType["EnterpriseKey"] = 6] = "EnterpriseKey";
    AddressType[AddressType["EnterpriseScript"] = 7] = "EnterpriseScript";
    AddressType[AddressType["Byron"] = 8] = "Byron";
    AddressType[AddressType["RewardKey"] = 14] = "RewardKey";
    AddressType[AddressType["RewardScript"] = 15] = "RewardScript";
})(AddressType || (AddressType = {}));
export var CredentialType;
(function (CredentialType) {
    CredentialType[CredentialType["KeyHash"] = 0] = "KeyHash";
    CredentialType[CredentialType["ScriptHash"] = 1] = "ScriptHash";
})(CredentialType || (CredentialType = {}));
export class Address {
    constructor(props) {
        _Address_props.set(this, void 0);
        __classPrivateFieldSet(this, _Address_props, props, "f");
    }
    static fromBytes(hex) {
        const data = Buffer.from(hex, 'hex');
        const type = data[0] >> 4;
        let address;
        switch (type) {
            case AddressType.BasePaymentKeyStakeKey:
            case AddressType.BasePaymentScriptStakeKey:
            case AddressType.BasePaymentKeyStakeScript:
            case AddressType.BasePaymentScriptStakeScript: {
                address = BaseAddress.unpackParts(type, data);
                break;
            }
            case AddressType.PointerKey:
            case AddressType.PointerScript: {
                address = PointerAddress.unpackParts(type, data);
                break;
            }
            case AddressType.EnterpriseKey:
            case AddressType.EnterpriseScript: {
                address = EnterpriseAddress.unpackParts(type, data);
                break;
            }
            case AddressType.RewardKey:
            case AddressType.RewardScript: {
                address = RewardAddress.unpackParts(type, data);
                break;
            }
            case AddressType.Byron: {
                address = ByronAddress.unpackParts(type, data);
                break;
            }
            default:
                throw new InvalidArgumentError('data', 'Invalid address raw data');
        }
        return address;
    }
    toBytes() {
        let cborData;
        switch (__classPrivateFieldGet(this, _Address_props, "f").type) {
            case AddressType.BasePaymentKeyStakeKey:
            case AddressType.BasePaymentScriptStakeKey:
            case AddressType.BasePaymentKeyStakeScript:
            case AddressType.BasePaymentScriptStakeScript: {
                cborData = BaseAddress.packParts(__classPrivateFieldGet(this, _Address_props, "f"));
                break;
            }
            case AddressType.PointerKey:
            case AddressType.PointerScript: {
                cborData = PointerAddress.packParts(__classPrivateFieldGet(this, _Address_props, "f"));
                break;
            }
            case AddressType.EnterpriseKey:
            case AddressType.EnterpriseScript: {
                cborData = EnterpriseAddress.packParts(__classPrivateFieldGet(this, _Address_props, "f"));
                break;
            }
            case AddressType.RewardKey:
            case AddressType.RewardScript: {
                cborData = RewardAddress.packParts(__classPrivateFieldGet(this, _Address_props, "f"));
                break;
            }
            case AddressType.Byron: {
                cborData = ByronAddress.packParts(__classPrivateFieldGet(this, _Address_props, "f"));
                break;
            }
            default:
                throw new Error('Invalid address');
        }
        return HexBlob.fromBytes(cborData);
    }
    static fromBase58(base58Address) {
        return Address.fromBytes(HexBlob.fromBytes(BaseEncoding.base58.decode(base58Address)));
    }
    toBase58() {
        if (__classPrivateFieldGet(this, _Address_props, "f").type !== AddressType.Byron)
            throw new Error('Only Byron addresses will be encoded in base58');
        return BaseEncoding.base58.encode(Buffer.from(this.toBytes(), 'hex'));
    }
    toBech32() {
        const words = BaseEncoding.bech32.toWords(Buffer.from(this.toBytes(), 'hex'));
        if (__classPrivateFieldGet(this, _Address_props, "f").type === AddressType.Byron)
            throw new Error('Only Shelley addresses will be encoded in bech32');
        const prefix = Address.getBech32Prefix(__classPrivateFieldGet(this, _Address_props, "f").type, __classPrivateFieldGet(this, _Address_props, "f").networkId);
        const bech32Address = BaseEncoding.bech32.encode(prefix, words, MAX_BECH32_LENGTH_LIMIT);
        return __classPrivateFieldGet(this, _Address_props, "f").type === AddressType.RewardKey || __classPrivateFieldGet(this, _Address_props, "f").type === AddressType.RewardScript
            ? bech32Address
            : bech32Address;
    }
    static fromBech32(bech32) {
        const { words } = BaseEncoding.bech32.decode(bech32, MAX_BECH32_LENGTH_LIMIT);
        return Address.fromBytes(HexBlob.fromBytes(BaseEncoding.bech32.fromWords(words)));
    }
    static fromString(address) {
        try {
            if (Address.isValidBech32(address))
                return Address.fromBech32(address);
            if (Address.isValidByron(address))
                return Address.fromBase58(address);
            return Address.fromBytes(HexBlob(address));
        }
        catch {
        }
        return null;
    }
    static isValidBech32(bech32) {
        try {
            Address.fromBech32(bech32);
        }
        catch {
            return false;
        }
        return true;
    }
    static isValidByron(base58) {
        try {
            const addr = Address.fromBase58(base58);
            if (__classPrivateFieldGet(addr, _Address_props, "f").type !== AddressType.Byron)
                return false;
        }
        catch {
            return false;
        }
        return true;
    }
    static isValid(address) {
        return Address.isValidBech32(address) || Address.isValidByron(address);
    }
    asByron() {
        return ByronAddress.fromAddress(this);
    }
    asReward() {
        return RewardAddress.fromAddress(this);
    }
    asPointer() {
        return PointerAddress.fromAddress(this);
    }
    asEnterprise() {
        return EnterpriseAddress.fromAddress(this);
    }
    asBase() {
        return BaseAddress.fromAddress(this);
    }
    getType() {
        return __classPrivateFieldGet(this, _Address_props, "f").type;
    }
    getNetworkId() {
        if (__classPrivateFieldGet(this, _Address_props, "f").type === AddressType.Byron) {
            if (__classPrivateFieldGet(this, _Address_props, "f").byronAddressContent?.attrs.magic === undefined)
                return NetworkId.Mainnet;
            return NetworkId.Testnet;
        }
        return __classPrivateFieldGet(this, _Address_props, "f").networkId;
    }
    getProps() {
        return __classPrivateFieldGet(this, _Address_props, "f");
    }
    static getBech32Prefix(type, networkId) {
        let prefix = '';
        switch (type) {
            case AddressType.BasePaymentKeyStakeKey:
            case AddressType.BasePaymentScriptStakeKey:
            case AddressType.BasePaymentKeyStakeScript:
            case AddressType.BasePaymentScriptStakeScript:
            case AddressType.PointerKey:
            case AddressType.PointerScript:
            case AddressType.EnterpriseKey:
            case AddressType.EnterpriseScript:
                prefix = 'addr';
                break;
            case AddressType.RewardKey:
            case AddressType.RewardScript: {
                prefix = 'stake';
                break;
            }
            default:
                throw new Error('Invalid address');
        }
        prefix += networkId === 0 ? '_test' : '';
        return prefix;
    }
}
_Address_props = new WeakMap();
export const isAddress = (input) => Address.isValid(input);
