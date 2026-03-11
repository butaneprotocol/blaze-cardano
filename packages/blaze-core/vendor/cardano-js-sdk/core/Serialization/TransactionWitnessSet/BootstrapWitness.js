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
var _BootstrapWitness_vkey, _BootstrapWitness_signature, _BootstrapWitness_chainCode, _BootstrapWitness_attributes, _BootstrapWitness_originalBytes;
import { Base64Blob, HexBlob, InvalidArgumentError, InvalidStateError } from "../../../deps/util.js";
import { CborReader, CborWriter } from '../CBOR/index.js';
import { hexToBytes } from '../../util/misc/index.js';
const BOOTSTRAP_WITNESS_ARRAY_SIZE = 4;
const EMPTY_ATTRIBUTES_CBOR = HexBlob('a0');
export class BootstrapWitness {
    constructor(vkey, signature, chainCode, attributes) {
        _BootstrapWitness_vkey.set(this, void 0);
        _BootstrapWitness_signature.set(this, void 0);
        _BootstrapWitness_chainCode.set(this, void 0);
        _BootstrapWitness_attributes.set(this, void 0);
        _BootstrapWitness_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _BootstrapWitness_vkey, vkey, "f");
        __classPrivateFieldSet(this, _BootstrapWitness_signature, signature, "f");
        __classPrivateFieldSet(this, _BootstrapWitness_chainCode, chainCode, "f");
        __classPrivateFieldSet(this, _BootstrapWitness_attributes, attributes, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _BootstrapWitness_originalBytes, "f"))
            return __classPrivateFieldGet(this, _BootstrapWitness_originalBytes, "f");
        if (__classPrivateFieldGet(this, _BootstrapWitness_chainCode, "f").length / 2 !== 32)
            throw new InvalidStateError(`Chaincode must be 32 bytes long, but got ${__classPrivateFieldGet(this, _BootstrapWitness_chainCode, "f").length / 2} bytes long`);
        writer.writeStartArray(BOOTSTRAP_WITNESS_ARRAY_SIZE);
        writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _BootstrapWitness_vkey, "f")));
        writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _BootstrapWitness_signature, "f")));
        writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _BootstrapWitness_chainCode, "f")));
        writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _BootstrapWitness_attributes, "f")));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== BOOTSTRAP_WITNESS_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${BOOTSTRAP_WITNESS_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const vkey = HexBlob.fromBytes(reader.readByteString());
        const signature = HexBlob.fromBytes(reader.readByteString());
        const chainCode = HexBlob.fromBytes(reader.readByteString());
        const attributes = HexBlob.fromBytes(reader.readByteString());
        reader.readEndArray();
        const witness = new BootstrapWitness(vkey, signature, chainCode, attributes);
        __classPrivateFieldSet(witness, _BootstrapWitness_originalBytes, cbor, "f");
        return witness;
    }
    toCore() {
        return {
            addressAttributes: Base64Blob.fromBytes(hexToBytes(__classPrivateFieldGet(this, _BootstrapWitness_attributes, "f"))),
            chainCode: __classPrivateFieldGet(this, _BootstrapWitness_chainCode, "f"),
            key: __classPrivateFieldGet(this, _BootstrapWitness_vkey, "f"),
            signature: __classPrivateFieldGet(this, _BootstrapWitness_signature, "f")
        };
    }
    static fromCore(core) {
        if (!core.chainCode)
            throw new InvalidStateError('Chaincode must be present');
        if (core.chainCode.length / 2 !== 32)
            throw new InvalidStateError(`Chaincode must be 32 bytes long, but got ${core.chainCode.length / 2} bytes long`);
        return new BootstrapWitness(core.key, core.signature, core.chainCode, core.addressAttributes ? HexBlob.fromBase64(core.addressAttributes) : EMPTY_ATTRIBUTES_CBOR);
    }
    vkey() {
        return __classPrivateFieldGet(this, _BootstrapWitness_vkey, "f");
    }
    setVkey(vkey) {
        __classPrivateFieldSet(this, _BootstrapWitness_vkey, vkey, "f");
        __classPrivateFieldSet(this, _BootstrapWitness_originalBytes, undefined, "f");
    }
    signature() {
        return __classPrivateFieldGet(this, _BootstrapWitness_signature, "f");
    }
    setSignature(signature) {
        __classPrivateFieldSet(this, _BootstrapWitness_signature, signature, "f");
        __classPrivateFieldSet(this, _BootstrapWitness_originalBytes, undefined, "f");
    }
    chainCode() {
        return __classPrivateFieldGet(this, _BootstrapWitness_chainCode, "f");
    }
    setChainCode(chainCode) {
        if (chainCode.length / 2 !== 32)
            throw new InvalidStateError(`Chaincode must be 32 bytes long, but got ${chainCode.length / 2} bytes long`);
        __classPrivateFieldSet(this, _BootstrapWitness_chainCode, chainCode, "f");
        __classPrivateFieldSet(this, _BootstrapWitness_originalBytes, undefined, "f");
    }
    attributes() {
        return __classPrivateFieldGet(this, _BootstrapWitness_attributes, "f");
    }
    setAttributes(attributes) {
        __classPrivateFieldSet(this, _BootstrapWitness_attributes, attributes, "f");
        __classPrivateFieldSet(this, _BootstrapWitness_originalBytes, undefined, "f");
    }
}
_BootstrapWitness_vkey = new WeakMap(), _BootstrapWitness_signature = new WeakMap(), _BootstrapWitness_chainCode = new WeakMap(), _BootstrapWitness_attributes = new WeakMap(), _BootstrapWitness_originalBytes = new WeakMap();
