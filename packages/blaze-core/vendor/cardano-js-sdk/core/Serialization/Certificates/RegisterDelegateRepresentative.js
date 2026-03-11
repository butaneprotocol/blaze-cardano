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
var _RegisterDelegateRepresentative_drepCredential, _RegisterDelegateRepresentative_deposit, _RegisterDelegateRepresentative_anchor, _RegisterDelegateRepresentative_originalBytes;
import * as Crypto from "../../../deps/crypto.js";
import { Anchor } from '../Common/index.js';
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from "../../../deps/util.js";
import { hexToBytes } from '../../util/misc/index.js';
const EMBEDDED_GROUP_SIZE = 2;
export class RegisterDelegateRepresentative {
    constructor(drepCredential, deposit, anchor) {
        _RegisterDelegateRepresentative_drepCredential.set(this, void 0);
        _RegisterDelegateRepresentative_deposit.set(this, void 0);
        _RegisterDelegateRepresentative_anchor.set(this, void 0);
        _RegisterDelegateRepresentative_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _RegisterDelegateRepresentative_drepCredential, drepCredential, "f");
        __classPrivateFieldSet(this, _RegisterDelegateRepresentative_deposit, deposit, "f");
        __classPrivateFieldSet(this, _RegisterDelegateRepresentative_anchor, anchor, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _RegisterDelegateRepresentative_originalBytes, "f"))
            return __classPrivateFieldGet(this, _RegisterDelegateRepresentative_originalBytes, "f");
        writer.writeStartArray(4);
        writer.writeInt(CertificateKind.DrepRegistration);
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(__classPrivateFieldGet(this, _RegisterDelegateRepresentative_drepCredential, "f").type);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _RegisterDelegateRepresentative_drepCredential, "f").hash, 'hex'));
        writer.writeInt(__classPrivateFieldGet(this, _RegisterDelegateRepresentative_deposit, "f"));
        if (__classPrivateFieldGet(this, _RegisterDelegateRepresentative_anchor, "f")) {
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _RegisterDelegateRepresentative_anchor, "f").toCbor()));
        }
        else {
            writer.writeNull();
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== 4)
            throw new InvalidArgumentError('cbor', `Expected an array of 4 elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.DrepRegistration)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.DrepRegistration}, but got ${kind}`);
        const credLength = reader.readStartArray();
        if (credLength !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const type = Number(reader.readInt());
        const hash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const deposit = reader.readInt();
        let anchor;
        if (reader.peekState() === CborReaderState.Null) {
            reader.readNull();
        }
        else {
            anchor = Anchor.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()));
        }
        reader.readEndArray();
        const cert = new RegisterDelegateRepresentative({ hash, type }, deposit, anchor);
        __classPrivateFieldSet(cert, _RegisterDelegateRepresentative_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.RegisterDelegateRepresentative,
            anchor: __classPrivateFieldGet(this, _RegisterDelegateRepresentative_anchor, "f") ? __classPrivateFieldGet(this, _RegisterDelegateRepresentative_anchor, "f").toCore() : null,
            dRepCredential: __classPrivateFieldGet(this, _RegisterDelegateRepresentative_drepCredential, "f"),
            deposit: __classPrivateFieldGet(this, _RegisterDelegateRepresentative_deposit, "f")
        };
    }
    static fromCore(cert) {
        return new RegisterDelegateRepresentative(cert.dRepCredential, cert.deposit, cert.anchor ? Anchor.fromCore(cert.anchor) : undefined);
    }
    credential() {
        return __classPrivateFieldGet(this, _RegisterDelegateRepresentative_drepCredential, "f");
    }
    deposit() {
        return __classPrivateFieldGet(this, _RegisterDelegateRepresentative_deposit, "f");
    }
    anchor() {
        return __classPrivateFieldGet(this, _RegisterDelegateRepresentative_anchor, "f");
    }
}
_RegisterDelegateRepresentative_drepCredential = new WeakMap(), _RegisterDelegateRepresentative_deposit = new WeakMap(), _RegisterDelegateRepresentative_anchor = new WeakMap(), _RegisterDelegateRepresentative_originalBytes = new WeakMap();
