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
var _UpdateDelegateRepresentative_drepCredential, _UpdateDelegateRepresentative_anchor, _UpdateDelegateRepresentative_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { Anchor } from '../Common/index.js';
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { hexToBytes } from '../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class UpdateDelegateRepresentative {
    constructor(drepCredential, anchor) {
        _UpdateDelegateRepresentative_drepCredential.set(this, void 0);
        _UpdateDelegateRepresentative_anchor.set(this, void 0);
        _UpdateDelegateRepresentative_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _UpdateDelegateRepresentative_drepCredential, drepCredential, "f");
        __classPrivateFieldSet(this, _UpdateDelegateRepresentative_anchor, anchor, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _UpdateDelegateRepresentative_originalBytes, "f"))
            return __classPrivateFieldGet(this, _UpdateDelegateRepresentative_originalBytes, "f");
        writer.writeStartArray(3);
        writer.writeInt(CertificateKind.UpdateDrep);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _UpdateDelegateRepresentative_drepCredential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _UpdateDelegateRepresentative_drepCredential, "f").hash, 'hex'));
        if (__classPrivateFieldGet(this, _UpdateDelegateRepresentative_anchor, "f")) {
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _UpdateDelegateRepresentative_anchor, "f").toCbor()));
        }
        else {
            writer.writeNull();
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 3)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.UpdateDrep)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.UpdateDrep}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        let anchor;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            anchor = Anchor.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        reader.readEndArray();
        const cert = new UpdateDelegateRepresentative({ hash, type }, anchor);
        __classPrivateFieldSet(cert, _UpdateDelegateRepresentative_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.UpdateDelegateRepresentative,
            anchor: __classPrivateFieldGet(this, _UpdateDelegateRepresentative_anchor, "f") ? __classPrivateFieldGet(this, _UpdateDelegateRepresentative_anchor, "f").toCore() : null,
            dRepCredential: __classPrivateFieldGet(this, _UpdateDelegateRepresentative_drepCredential, "f")
        };
    }
    static fromCore(cert) {
        return new UpdateDelegateRepresentative(cert.dRepCredential, cert.anchor ? Anchor.fromCore(cert.anchor) : undefined);
    }
    credential() {
        return __classPrivateFieldGet(this, _UpdateDelegateRepresentative_drepCredential, "f");
    }
    anchor() {
        return __classPrivateFieldGet(this, _UpdateDelegateRepresentative_anchor, "f");
    }
}
_UpdateDelegateRepresentative_drepCredential = new WeakMap(), _UpdateDelegateRepresentative_anchor = new WeakMap(), _UpdateDelegateRepresentative_originalBytes = new WeakMap();
