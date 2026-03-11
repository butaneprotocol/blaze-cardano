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
var _VkeyWitness_vkey, _VkeyWitness_signature, _VkeyWitness_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { hexToBytes } from '../../util/misc/index.js';
const VKEY_ARRAY_SIZE = 2;
export class VkeyWitness {
    constructor(vkey, signature) {
        _VkeyWitness_vkey.set(this, void 0);
        _VkeyWitness_signature.set(this, void 0);
        _VkeyWitness_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _VkeyWitness_vkey, vkey, "f");
        __classPrivateFieldSet(this, _VkeyWitness_signature, signature, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _VkeyWitness_originalBytes, "f"))
            return __classPrivateFieldGet(this, _VkeyWitness_originalBytes, "f");
        writer.writeStartArray(VKEY_ARRAY_SIZE);
        writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _VkeyWitness_vkey, "f")));
        writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _VkeyWitness_signature, "f")));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== VKEY_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${VKEY_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const vkey = HexBlob.fromBytes(reader.readByteString());
        const signature = HexBlob.fromBytes(reader.readByteString());
        reader.readEndArray();
        const witness = new VkeyWitness(vkey, signature);
        __classPrivateFieldSet(witness, _VkeyWitness_originalBytes, cbor, "f");
        return witness;
    }
    toCore() {
        return [__classPrivateFieldGet(this, _VkeyWitness_vkey, "f"), __classPrivateFieldGet(this, _VkeyWitness_signature, "f")];
    }
    static fromCore(signatureEntry) {
        return new VkeyWitness(signatureEntry[0], signatureEntry[1]);
    }
    vkey() {
        return __classPrivateFieldGet(this, _VkeyWitness_vkey, "f");
    }
    setVkey(vkey) {
        __classPrivateFieldSet(this, _VkeyWitness_vkey, vkey, "f");
        __classPrivateFieldSet(this, _VkeyWitness_originalBytes, undefined, "f");
    }
    signature() {
        return __classPrivateFieldGet(this, _VkeyWitness_signature, "f");
    }
    setSignature(signature) {
        __classPrivateFieldSet(this, _VkeyWitness_signature, signature, "f");
        __classPrivateFieldSet(this, _VkeyWitness_originalBytes, undefined, "f");
    }
}
_VkeyWitness_vkey = new WeakMap(), _VkeyWitness_signature = new WeakMap(), _VkeyWitness_originalBytes = new WeakMap();
