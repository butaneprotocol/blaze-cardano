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
var _ByronAddress_type, _ByronAddress_content;
import { Address, AddressType } from './Address.js';
import { CborReader, CborReaderState, CborTag, CborWriter } from '../../Serialization/index.js';
import { Hash28ByteBase16 } from "../../../deps/crypto.js";
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { crc32 } from '@foxglove/crc';
export var ByronAddressType;
(function (ByronAddressType) {
    ByronAddressType[ByronAddressType["PubKey"] = 0] = "PubKey";
    ByronAddressType[ByronAddressType["Script"] = 1] = "Script";
    ByronAddressType[ByronAddressType["Redeem"] = 2] = "Redeem";
})(ByronAddressType || (ByronAddressType = {}));
export class ByronAddress {
    constructor(props) {
        _ByronAddress_type.set(this, void 0);
        _ByronAddress_content.set(this, void 0);
        __classPrivateFieldSet(this, _ByronAddress_content, props.byronAddressContent, "f");
        __classPrivateFieldSet(this, _ByronAddress_type, props.type, "f");
    }
    static fromCredentials(root, attrs, type) {
        return new ByronAddress({
            byronAddressContent: {
                attrs,
                root,
                type
            },
            type: AddressType.Byron
        });
    }
    getAttributes() {
        return __classPrivateFieldGet(this, _ByronAddress_content, "f").attrs;
    }
    getRoot() {
        return __classPrivateFieldGet(this, _ByronAddress_content, "f").root;
    }
    getByronAddressType() {
        return __classPrivateFieldGet(this, _ByronAddress_content, "f").type;
    }
    toAddress() {
        return new Address({
            byronAddressContent: __classPrivateFieldGet(this, _ByronAddress_content, "f"),
            type: __classPrivateFieldGet(this, _ByronAddress_type, "f")
        });
    }
    static fromAddress(addr) {
        return addr.getProps().type === AddressType.Byron ? new ByronAddress(addr.getProps()) : undefined;
    }
    static packParts(props) {
        const { root, attrs, type } = props.byronAddressContent;
        let mapSize = 0;
        if (attrs.derivationPath)
            ++mapSize;
        if (attrs.magic)
            ++mapSize;
        const writer = new CborWriter();
        writer.writeStartArray(3);
        writer.writeByteString(Buffer.from(root, 'hex'));
        writer.writeStartMap(mapSize);
        if (attrs.derivationPath) {
            const encodedPathCbor = new CborWriter().writeByteString(Buffer.from(attrs.derivationPath, 'hex')).encode();
            writer.writeInt(1);
            writer.writeByteString(encodedPathCbor);
        }
        if (attrs.magic) {
            const encodedMagicCbor = new CborWriter().writeInt(attrs.magic).encode();
            writer.writeInt(2);
            writer.writeByteString(encodedMagicCbor);
        }
        writer.writeInt(type);
        const addressDataEncoded = Buffer.from(writer.encodeAsHex(), 'hex');
        writer.reset();
        writer.writeStartArray(2);
        writer.writeTag(CborTag.EncodedCborDataItem);
        writer.writeByteString(addressDataEncoded);
        writer.writeInt(crc32(addressDataEncoded));
        return writer.encode();
    }
    static unpackParts(type, data) {
        let reader = new CborReader(HexBlob.fromBytes(data));
        reader.readStartArray();
        reader.readTag();
        const addressDataEncoded = reader.readByteString();
        if (Number(reader.readInt()) !== crc32(addressDataEncoded))
            throw new InvalidArgumentError('data', 'Invalid Byron raw data. Checksum doesnt match.');
        reader = new CborReader(HexBlob.fromBytes(addressDataEncoded));
        reader.readStartArray();
        const root = Hash28ByteBase16(Buffer.from(reader.readByteString()).toString('hex'));
        reader.readStartMap();
        let magic;
        let derivationPath;
        while (reader.peekState() !== CborReaderState.EndMap) {
            const key = reader.readInt();
            switch (key) {
                case 1n: {
                    const cborBytes = reader.readByteString();
                    derivationPath = HexBlob.fromBytes(new CborReader(HexBlob.fromBytes(cborBytes)).readByteString());
                    break;
                }
                case 2n: {
                    const cborBytes = reader.readByteString();
                    magic = Number(new CborReader(HexBlob.fromBytes(cborBytes)).readInt());
                    break;
                }
            }
        }
        reader.readEndMap();
        const byronAddressType = Number(reader.readInt());
        return new Address({
            byronAddressContent: {
                attrs: { derivationPath, magic },
                root,
                type: byronAddressType
            },
            type
        });
    }
}
_ByronAddress_type = new WeakMap(), _ByronAddress_content = new WeakMap();
