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
var _Constitution_anchor, _Constitution_scriptHash, _Constitution_originalBytes;
import { Anchor } from '../../Common/Anchor.js';
import { CborReader, CborReaderState, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { hexToBytes } from '../../../util/misc/index.js';
const CONSTITUTION_ARRAY_SIZE = 2;
export class Constitution {
    constructor(anchor, scriptHash) {
        _Constitution_anchor.set(this, void 0);
        _Constitution_scriptHash.set(this, void 0);
        _Constitution_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Constitution_anchor, anchor, "f");
        __classPrivateFieldSet(this, _Constitution_scriptHash, scriptHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _Constitution_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Constitution_originalBytes, "f");
        writer.writeStartArray(CONSTITUTION_ARRAY_SIZE);
        writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _Constitution_anchor, "f").toCbor()));
        __classPrivateFieldGet(this, _Constitution_scriptHash, "f") ? writer.writeByteString(hexToBytes(__classPrivateFieldGet(this, _Constitution_scriptHash, "f"))) : writer.writeNull();
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== CONSTITUTION_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${CONSTITUTION_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const anchor = Anchor.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        let scriptHash;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            scriptHash = HexBlob.fromBytes(reader.readByteString());
        }
        reader.readEndArray();
        const constitution = new Constitution(anchor, scriptHash);
        __classPrivateFieldSet(constitution, _Constitution_originalBytes, cbor, "f");
        return constitution;
    }
    toCore() {
        return {
            anchor: __classPrivateFieldGet(this, _Constitution_anchor, "f").toCore(),
            scriptHash: __classPrivateFieldGet(this, _Constitution_scriptHash, "f") ? __classPrivateFieldGet(this, _Constitution_scriptHash, "f") : null
        };
    }
    static fromCore(constitution) {
        return new Constitution(Anchor.fromCore(constitution.anchor), constitution.scriptHash !== null ? constitution.scriptHash : undefined);
    }
    anchor() {
        return __classPrivateFieldGet(this, _Constitution_anchor, "f");
    }
    setAnchor(anchor) {
        __classPrivateFieldSet(this, _Constitution_anchor, anchor, "f");
        __classPrivateFieldSet(this, _Constitution_originalBytes, undefined, "f");
    }
    scriptHash() {
        return __classPrivateFieldGet(this, _Constitution_scriptHash, "f");
    }
    setScriptHash(scriptHash) {
        __classPrivateFieldSet(this, _Constitution_scriptHash, scriptHash, "f");
        __classPrivateFieldSet(this, _Constitution_originalBytes, undefined, "f");
    }
}
_Constitution_anchor = new WeakMap(), _Constitution_scriptHash = new WeakMap(), _Constitution_originalBytes = new WeakMap();
