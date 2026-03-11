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
var _AuxiliaryData_instances, _a, _AuxiliaryData_metadata, _AuxiliaryData_nativeScripts, _AuxiliaryData_plutusV1Scripts, _AuxiliaryData_plutusV2Scripts, _AuxiliaryData_plutusV3Scripts, _AuxiliaryData_originalBytes, _AuxiliaryData_getMapSize, _AuxiliaryData_getCoreScripts, _AuxiliaryData_getCddlScripts;
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { GeneralTransactionMetadata } from './TransactionMetadata/GeneralTransactionMetadata.js';
import { HexBlob, InvalidArgumentError } from '@cardano-sdk/util';
import { NativeScript, PlutusV1Script, PlutusV2Script, PlutusV3Script } from '../Scripts/index.js';
import { PlutusLanguageVersion, ScriptType } from '../../Cardano/types/Script.js';
import { SerializationError, SerializationFailure } from '../../errors.js';
import { hexToBytes } from '../../util/misc/index.js';
export const SHELLEY_ERA_FIELDS_COUNT = 2;
export const ALONZO_AUX_TAG = 259;
export class AuxiliaryData {
    constructor() {
        _AuxiliaryData_instances.add(this);
        _AuxiliaryData_metadata.set(this, void 0);
        _AuxiliaryData_nativeScripts.set(this, void 0);
        _AuxiliaryData_plutusV1Scripts.set(this, void 0);
        _AuxiliaryData_plutusV2Scripts.set(this, void 0);
        _AuxiliaryData_plutusV3Scripts.set(this, void 0);
        _AuxiliaryData_originalBytes.set(this, undefined);
    }
    toCbor() {
        if (__classPrivateFieldGet(this, _AuxiliaryData_originalBytes, "f"))
            return __classPrivateFieldGet(this, _AuxiliaryData_originalBytes, "f");
        const writer = new CborWriter();
        const elementsSize = __classPrivateFieldGet(this, _AuxiliaryData_instances, "m", _AuxiliaryData_getMapSize).call(this);
        if (elementsSize === 1 && __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").metadata().size > 0) {
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").toCbor()));
        }
        else if (elementsSize === SHELLEY_ERA_FIELDS_COUNT &&
            __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f") !== undefined &&
            __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").metadata().size > 0 &&
            __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f") !== undefined &&
            __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f").length > 0) {
            writer.writeStartArray(elementsSize);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").toCbor()));
            writer.writeStartArray(__classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f").length);
            for (const script of __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f")) {
                writer.writeEncodedValue(hexToBytes(script.toCbor()));
            }
        }
        else {
            writer.writeTag(ALONZO_AUX_TAG);
            writer.writeStartMap(elementsSize);
            if (__classPrivateFieldGet(this, _AuxiliaryData_metadata, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").metadata().size > 0) {
                writer.writeInt(0n);
                writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").toCbor()));
            }
            if (__classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f").length > 0) {
                writer.writeInt(1n);
                writer.writeStartArray(__classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f").length);
                for (const script of __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f")) {
                    writer.writeEncodedValue(hexToBytes(script.toCbor()));
                }
            }
            if (__classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f").length > 0) {
                writer.writeInt(2n);
                writer.writeStartArray(__classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f").length);
                for (const script of __classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f")) {
                    writer.writeEncodedValue(hexToBytes(script.toCbor()));
                }
            }
            if (__classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f").length > 0) {
                writer.writeInt(3n);
                writer.writeStartArray(__classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f").length);
                for (const script of __classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f")) {
                    writer.writeEncodedValue(hexToBytes(script.toCbor()));
                }
            }
            if (__classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f").length > 0) {
                writer.writeInt(4n);
                writer.writeStartArray(__classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f").length);
                for (const script of __classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f")) {
                    writer.writeEncodedValue(hexToBytes(script.toCbor()));
                }
            }
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const auxData = new AuxiliaryData();
        const peekState = reader.peekState();
        if (peekState === CborReaderState.StartMap) {
            __classPrivateFieldSet(auxData, _AuxiliaryData_metadata, GeneralTransactionMetadata.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
        }
        else if (peekState === CborReaderState.Tag) {
            const tag = reader.readTag();
            if (tag !== ALONZO_AUX_TAG) {
                throw new InvalidArgumentError('cbor', `Expected tag '${ALONZO_AUX_TAG}', but got ${tag}.`);
            }
            reader.readStartMap();
            while (reader.peekState() !== CborReaderState.EndMap) {
                const key = reader.readInt();
                switch (key) {
                    case 0n:
                        __classPrivateFieldSet(auxData, _AuxiliaryData_metadata, GeneralTransactionMetadata.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                        break;
                    case 1n:
                        auxData.setNativeScripts(new Array());
                        reader.readStartArray();
                        while (reader.peekState() !== CborReaderState.EndArray) {
                            auxData.nativeScripts().push(NativeScript.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                        }
                        reader.readEndArray();
                        break;
                    case 2n: {
                        auxData.setPlutusV1Scripts(new Array());
                        reader.readStartArray();
                        while (reader.peekState() !== CborReaderState.EndArray) {
                            auxData.plutusV1Scripts().push(PlutusV1Script.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                        }
                        reader.readEndArray();
                        break;
                    }
                    case 3n: {
                        auxData.setPlutusV2Scripts(new Array());
                        reader.readStartArray();
                        while (reader.peekState() !== CborReaderState.EndArray) {
                            auxData.plutusV2Scripts().push(PlutusV2Script.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                        }
                        reader.readEndArray();
                        break;
                    }
                    case 4n: {
                        auxData.setPlutusV3Scripts(new Array());
                        reader.readStartArray();
                        while (reader.peekState() !== CborReaderState.EndArray) {
                            auxData.plutusV3Scripts().push(PlutusV3Script.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                        }
                        reader.readEndArray();
                        break;
                    }
                }
            }
            reader.readEndMap();
        }
        else {
            reader.readStartArray();
            __classPrivateFieldSet(auxData, _AuxiliaryData_metadata, GeneralTransactionMetadata.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
            auxData.setNativeScripts(new Array());
            reader.readStartArray();
            while (reader.peekState() !== CborReaderState.EndArray) {
                auxData.nativeScripts().push(NativeScript.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
            }
            reader.readEndArray();
        }
        __classPrivateFieldSet(auxData, _AuxiliaryData_originalBytes, cbor, "f");
        return auxData;
    }
    toCore() {
        const scripts = __classPrivateFieldGet(this, _AuxiliaryData_instances, "m", _AuxiliaryData_getCoreScripts).call(this);
        const auxiliaryData = {
            blob: __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f") ? __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").toCore() : undefined
        };
        if (scripts.length > 0)
            auxiliaryData.scripts = scripts;
        return auxiliaryData;
    }
    static fromCore(auxData) {
        const result = new AuxiliaryData();
        if (auxData.blob) {
            result.setMetadata(GeneralTransactionMetadata.fromCore(auxData.blob));
        }
        if (auxData.scripts) {
            const scripts = __classPrivateFieldGet(AuxiliaryData, _a, "m", _AuxiliaryData_getCddlScripts).call(AuxiliaryData, auxData.scripts);
            if (scripts.native)
                result.setNativeScripts(scripts.native);
            if (scripts.plutusV1)
                result.setPlutusV1Scripts(scripts.plutusV1);
            if (scripts.plutusV2)
                result.setPlutusV2Scripts(scripts.plutusV2);
            if (scripts.plutusV3)
                result.setPlutusV3Scripts(scripts.plutusV3);
        }
        return result;
    }
    metadata() {
        return __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f");
    }
    setMetadata(metadata) {
        __classPrivateFieldSet(this, _AuxiliaryData_metadata, metadata, "f");
        __classPrivateFieldSet(this, _AuxiliaryData_originalBytes, undefined, "f");
    }
    nativeScripts() {
        return __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f");
    }
    setNativeScripts(nativeScripts) {
        __classPrivateFieldSet(this, _AuxiliaryData_nativeScripts, nativeScripts, "f");
        __classPrivateFieldSet(this, _AuxiliaryData_originalBytes, undefined, "f");
    }
    plutusV1Scripts() {
        return __classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f");
    }
    setPlutusV1Scripts(plutusV1Scripts) {
        __classPrivateFieldSet(this, _AuxiliaryData_plutusV1Scripts, plutusV1Scripts, "f");
        __classPrivateFieldSet(this, _AuxiliaryData_originalBytes, undefined, "f");
    }
    plutusV2Scripts() {
        return __classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f");
    }
    setPlutusV2Scripts(plutusV2Scripts) {
        __classPrivateFieldSet(this, _AuxiliaryData_plutusV2Scripts, plutusV2Scripts, "f");
        __classPrivateFieldSet(this, _AuxiliaryData_originalBytes, undefined, "f");
    }
    plutusV3Scripts() {
        return __classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f");
    }
    setPlutusV3Scripts(plutusV3Scripts) {
        __classPrivateFieldSet(this, _AuxiliaryData_plutusV3Scripts, plutusV3Scripts, "f");
        __classPrivateFieldSet(this, _AuxiliaryData_originalBytes, undefined, "f");
    }
}
_a = AuxiliaryData, _AuxiliaryData_metadata = new WeakMap(), _AuxiliaryData_nativeScripts = new WeakMap(), _AuxiliaryData_plutusV1Scripts = new WeakMap(), _AuxiliaryData_plutusV2Scripts = new WeakMap(), _AuxiliaryData_plutusV3Scripts = new WeakMap(), _AuxiliaryData_originalBytes = new WeakMap(), _AuxiliaryData_instances = new WeakSet(), _AuxiliaryData_getMapSize = function _AuxiliaryData_getMapSize() {
    let mapSize = 0;
    if (__classPrivateFieldGet(this, _AuxiliaryData_metadata, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_metadata, "f").metadata().size > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f").length > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f").length > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f").length > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f") !== undefined && __classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f").length > 0)
        ++mapSize;
    return mapSize;
}, _AuxiliaryData_getCoreScripts = function _AuxiliaryData_getCoreScripts() {
    const plutusV1 = __classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f") ? __classPrivateFieldGet(this, _AuxiliaryData_plutusV1Scripts, "f").map((script) => script.toCore()) : [];
    const plutusV2 = __classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f") ? __classPrivateFieldGet(this, _AuxiliaryData_plutusV2Scripts, "f").map((script) => script.toCore()) : [];
    const plutusV3 = __classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f") ? __classPrivateFieldGet(this, _AuxiliaryData_plutusV3Scripts, "f").map((script) => script.toCore()) : [];
    const native = __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f") ? __classPrivateFieldGet(this, _AuxiliaryData_nativeScripts, "f").map((script) => script.toCore()) : [];
    return [...plutusV1, ...plutusV2, ...plutusV3, ...native];
}, _AuxiliaryData_getCddlScripts = function _AuxiliaryData_getCddlScripts(scripts) {
    const result = { native: undefined, plutusV1: undefined, plutusV2: undefined, plutusV3: undefined };
    for (const script of scripts) {
        switch (script.__type) {
            case ScriptType.Native:
                if (!result.native)
                    result.native = new Array();
                result.native.push(NativeScript.fromCore(script));
                break;
            case ScriptType.Plutus:
                if (script.version === PlutusLanguageVersion.V1) {
                    if (!result.plutusV1)
                        result.plutusV1 = new Array();
                    result.plutusV1.push(PlutusV1Script.fromCore(script));
                }
                else if (script.version === PlutusLanguageVersion.V2) {
                    if (!result.plutusV2)
                        result.plutusV2 = new Array();
                    result.plutusV2.push(PlutusV2Script.fromCore(script));
                }
                else if (script.version === PlutusLanguageVersion.V3) {
                    if (!result.plutusV3)
                        result.plutusV3 = new Array();
                    result.plutusV3.push(PlutusV3Script.fromCore(script));
                }
                break;
            default:
                throw new SerializationError(SerializationFailure.InvalidScriptType, `Script '${script}' is not supported.`);
        }
    }
    return result;
};
