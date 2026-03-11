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
var _Value_coin, _Value_multiasset, _Value_originalBytes;
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { multiAssetsToTokenMap, sortCanonically, tokenMapToMultiAsset } from './Utils.js';
const VALUE_ARRAY_SIZE = 2;
export class Value {
    constructor(coin, multiasset) {
        _Value_coin.set(this, 0n);
        _Value_multiasset.set(this, undefined);
        _Value_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _Value_coin, coin, "f");
        __classPrivateFieldSet(this, _Value_multiasset, multiasset
            ? multiAssetsToTokenMap(new Map([...tokenMapToMultiAsset(multiasset).entries()].sort(sortCanonically)))
            : undefined, "f");
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _Value_originalBytes, "f"))
            return __classPrivateFieldGet(this, _Value_originalBytes, "f");
        const writer = new CborWriter();
        if (!__classPrivateFieldGet(this, _Value_multiasset, "f") || __classPrivateFieldGet(this, _Value_multiasset, "f").size <= 0) {
            writer.writeInt(__classPrivateFieldGet(this, _Value_coin, "f"));
        }
        else {
            writer.writeStartArray(VALUE_ARRAY_SIZE);
            writer.writeInt(__classPrivateFieldGet(this, _Value_coin, "f"));
            const multiassets = tokenMapToMultiAsset(__classPrivateFieldGet(this, _Value_multiasset, "f"));
            const sortedMultiAssets = new Map([...multiassets.entries()].sort(sortCanonically));
            writer.writeStartMap(sortedMultiAssets.size);
            for (const [scriptHash, assets] of sortedMultiAssets.entries()) {
                writer.writeByteString(Buffer.from(scriptHash, 'hex'));
                const sortedAssets = new Map([...assets.entries()].sort(sortCanonically));
                writer.writeStartMap(sortedAssets.size);
                for (const [assetName, quantity] of sortedAssets.entries()) {
                    writer.writeByteString(Buffer.from(assetName, 'hex'));
                    writer.writeInt(quantity);
                }
            }
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        if (reader.peekState() === CborReaderState.UnsignedInteger) {
            const coins = reader.readUInt();
            return new Value(coins);
        }
        const length = reader.readStartArray();
        if (length !== VALUE_ARRAY_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${VALUE_ARRAY_SIZE} elements, but got an array of ${length} elements`);
        const coins = reader.readUInt();
        const multiassets = new Map();
        reader.readStartMap();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const scriptHash = HexBlob.fromBytes(reader.readByteString());
            if (!multiassets.has(scriptHash))
                multiassets.set(scriptHash, new Map());
            reader.readStartMap();
            while (reader.peekState() !== CborReaderState.EndMap) {
                const assetName = Buffer.from(reader.readByteString()).toString('hex');
                const quantity = reader.readUInt();
                multiassets.get(scriptHash).set(assetName, quantity);
            }
            reader.readEndMap();
        }
        reader.readEndMap();
        const sortedAssets = new Map([...multiAssetsToTokenMap(multiassets)].sort(sortCanonically));
        const value = new Value(coins, sortedAssets);
        __classPrivateFieldSet(value, _Value_originalBytes, cbor, "f");
        return value;
    }
    toCore() {
        return { assets: __classPrivateFieldGet(this, _Value_multiasset, "f"), coins: __classPrivateFieldGet(this, _Value_coin, "f") };
    }
    static fromCore(coreValue) {
        return new Value(coreValue.coins, coreValue.assets);
    }
    coin() {
        return __classPrivateFieldGet(this, _Value_coin, "f");
    }
    setCoin(coin) {
        __classPrivateFieldSet(this, _Value_coin, coin, "f");
        __classPrivateFieldSet(this, _Value_originalBytes, undefined, "f");
    }
    multiasset() {
        return __classPrivateFieldGet(this, _Value_multiasset, "f");
    }
    setMultiasset(multiasset) {
        __classPrivateFieldSet(this, _Value_multiasset, multiAssetsToTokenMap(new Map([...tokenMapToMultiAsset(multiasset).entries()].sort(sortCanonically))), "f");
        __classPrivateFieldSet(this, _Value_originalBytes, undefined, "f");
    }
}
_Value_coin = new WeakMap(), _Value_multiasset = new WeakMap(), _Value_originalBytes = new WeakMap();
