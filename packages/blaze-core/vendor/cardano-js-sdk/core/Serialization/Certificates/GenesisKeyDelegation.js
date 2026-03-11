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
var _GenesisKeyDelegation_genesisHash, _GenesisKeyDelegation_genesisDelegateHash, _GenesisKeyDelegation_vrfKeyHash, _GenesisKeyDelegation_originalBytes;
import * as Crypto from '@cardano-sdk/crypto';
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
const EMBEDDED_GROUP_SIZE = 4;
export class GenesisKeyDelegation {
    constructor(genesisHash, genesisDelegateHash, vrfKeyHash) {
        _GenesisKeyDelegation_genesisHash.set(this, void 0);
        _GenesisKeyDelegation_genesisDelegateHash.set(this, void 0);
        _GenesisKeyDelegation_vrfKeyHash.set(this, void 0);
        _GenesisKeyDelegation_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _GenesisKeyDelegation_genesisHash, genesisHash, "f");
        __classPrivateFieldSet(this, _GenesisKeyDelegation_genesisDelegateHash, genesisDelegateHash, "f");
        __classPrivateFieldSet(this, _GenesisKeyDelegation_vrfKeyHash, vrfKeyHash, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _GenesisKeyDelegation_originalBytes, "f"))
            return __classPrivateFieldGet(this, _GenesisKeyDelegation_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(CertificateKind.GenesisKeyDelegation);
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _GenesisKeyDelegation_genesisHash, "f"), 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _GenesisKeyDelegation_genesisDelegateHash, "f"), 'hex'));
        writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _GenesisKeyDelegation_vrfKeyHash, "f"), 'hex'));
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.GenesisKeyDelegation)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.GenesisKeyDelegation}, but got ${kind}`);
        const genesisHash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        const genesisDelegateHash = Crypto.Hash28ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        const vrfKeyHash = Crypto.Hash32ByteBase16(HexBlob.fromBytes(reader.readByteString()));
        reader.readEndArray();
        const cert = new GenesisKeyDelegation(genesisHash, genesisDelegateHash, vrfKeyHash);
        __classPrivateFieldSet(cert, _GenesisKeyDelegation_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.GenesisKeyDelegation,
            genesisDelegateHash: __classPrivateFieldGet(this, _GenesisKeyDelegation_genesisDelegateHash, "f"),
            genesisHash: __classPrivateFieldGet(this, _GenesisKeyDelegation_genesisHash, "f"),
            vrfKeyHash: __classPrivateFieldGet(this, _GenesisKeyDelegation_vrfKeyHash, "f")
        };
    }
    static fromCore(cert) {
        return new GenesisKeyDelegation(cert.genesisHash, cert.genesisDelegateHash, cert.vrfKeyHash);
    }
    genesisHash() {
        return __classPrivateFieldGet(this, _GenesisKeyDelegation_genesisHash, "f");
    }
    setGenesisHash(genesisHash) {
        __classPrivateFieldSet(this, _GenesisKeyDelegation_genesisHash, genesisHash, "f");
        __classPrivateFieldSet(this, _GenesisKeyDelegation_originalBytes, undefined, "f");
    }
    genesisDelegateHash() {
        return __classPrivateFieldGet(this, _GenesisKeyDelegation_genesisDelegateHash, "f");
    }
    setGenesisDelegateHash(genesisDelegateHash) {
        __classPrivateFieldSet(this, _GenesisKeyDelegation_genesisDelegateHash, genesisDelegateHash, "f");
        __classPrivateFieldSet(this, _GenesisKeyDelegation_originalBytes, undefined, "f");
    }
    vrfKeyHash() {
        return __classPrivateFieldGet(this, _GenesisKeyDelegation_vrfKeyHash, "f");
    }
    setVrfKeyHash(vrfKeyHash) {
        __classPrivateFieldSet(this, _GenesisKeyDelegation_vrfKeyHash, vrfKeyHash, "f");
        __classPrivateFieldSet(this, _GenesisKeyDelegation_originalBytes, undefined, "f");
    }
}
_GenesisKeyDelegation_genesisHash = new WeakMap(), _GenesisKeyDelegation_genesisDelegateHash = new WeakMap(), _GenesisKeyDelegation_vrfKeyHash = new WeakMap(), _GenesisKeyDelegation_originalBytes = new WeakMap();
