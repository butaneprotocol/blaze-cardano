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
var _PointerAddress_type, _PointerAddress_networkId, _PointerAddress_paymentPart, _PointerAddress_pointer;
import { Address, AddressType, CredentialType } from './Address.js';
import { Hash28ByteBase16 } from "../../../deps/crypto.js";
import { InvalidArgumentError } from "../../../deps/util.js";
const variableLengthEncode = (val) => {
    if (typeof val !== 'bigint') {
        val = BigInt(val);
    }
    if (val < 0) {
        throw new InvalidArgumentError('val', `Negative numbers not supported. Number supplied: ${val}`);
    }
    const encoded = [];
    let bitLength = val.toString(2).length;
    encoded.push(Number(val & 127n));
    while (bitLength > 7) {
        val >>= 7n;
        bitLength -= 7;
        encoded.unshift(Number((val & 127n) + 128n));
    }
    return Buffer.from(encoded);
};
const variableLengthDecode = (array) => {
    let more = true;
    let value = 0n;
    let bytesRead = 0;
    while (more && bytesRead < array.length) {
        const b = array[bytesRead];
        value <<= 7n;
        value |= BigInt(b & 127);
        more = (b & 128) !== 0;
        ++bytesRead;
    }
    return { bytesRead, value };
};
export const TxIndex = (value) => value;
export const CertIndex = (value) => value;
export class PointerAddress {
    constructor(props) {
        _PointerAddress_type.set(this, void 0);
        _PointerAddress_networkId.set(this, void 0);
        _PointerAddress_paymentPart.set(this, void 0);
        _PointerAddress_pointer.set(this, void 0);
        __classPrivateFieldSet(this, _PointerAddress_networkId, props.networkId, "f");
        __classPrivateFieldSet(this, _PointerAddress_paymentPart, props.paymentPart, "f");
        __classPrivateFieldSet(this, _PointerAddress_pointer, props.pointer, "f");
        __classPrivateFieldSet(this, _PointerAddress_type, props.type, "f");
    }
    static fromCredentials(networkId, payment, pointer) {
        let type = AddressType.PointerKey;
        if (payment.type === CredentialType.ScriptHash)
            type &= 0b0001;
        return new PointerAddress({
            networkId,
            paymentPart: payment,
            pointer,
            type
        });
    }
    getPaymentCredential() {
        return __classPrivateFieldGet(this, _PointerAddress_paymentPart, "f");
    }
    getStakePointer() {
        return __classPrivateFieldGet(this, _PointerAddress_pointer, "f");
    }
    toAddress() {
        return new Address({
            networkId: __classPrivateFieldGet(this, _PointerAddress_networkId, "f"),
            paymentPart: __classPrivateFieldGet(this, _PointerAddress_paymentPart, "f"),
            pointer: __classPrivateFieldGet(this, _PointerAddress_pointer, "f"),
            type: __classPrivateFieldGet(this, _PointerAddress_type, "f")
        });
    }
    static fromAddress(addr) {
        let address;
        switch (addr.getProps().type) {
            case AddressType.PointerKey:
            case AddressType.PointerScript:
                address = new PointerAddress(addr.getProps());
                break;
            default:
        }
        return address;
    }
    static packParts(props) {
        const { slot, txIndex, certIndex } = props.pointer;
        return Buffer.concat([
            Buffer.from([(props.type << 4) | props.networkId]),
            Buffer.from(props.paymentPart.hash, 'hex'),
            Buffer.concat([variableLengthEncode(slot), variableLengthEncode(txIndex), variableLengthEncode(certIndex)])
        ]);
    }
    static unpackParts(type, data) {
        if (data.length <= 29)
            throw new InvalidArgumentError('data', 'Pointer address data length should greater than 29 bytes long.');
        const network = data[0] & 15;
        const paymentCredential = Hash28ByteBase16(Buffer.from(data.slice(1, 29)).toString('hex'));
        let index = 29;
        const dataBuffer = Buffer.from(data);
        const { value: slot, bytesRead: slotBytes } = variableLengthDecode(dataBuffer.subarray(index));
        index += slotBytes;
        const { value: txIndex, bytesRead: txIndexBytes } = variableLengthDecode(dataBuffer.subarray(index));
        index += txIndexBytes;
        const { value: certIndex } = variableLengthDecode(dataBuffer.subarray(index));
        return new Address({
            networkId: network,
            paymentPart: {
                hash: paymentCredential,
                type: type === AddressType.PointerScript ? CredentialType.ScriptHash : CredentialType.KeyHash
            },
            pointer: { certIndex: CertIndex(Number(certIndex)), slot, txIndex: TxIndex(Number(txIndex)) },
            type
        });
    }
}
_PointerAddress_type = new WeakMap(), _PointerAddress_networkId = new WeakMap(), _PointerAddress_paymentPart = new WeakMap(), _PointerAddress_pointer = new WeakMap();
