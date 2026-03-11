var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _TransactionWitnessSet_instances, _a, _TransactionWitnessSet_vkeywitnesses, _TransactionWitnessSet_nativeScripts, _TransactionWitnessSet_bootstrapWitnesses, _TransactionWitnessSet_plutusV1Scripts, _TransactionWitnessSet_plutusData, _TransactionWitnessSet_redeemers, _TransactionWitnessSet_plutusV2Scripts, _TransactionWitnessSet_plutusV3Scripts, _TransactionWitnessSet_originalBytes, _TransactionWitnessSet_getCoreScripts, _TransactionWitnessSet_getCddlScripts, _TransactionWitnessSet_getMapSize;
import { BootstrapWitness } from './BootstrapWitness.js';
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { CborSet } from '../Common/index.js';
import { HexBlob } from "../../../deps/util.js";
import { NativeScript, PlutusV1Script, PlutusV2Script, PlutusV3Script } from '../Scripts/index.js';
import { PlutusData } from '../PlutusData/PlutusData.js';
import { PlutusLanguageVersion, ScriptType } from '../../Cardano/types/Script.js';
import { Redeemers } from './Redeemer/index.js';
import { SerializationError, SerializationFailure } from '../../errors.js';
import { VkeyWitness } from './VkeyWitness.js';
import { hexToBytes } from '../../util/misc/index.js';
import uniqWith from 'lodash/uniqWith.js';
export class TransactionWitnessSet {
    constructor() {
        _TransactionWitnessSet_instances.add(this);
        _TransactionWitnessSet_vkeywitnesses.set(this, void 0);
        _TransactionWitnessSet_nativeScripts.set(this, void 0);
        _TransactionWitnessSet_bootstrapWitnesses.set(this, void 0);
        _TransactionWitnessSet_plutusV1Scripts.set(this, void 0);
        _TransactionWitnessSet_plutusData.set(this, void 0);
        _TransactionWitnessSet_redeemers.set(this, void 0);
        _TransactionWitnessSet_plutusV2Scripts.set(this, void 0);
        _TransactionWitnessSet_plutusV3Scripts.set(this, void 0);
        _TransactionWitnessSet_originalBytes.set(this, undefined);
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TransactionWitnessSet_originalBytes, "f");
        writer.writeStartMap(__classPrivateFieldGet(this, _TransactionWitnessSet_instances, "m", _TransactionWitnessSet_getMapSize).call(this));
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f").size() > 0) {
            __classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f").setValues(uniqWith(__classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f").values(), (lhs, rhs) => lhs.vkey() === rhs.vkey()));
            writer.writeInt(0n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f").size() > 0) {
            writer.writeInt(1n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f").size() > 0) {
            __classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f").setValues(uniqWith(__classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f").values(), (lhs, rhs) => lhs.vkey() === rhs.vkey()));
            writer.writeInt(2n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f").size() > 0) {
            writer.writeInt(3n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f").size() > 0) {
            writer.writeInt(4n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f").size() > 0) {
            writer.writeInt(5n);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f").toCbor()));
        }
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f").size() > 0) {
            writer.writeInt(6n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f").size() > 0) {
            writer.writeInt(7n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f").toCbor(), 'hex'));
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const witness = new TransactionWitnessSet();
        reader.readStartMap();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const key = reader.readInt();
            switch (key) {
                case 0n:
                    witness.setVkeys(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), VkeyWitness.fromCbor));
                    break;
                case 1n:
                    witness.setNativeScripts(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), NativeScript.fromCbor));
                    break;
                case 2n:
                    witness.setBootstraps(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), BootstrapWitness.fromCbor));
                    break;
                case 3n:
                    witness.setPlutusV1Scripts(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), PlutusV1Script.fromCbor));
                    break;
                case 4n:
                    witness.setPlutusData(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), PlutusData.fromCbor));
                    break;
                case 5n: {
                    witness.setRedeemers(Redeemers.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                    break;
                }
                case 6n:
                    witness.setPlutusV2Scripts(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), PlutusV2Script.fromCbor));
                    break;
                case 7n:
                    witness.setPlutusV3Scripts(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), PlutusV3Script.fromCbor));
                    break;
            }
        }
        reader.readEndMap();
        __classPrivateFieldSet(witness, _TransactionWitnessSet_originalBytes, cbor, "f");
        return witness;
    }
    toCore() {
        const scripts = __classPrivateFieldGet(this, _TransactionWitnessSet_instances, "m", _TransactionWitnessSet_getCoreScripts).call(this);
        return {
            bootstrap: __classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f") ? __classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f").toCore() : undefined,
            datums: __classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f") ? __classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f").toCore() : undefined,
            redeemers: __classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f")?.size() ? __classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f").toCore() : undefined,
            scripts: scripts.length > 0 ? scripts : undefined,
            signatures: __classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f") ? new Map(__classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f").toCore()) : new Map()
        };
    }
    static fromCore(coreWitness) {
        const witness = new TransactionWitnessSet();
        if (coreWitness.signatures) {
            witness.setVkeys(CborSet.fromCore([...coreWitness.signatures], VkeyWitness.fromCore));
        }
        if (coreWitness.scripts) {
            const scripts = __classPrivateFieldGet(TransactionWitnessSet, _a, "m", _TransactionWitnessSet_getCddlScripts).call(TransactionWitnessSet, coreWitness.scripts);
            if (scripts.native)
                witness.setNativeScripts(scripts.native);
            if (scripts.plutusV1)
                witness.setPlutusV1Scripts(scripts.plutusV1);
            if (scripts.plutusV2)
                witness.setPlutusV2Scripts(scripts.plutusV2);
            if (scripts.plutusV3)
                witness.setPlutusV3Scripts(scripts.plutusV3);
        }
        if (coreWitness.redeemers) {
            witness.setRedeemers(Redeemers.fromCore(coreWitness.redeemers));
        }
        if (coreWitness.datums) {
            witness.setPlutusData(CborSet.fromCore(coreWitness.datums, PlutusData.fromCore));
        }
        if (coreWitness.bootstrap) {
            witness.setBootstraps(CborSet.fromCore(coreWitness.bootstrap, BootstrapWitness.fromCore));
        }
        return witness;
    }
    setVkeys(vkeys) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_vkeywitnesses, vkeys, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    vkeys() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f");
    }
    setNativeScripts(nativeScripts) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_nativeScripts, nativeScripts, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    nativeScripts() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f");
    }
    setBootstraps(bootstraps) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_bootstrapWitnesses, bootstraps, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    bootstraps() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f");
    }
    setPlutusV1Scripts(plutusV1Scripts) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_plutusV1Scripts, plutusV1Scripts, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    plutusV1Scripts() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f");
    }
    setPlutusData(plutusData) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_plutusData, plutusData, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    plutusData() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f");
    }
    setRedeemers(redeemers) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_redeemers, redeemers, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    redeemers() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f");
    }
    setPlutusV2Scripts(plutusV2Scripts) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_plutusV2Scripts, plutusV2Scripts, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    plutusV2Scripts() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f");
    }
    setPlutusV3Scripts(plutusV3Scripts) {
        __classPrivateFieldSet(this, _TransactionWitnessSet_plutusV3Scripts, plutusV3Scripts, "f");
        __classPrivateFieldSet(this, _TransactionWitnessSet_originalBytes, undefined, "f");
    }
    plutusV3Scripts() {
        return __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f");
    }
}
_a = TransactionWitnessSet, _TransactionWitnessSet_vkeywitnesses = new WeakMap(), _TransactionWitnessSet_nativeScripts = new WeakMap(), _TransactionWitnessSet_bootstrapWitnesses = new WeakMap(), _TransactionWitnessSet_plutusV1Scripts = new WeakMap(), _TransactionWitnessSet_plutusData = new WeakMap(), _TransactionWitnessSet_redeemers = new WeakMap(), _TransactionWitnessSet_plutusV2Scripts = new WeakMap(), _TransactionWitnessSet_plutusV3Scripts = new WeakMap(), _TransactionWitnessSet_originalBytes = new WeakMap(), _TransactionWitnessSet_instances = new WeakSet(), _TransactionWitnessSet_getCoreScripts = function _TransactionWitnessSet_getCoreScripts() {
    const plutusV1 = __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f") ? __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f").toCore() : [];
    const plutusV2 = __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f") ? __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f").toCore() : [];
    const plutusV3 = __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f") ? __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f").toCore() : [];
    const native = __classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f") ? __classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f").toCore() : [];
    return [...plutusV1, ...plutusV2, ...plutusV3, ...native];
}, _TransactionWitnessSet_getCddlScripts = function _TransactionWitnessSet_getCddlScripts(scripts) {
    const [coreNative, coreV1, coreV2, coreV3] = scripts.reduce(([native, v1, v2, v3], script) => {
        if (script.__type === ScriptType.Native) {
            native ? native.push(script) : (native = [script]);
        }
        else {
            switch (script.version) {
                case PlutusLanguageVersion.V1:
                    v1 ? v1.push(script) : (v1 = [script]);
                    break;
                case PlutusLanguageVersion.V2:
                    v2 ? v2.push(script) : (v2 = [script]);
                    break;
                case PlutusLanguageVersion.V3:
                    v3 ? v3.push(script) : (v3 = [script]);
                    break;
                default:
                    throw new SerializationError(SerializationFailure.InvalidScriptType, `Script '${script}' is not supported.`);
            }
        }
        return [native, v1, v2, v3];
    }, [null, null, null, null]);
    return {
        ...(coreNative && { native: CborSet.fromCore(coreNative, NativeScript.fromCore) }),
        ...(coreV1 && { plutusV1: CborSet.fromCore(coreV1, PlutusV1Script.fromCore) }),
        ...(coreV2 && { plutusV2: CborSet.fromCore(coreV2, PlutusV2Script.fromCore) }),
        ...(coreV3 && { plutusV3: CborSet.fromCore(coreV3, PlutusV3Script.fromCore) })
    };
}, _TransactionWitnessSet_getMapSize = function _TransactionWitnessSet_getMapSize() {
    let mapSize = 0;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_vkeywitnesses, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_nativeScripts, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_bootstrapWitnesses, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV1Scripts, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusData, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_redeemers, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV2Scripts, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f") !== undefined && __classPrivateFieldGet(this, _TransactionWitnessSet_plutusV3Scripts, "f").size() > 0)
        ++mapSize;
    return mapSize;
};
