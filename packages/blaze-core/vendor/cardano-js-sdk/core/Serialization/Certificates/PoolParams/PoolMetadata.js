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
var _PoolMetadata_url, _PoolMetadata_hash, _PoolMetadata_originalBytes;
import * as Crypto from "../../../../deps/crypto.js";
import { CborReader, CborWriter } from '../../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from "../../../../deps/util.js";
const MAX_URL_SIZE_STR_LENGTH = 64;
const EMBEDDED_GROUP_SIZE = 2;
export class PoolMetadata {
    constructor(url, poolMetadataHash) {
        _PoolMetadata_url.set(this, void 0);
        _PoolMetadata_hash.set(this, void 0);
        _PoolMetadata_originalBytes.set(this, undefined);
        if (url.length > MAX_URL_SIZE_STR_LENGTH)
            throw new InvalidArgumentError('url', `url must be less or equal to 64 characters long, actual size ${url.length}`);
        __classPrivateFieldSet(this, _PoolMetadata_url, url, "f");
        __classPrivateFieldSet(this, _PoolMetadata_hash, poolMetadataHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _PoolMetadata_originalBytes, "f"))
            return __classPrivateFieldGet(this, _PoolMetadata_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeTextString(__classPrivateFieldGet(this, _PoolMetadata_url, "f"));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _PoolMetadata_hash, "f"), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const url = reader.readTextString();
        const hash = Crypto.Hash32ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const metadata = new PoolMetadata(url, hash);
        __classPrivateFieldSet(metadata, _PoolMetadata_originalBytes, cbor, "f");
        return metadata;
    }
    toCore() {
        return {
            hash: __classPrivateFieldGet(this, _PoolMetadata_hash, "f"),
            url: __classPrivateFieldGet(this, _PoolMetadata_url, "f")
        };
    }
    static fromCore(metadata) {
        return new PoolMetadata(metadata.url, metadata.hash);
    }
    url() {
        return __classPrivateFieldGet(this, _PoolMetadata_url, "f");
    }
    setUrl(url) {
        __classPrivateFieldSet(this, _PoolMetadata_url, url, "f");
        __classPrivateFieldSet(this, _PoolMetadata_originalBytes, undefined, "f");
    }
    poolMetadataHash() {
        return __classPrivateFieldGet(this, _PoolMetadata_hash, "f");
    }
    setPoolMetadataHash(poolMetadataHash) {
        __classPrivateFieldSet(this, _PoolMetadata_hash, poolMetadataHash, "f");
        __classPrivateFieldSet(this, _PoolMetadata_originalBytes, undefined, "f");
    }
}
_PoolMetadata_url = new WeakMap(), _PoolMetadata_hash = new WeakMap(), _PoolMetadata_originalBytes = new WeakMap();
