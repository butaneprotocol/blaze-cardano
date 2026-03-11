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
var _PoolRegistration_params, _PoolRegistration_originalBytes;
import { CborReader, CborWriter } from '../CBOR/index.js';
import { CertificateKind } from './CertificateKind.js';
import { CertificateType } from '../../Cardano/types/Certificate.js';
import { InvalidArgumentError } from '@cardano-sdk/util';
import { PoolParams } from './PoolParams/index.js';
const EMBEDDED_GROUP_SIZE = PoolParams.subgroupCount + 1;
export class PoolRegistration {
    constructor(params) {
        _PoolRegistration_params.set(this, void 0);
        _PoolRegistration_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _PoolRegistration_params, params, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _PoolRegistration_originalBytes, "f"))
            return __classPrivateFieldGet(this, _PoolRegistration_originalBytes, "f");
        writer.writeStartArray(EMBEDDED_GROUP_SIZE);
        writer.writeInt(CertificateKind.PoolRegistration);
        return __classPrivateFieldGet(this, _PoolRegistration_params, "f").toFlattenedCbor(writer);
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const length = reader.readStartArray();
        if (length !== EMBEDDED_GROUP_SIZE)
            throw new InvalidArgumentError('cbor', `Expected an array of ${EMBEDDED_GROUP_SIZE} elements, but got an array of ${length} elements`);
        const kind = Number(reader.readInt());
        if (kind !== CertificateKind.PoolRegistration)
            throw new InvalidArgumentError('cbor', `Expected certificate kind ${CertificateKind.PoolRegistration}, but got ${kind}`);
        const params = PoolParams.fromFlattenedCbor(reader);
        reader.readEndArray();
        const cert = new PoolRegistration(params);
        __classPrivateFieldSet(cert, _PoolRegistration_originalBytes, cbor, "f");
        return cert;
    }
    toCore() {
        return {
            __typename: CertificateType.PoolRegistration,
            poolParameters: __classPrivateFieldGet(this, _PoolRegistration_params, "f").toCore()
        };
    }
    static fromCore(cert) {
        return new PoolRegistration(PoolParams.fromCore(cert.poolParameters));
    }
    poolParameters() {
        return __classPrivateFieldGet(this, _PoolRegistration_params, "f");
    }
    setPoolParameters(parameters) {
        __classPrivateFieldSet(this, _PoolRegistration_params, parameters, "f");
        __classPrivateFieldSet(this, _PoolRegistration_originalBytes, undefined, "f");
    }
}
_PoolRegistration_params = new WeakMap(), _PoolRegistration_originalBytes = new WeakMap();
