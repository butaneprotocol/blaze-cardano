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
var _ProtocolParamUpdate_instances, _ProtocolParamUpdate_minFeeA, _ProtocolParamUpdate_minFeeB, _ProtocolParamUpdate_maxBlockBodySize, _ProtocolParamUpdate_maxTxSize, _ProtocolParamUpdate_maxBlockHeaderSize, _ProtocolParamUpdate_keyDeposit, _ProtocolParamUpdate_poolDeposit, _ProtocolParamUpdate_maxEpoch, _ProtocolParamUpdate_nOpt, _ProtocolParamUpdate_poolPledgeInfluence, _ProtocolParamUpdate_expansionRate, _ProtocolParamUpdate_treasuryGrowthRate, _ProtocolParamUpdate_d, _ProtocolParamUpdate_extraEntropy, _ProtocolParamUpdate_protocolVersion, _ProtocolParamUpdate_minPoolCost, _ProtocolParamUpdate_adaPerUtxoByte, _ProtocolParamUpdate_costModels, _ProtocolParamUpdate_executionCosts, _ProtocolParamUpdate_maxTxExUnits, _ProtocolParamUpdate_maxBlockExUnits, _ProtocolParamUpdate_maxValueSize, _ProtocolParamUpdate_collateralPercentage, _ProtocolParamUpdate_maxCollateralInputs, _ProtocolParamUpdate_poolVotingThresholds, _ProtocolParamUpdate_drepVotingThresholds, _ProtocolParamUpdate_minCommitteeSize, _ProtocolParamUpdate_committeeTermLimit, _ProtocolParamUpdate_governanceActionValidityPeriod, _ProtocolParamUpdate_governanceActionDeposit, _ProtocolParamUpdate_drepDeposit, _ProtocolParamUpdate_drepInactivityPeriod, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, _ProtocolParamUpdate_originalBytes, _ProtocolParamUpdate_getMapSize;
import { CborReader, CborReaderState, CborWriter } from '../CBOR/index.js';
import { Costmdls } from './Costmdls/index.js';
import { DrepVotingThresholds } from './DrepVotingThresholds.js';
import { EpochNo } from '../../Cardano/types/Block.js';
import { ExUnitPrices } from './ExUnitPrices.js';
import { ExUnits, ProtocolVersion, UnitInterval } from '../Common/index.js';
import { HexBlob } from '@cardano-sdk/util';
import { PoolVotingThresholds } from './PoolVotingThresholds.js';
export class ProtocolParamUpdate {
    constructor() {
        _ProtocolParamUpdate_instances.add(this);
        _ProtocolParamUpdate_minFeeA.set(this, void 0);
        _ProtocolParamUpdate_minFeeB.set(this, void 0);
        _ProtocolParamUpdate_maxBlockBodySize.set(this, void 0);
        _ProtocolParamUpdate_maxTxSize.set(this, void 0);
        _ProtocolParamUpdate_maxBlockHeaderSize.set(this, void 0);
        _ProtocolParamUpdate_keyDeposit.set(this, void 0);
        _ProtocolParamUpdate_poolDeposit.set(this, void 0);
        _ProtocolParamUpdate_maxEpoch.set(this, void 0);
        _ProtocolParamUpdate_nOpt.set(this, void 0);
        _ProtocolParamUpdate_poolPledgeInfluence.set(this, void 0);
        _ProtocolParamUpdate_expansionRate.set(this, void 0);
        _ProtocolParamUpdate_treasuryGrowthRate.set(this, void 0);
        _ProtocolParamUpdate_d.set(this, void 0);
        _ProtocolParamUpdate_extraEntropy.set(this, void 0);
        _ProtocolParamUpdate_protocolVersion.set(this, void 0);
        _ProtocolParamUpdate_minPoolCost.set(this, void 0);
        _ProtocolParamUpdate_adaPerUtxoByte.set(this, void 0);
        _ProtocolParamUpdate_costModels.set(this, void 0);
        _ProtocolParamUpdate_executionCosts.set(this, void 0);
        _ProtocolParamUpdate_maxTxExUnits.set(this, void 0);
        _ProtocolParamUpdate_maxBlockExUnits.set(this, void 0);
        _ProtocolParamUpdate_maxValueSize.set(this, void 0);
        _ProtocolParamUpdate_collateralPercentage.set(this, void 0);
        _ProtocolParamUpdate_maxCollateralInputs.set(this, void 0);
        _ProtocolParamUpdate_poolVotingThresholds.set(this, void 0);
        _ProtocolParamUpdate_drepVotingThresholds.set(this, void 0);
        _ProtocolParamUpdate_minCommitteeSize.set(this, void 0);
        _ProtocolParamUpdate_committeeTermLimit.set(this, void 0);
        _ProtocolParamUpdate_governanceActionValidityPeriod.set(this, void 0);
        _ProtocolParamUpdate_governanceActionDeposit.set(this, void 0);
        _ProtocolParamUpdate_drepDeposit.set(this, void 0);
        _ProtocolParamUpdate_drepInactivityPeriod.set(this, void 0);
        _ProtocolParamUpdate_minFeeRefScriptCostPerByte.set(this, void 0);
        _ProtocolParamUpdate_originalBytes.set(this, undefined);
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_originalBytes, "f"))
            return __classPrivateFieldGet(this, _ProtocolParamUpdate_originalBytes, "f");
        writer.writeStartMap(__classPrivateFieldGet(this, _ProtocolParamUpdate_instances, "m", _ProtocolParamUpdate_getMapSize).call(this));
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeA, "f") !== undefined) {
            writer.writeInt(0n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeA, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeB, "f") !== undefined) {
            writer.writeInt(1n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeB, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockBodySize, "f") !== undefined) {
            writer.writeInt(2n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockBodySize, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxSize, "f") !== undefined) {
            writer.writeInt(3n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxSize, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockHeaderSize, "f") !== undefined) {
            writer.writeInt(4n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockHeaderSize, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_keyDeposit, "f") !== undefined) {
            writer.writeInt(5n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_keyDeposit, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_poolDeposit, "f") !== undefined) {
            writer.writeInt(6n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_poolDeposit, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxEpoch, "f") !== undefined) {
            writer.writeInt(7n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxEpoch, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_nOpt, "f") !== undefined) {
            writer.writeInt(8n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_nOpt, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_poolPledgeInfluence, "f") !== undefined) {
            writer.writeInt(9n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_poolPledgeInfluence, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_expansionRate, "f") !== undefined) {
            writer.writeInt(10n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_expansionRate, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_treasuryGrowthRate, "f") !== undefined) {
            writer.writeInt(11n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_treasuryGrowthRate, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_d, "f") !== undefined) {
            writer.writeInt(12n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_d, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_extraEntropy, "f") !== undefined) {
            if (__classPrivateFieldGet(this, _ProtocolParamUpdate_extraEntropy, "f").length === 0) {
                writer.writeInt(13n);
                writer.writeStartArray(1);
                writer.writeInt(0);
            }
            else {
                writer.writeInt(13n);
                writer.writeStartArray(2);
                writer.writeInt(1);
                writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_extraEntropy, "f"), 'hex'));
            }
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_protocolVersion, "f") !== undefined) {
            writer.writeInt(14n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_protocolVersion, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minPoolCost, "f") !== undefined) {
            writer.writeInt(16n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_minPoolCost, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_adaPerUtxoByte, "f") !== undefined) {
            writer.writeInt(17n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_adaPerUtxoByte, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_costModels, "f") !== undefined) {
            writer.writeInt(18n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_costModels, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_executionCosts, "f") !== undefined) {
            writer.writeInt(19n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_executionCosts, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxExUnits, "f") !== undefined) {
            writer.writeInt(20n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxExUnits, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockExUnits, "f") !== undefined) {
            writer.writeInt(21n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockExUnits, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxValueSize, "f") !== undefined) {
            writer.writeInt(22n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxValueSize, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_collateralPercentage, "f") !== undefined) {
            writer.writeInt(23n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_collateralPercentage, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxCollateralInputs, "f") !== undefined) {
            writer.writeInt(24n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxCollateralInputs, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_poolVotingThresholds, "f") !== undefined) {
            writer.writeInt(25n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_poolVotingThresholds, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_drepVotingThresholds, "f") !== undefined) {
            writer.writeInt(26n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_drepVotingThresholds, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minCommitteeSize, "f") !== undefined) {
            writer.writeInt(27n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_minCommitteeSize, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_committeeTermLimit, "f") !== undefined) {
            writer.writeInt(28n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_committeeTermLimit, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionValidityPeriod, "f") !== undefined) {
            writer.writeInt(29n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionValidityPeriod, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionDeposit, "f") !== undefined) {
            writer.writeInt(30n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionDeposit, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_drepDeposit, "f") !== undefined) {
            writer.writeInt(31n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_drepDeposit, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_drepInactivityPeriod, "f") !== undefined) {
            writer.writeInt(32n);
            writer.writeInt(__classPrivateFieldGet(this, _ProtocolParamUpdate_drepInactivityPeriod, "f"));
        }
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, "f") !== undefined) {
            writer.writeInt(33n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, "f").toCbor(), 'hex'));
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const params = new ProtocolParamUpdate();
        reader.readStartMap();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const key = reader.readInt();
            switch (key) {
                case 0n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_minFeeA, reader.readInt(), "f");
                    break;
                case 1n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_minFeeB, reader.readInt(), "f");
                    break;
                case 2n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxBlockBodySize, Number(reader.readInt()), "f");
                    break;
                case 3n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxTxSize, Number(reader.readInt()), "f");
                    break;
                case 4n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxBlockHeaderSize, Number(reader.readInt()), "f");
                    break;
                case 5n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_keyDeposit, reader.readInt(), "f");
                    break;
                case 6n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_poolDeposit, reader.readInt(), "f");
                    break;
                case 7n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxEpoch, Number(reader.readInt()), "f");
                    break;
                case 8n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_nOpt, Number(reader.readInt()), "f");
                    break;
                case 9n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_poolPledgeInfluence, UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 10n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_expansionRate, UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 11n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_treasuryGrowthRate, UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 12n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_d, UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 13n:
                    if (reader.readStartArray() === 1) {
                        reader.readEncodedValue();
                        __classPrivateFieldSet(params, _ProtocolParamUpdate_extraEntropy, '', "f");
                        reader.readEndArray();
                    }
                    else {
                        reader.readEncodedValue();
                        __classPrivateFieldSet(params, _ProtocolParamUpdate_extraEntropy, HexBlob.fromBytes(reader.readByteString()), "f");
                        reader.readEndArray();
                    }
                    break;
                case 14n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_protocolVersion, ProtocolVersion.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 16n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_minPoolCost, reader.readInt(), "f");
                    break;
                case 17n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_adaPerUtxoByte, reader.readInt(), "f");
                    break;
                case 18n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_costModels, Costmdls.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 19n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_executionCosts, ExUnitPrices.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 20n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxTxExUnits, ExUnits.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 21n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxBlockExUnits, ExUnits.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 22n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxValueSize, Number(reader.readInt()), "f");
                    break;
                case 23n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_collateralPercentage, Number(reader.readInt()), "f");
                    break;
                case 24n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_maxCollateralInputs, Number(reader.readInt()), "f");
                    break;
                case 25n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_poolVotingThresholds, PoolVotingThresholds.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 26n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_drepVotingThresholds, DrepVotingThresholds.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
                case 27n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_minCommitteeSize, Number(reader.readInt()), "f");
                    break;
                case 28n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_committeeTermLimit, Number(reader.readInt()), "f");
                    break;
                case 29n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_governanceActionValidityPeriod, Number(reader.readInt()), "f");
                    break;
                case 30n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_governanceActionDeposit, Number(reader.readInt()), "f");
                    break;
                case 31n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_drepDeposit, Number(reader.readInt()), "f");
                    break;
                case 32n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_drepInactivityPeriod, Number(reader.readInt()), "f");
                    break;
                case 33n:
                    __classPrivateFieldSet(params, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, UnitInterval.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())), "f");
                    break;
            }
        }
        reader.readEndMap();
        __classPrivateFieldSet(params, _ProtocolParamUpdate_originalBytes, cbor, "f");
        return params;
    }
    toCore() {
        const protocolParametersUpdate = {
            coinsPerUtxoByte: __classPrivateFieldGet(this, _ProtocolParamUpdate_adaPerUtxoByte, "f") !== undefined ? Number(__classPrivateFieldGet(this, _ProtocolParamUpdate_adaPerUtxoByte, "f")) : undefined,
            collateralPercentage: __classPrivateFieldGet(this, _ProtocolParamUpdate_collateralPercentage, "f"),
            committeeTermLimit: __classPrivateFieldGet(this, _ProtocolParamUpdate_committeeTermLimit, "f") !== undefined ? EpochNo(__classPrivateFieldGet(this, _ProtocolParamUpdate_committeeTermLimit, "f")) : undefined,
            costModels: __classPrivateFieldGet(this, _ProtocolParamUpdate_costModels, "f")?.toCore(),
            dRepDeposit: __classPrivateFieldGet(this, _ProtocolParamUpdate_drepDeposit, "f"),
            dRepInactivityPeriod: __classPrivateFieldGet(this, _ProtocolParamUpdate_drepInactivityPeriod, "f") !== undefined ? EpochNo(__classPrivateFieldGet(this, _ProtocolParamUpdate_drepInactivityPeriod, "f")) : undefined,
            dRepVotingThresholds: __classPrivateFieldGet(this, _ProtocolParamUpdate_drepVotingThresholds, "f")?.toCore(),
            desiredNumberOfPools: __classPrivateFieldGet(this, _ProtocolParamUpdate_nOpt, "f"),
            governanceActionDeposit: __classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionDeposit, "f"),
            governanceActionValidityPeriod: __classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionValidityPeriod, "f") !== undefined ? EpochNo(__classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionValidityPeriod, "f")) : undefined,
            maxBlockBodySize: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockBodySize, "f"),
            maxBlockHeaderSize: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockHeaderSize, "f"),
            maxCollateralInputs: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxCollateralInputs, "f"),
            maxExecutionUnitsPerBlock: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockExUnits, "f")?.toCore(),
            maxExecutionUnitsPerTransaction: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxExUnits, "f")?.toCore(),
            maxTxSize: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxSize, "f") !== undefined ? Number(__classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxSize, "f")) : undefined,
            maxValueSize: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxValueSize, "f"),
            minCommitteeSize: __classPrivateFieldGet(this, _ProtocolParamUpdate_minCommitteeSize, "f"),
            minFeeCoefficient: __classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeA, "f") !== undefined ? Number(__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeA, "f")) : undefined,
            minFeeConstant: __classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeB, "f") !== undefined ? Number(__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeB, "f")) : undefined,
            minFeeRefScriptCostPerByte: __classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, "f")
                ? __classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, "f").toFloat().toString()
                : undefined,
            minPoolCost: __classPrivateFieldGet(this, _ProtocolParamUpdate_minPoolCost, "f") !== undefined ? Number(__classPrivateFieldGet(this, _ProtocolParamUpdate_minPoolCost, "f")) : undefined,
            monetaryExpansion: __classPrivateFieldGet(this, _ProtocolParamUpdate_expansionRate, "f") ? __classPrivateFieldGet(this, _ProtocolParamUpdate_expansionRate, "f").toFloat().toString() : undefined,
            poolDeposit: __classPrivateFieldGet(this, _ProtocolParamUpdate_poolDeposit, "f") !== undefined ? Number(__classPrivateFieldGet(this, _ProtocolParamUpdate_poolDeposit, "f")) : undefined,
            poolInfluence: __classPrivateFieldGet(this, _ProtocolParamUpdate_poolPledgeInfluence, "f") ? __classPrivateFieldGet(this, _ProtocolParamUpdate_poolPledgeInfluence, "f").toFloat().toString() : undefined,
            poolRetirementEpochBound: __classPrivateFieldGet(this, _ProtocolParamUpdate_maxEpoch, "f"),
            poolVotingThresholds: __classPrivateFieldGet(this, _ProtocolParamUpdate_poolVotingThresholds, "f")?.toCore(),
            prices: __classPrivateFieldGet(this, _ProtocolParamUpdate_executionCosts, "f")?.toCore(),
            stakeKeyDeposit: __classPrivateFieldGet(this, _ProtocolParamUpdate_keyDeposit, "f") !== undefined ? Number(__classPrivateFieldGet(this, _ProtocolParamUpdate_keyDeposit, "f")) : undefined,
            treasuryExpansion: __classPrivateFieldGet(this, _ProtocolParamUpdate_treasuryGrowthRate, "f") ? __classPrivateFieldGet(this, _ProtocolParamUpdate_treasuryGrowthRate, "f").toFloat().toString() : undefined
        };
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_d, "f"))
            protocolParametersUpdate.decentralizationParameter = __classPrivateFieldGet(this, _ProtocolParamUpdate_d, "f").toFloat().toString();
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_extraEntropy, "f") !== undefined)
            protocolParametersUpdate.extraEntropy = __classPrivateFieldGet(this, _ProtocolParamUpdate_extraEntropy, "f");
        if (__classPrivateFieldGet(this, _ProtocolParamUpdate_protocolVersion, "f"))
            protocolParametersUpdate.protocolVersion = __classPrivateFieldGet(this, _ProtocolParamUpdate_protocolVersion, "f").toCore();
        return protocolParametersUpdate;
    }
    static fromCore(parametersUpdate) {
        const params = new ProtocolParamUpdate();
        __classPrivateFieldSet(params, _ProtocolParamUpdate_minFeeA, parametersUpdate.minFeeCoefficient !== undefined ? BigInt(parametersUpdate.minFeeCoefficient) : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxBlockBodySize, parametersUpdate.maxBlockBodySize, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_minFeeB, parametersUpdate.minFeeConstant !== undefined ? BigInt(parametersUpdate.minFeeConstant) : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxBlockHeaderSize, parametersUpdate.maxBlockHeaderSize, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_keyDeposit, parametersUpdate.stakeKeyDeposit !== undefined ? BigInt(parametersUpdate.stakeKeyDeposit) : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_poolDeposit, parametersUpdate.poolDeposit !== undefined && parametersUpdate.poolDeposit !== null
            ? BigInt(parametersUpdate.poolDeposit)
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxEpoch, parametersUpdate.poolRetirementEpochBound, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_nOpt, parametersUpdate.desiredNumberOfPools, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_poolPledgeInfluence, parametersUpdate.poolInfluence
            ? UnitInterval.fromFloat(Number(parametersUpdate.poolInfluence))
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_expansionRate, parametersUpdate.monetaryExpansion
            ? UnitInterval.fromFloat(Number(parametersUpdate.monetaryExpansion))
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_treasuryGrowthRate, parametersUpdate.treasuryExpansion
            ? UnitInterval.fromFloat(Number(parametersUpdate.treasuryExpansion))
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_minPoolCost, parametersUpdate.minPoolCost !== undefined ? BigInt(parametersUpdate.minPoolCost) : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxValueSize, parametersUpdate.maxValueSize, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxTxSize, parametersUpdate.maxTxSize, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_collateralPercentage, parametersUpdate.collateralPercentage, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxCollateralInputs, parametersUpdate.maxCollateralInputs, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_costModels, parametersUpdate.costModels ? Costmdls.fromCore(parametersUpdate.costModels) : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_executionCosts, parametersUpdate.prices ? ExUnitPrices.fromCore(parametersUpdate.prices) : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxTxExUnits, parametersUpdate.maxExecutionUnitsPerTransaction
            ? ExUnits.fromCore(parametersUpdate.maxExecutionUnitsPerTransaction)
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_maxBlockExUnits, parametersUpdate.maxExecutionUnitsPerBlock
            ? ExUnits.fromCore(parametersUpdate.maxExecutionUnitsPerBlock)
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_adaPerUtxoByte, parametersUpdate.coinsPerUtxoByte !== undefined ? BigInt(parametersUpdate.coinsPerUtxoByte) : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_poolVotingThresholds, parametersUpdate.poolVotingThresholds
            ? PoolVotingThresholds.fromCore(parametersUpdate.poolVotingThresholds)
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_drepVotingThresholds, parametersUpdate.dRepVotingThresholds
            ? DrepVotingThresholds.fromCore(parametersUpdate.dRepVotingThresholds)
            : undefined, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_minCommitteeSize, parametersUpdate.minCommitteeSize, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_committeeTermLimit, parametersUpdate.committeeTermLimit, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_governanceActionValidityPeriod, parametersUpdate.governanceActionValidityPeriod, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_governanceActionDeposit, parametersUpdate.governanceActionDeposit, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_drepDeposit, parametersUpdate.dRepDeposit, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_drepInactivityPeriod, parametersUpdate.dRepInactivityPeriod, "f");
        __classPrivateFieldSet(params, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, parametersUpdate.minFeeRefScriptCostPerByte
            ? UnitInterval.fromFloat(Number(parametersUpdate.minFeeRefScriptCostPerByte))
            : undefined, "f");
        const { protocolVersion, extraEntropy, decentralizationParameter } = parametersUpdate;
        if (protocolVersion !== undefined || extraEntropy !== undefined || decentralizationParameter) {
            __classPrivateFieldSet(params, _ProtocolParamUpdate_d, decentralizationParameter ? UnitInterval.fromFloat(Number(decentralizationParameter)) : undefined, "f");
            __classPrivateFieldSet(params, _ProtocolParamUpdate_protocolVersion, protocolVersion ? ProtocolVersion.fromCore(protocolVersion) : undefined, "f");
            __classPrivateFieldSet(params, _ProtocolParamUpdate_extraEntropy, extraEntropy ? HexBlob(extraEntropy) : undefined, "f");
        }
        return params;
    }
    setMinFeeA(minFeeA) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_minFeeA, minFeeA, "f");
    }
    minFeeA() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeA, "f");
    }
    setMinFeeB(minFeeB) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_minFeeB, minFeeB, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    minFeeB() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeB, "f");
    }
    setMaxBlockBodySize(maxBlockBodySize) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxBlockBodySize, maxBlockBodySize, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxBlockBodySize() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockBodySize, "f");
    }
    setMaxTxSize(maxTxSize) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxTxSize, maxTxSize, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxTxSize() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxSize, "f");
    }
    setMaxBlockHeaderSize(maxBlockHeaderSize) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxBlockHeaderSize, maxBlockHeaderSize, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxBlockHeaderSize() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockHeaderSize, "f");
    }
    setKeyDeposit(keyDeposit) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_keyDeposit, keyDeposit, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    keyDeposit() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_keyDeposit, "f");
    }
    setPoolDeposit(poolDeposit) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_poolDeposit, poolDeposit, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    poolDeposit() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_poolDeposit, "f");
    }
    setMaxEpoch(maxEpoch) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxEpoch, maxEpoch, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxEpoch() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxEpoch, "f");
    }
    setNOpt(nOpt) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_nOpt, nOpt, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    nOpt() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_nOpt, "f");
    }
    setPoolPledgeInfluence(poolPledgeInfluence) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_poolPledgeInfluence, poolPledgeInfluence, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    poolPledgeInfluence() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_poolPledgeInfluence, "f");
    }
    setExpansionRate(expansionRate) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_expansionRate, expansionRate, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    expansionRate() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_expansionRate, "f");
    }
    setTreasuryGrowthRate(treasuryGrowthRate) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_treasuryGrowthRate, treasuryGrowthRate, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    treasuryGrowthRate() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_treasuryGrowthRate, "f");
    }
    setD(d) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_d, d, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    d() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_d, "f");
    }
    setExtraEntropy(extraEntropy) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_extraEntropy, extraEntropy, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    extraEntropy() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_extraEntropy, "f");
    }
    setProtocolVersion(protocolVersion) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_protocolVersion, protocolVersion, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    protocolVersion() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_protocolVersion, "f");
    }
    setMinPoolCost(minPoolCost) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_minPoolCost, minPoolCost, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    minPoolCost() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_minPoolCost, "f");
    }
    setAdaPerUtxoByte(adaPerUtxoByte) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_adaPerUtxoByte, adaPerUtxoByte, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    adaPerUtxoByte() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_adaPerUtxoByte, "f");
    }
    setCostModels(costModels) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_costModels, costModels, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    costModels() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_costModels, "f");
    }
    setExecutionCosts(executionCosts) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_executionCosts, executionCosts, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    executionCosts() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_executionCosts, "f");
    }
    setMaxTxExUnits(maxTxExUnits) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxTxExUnits, maxTxExUnits, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxTxExUnits() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxExUnits, "f");
    }
    setMaxBlockExUnits(maxBlockExUnits) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxBlockExUnits, maxBlockExUnits, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxBlockExUnits() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockExUnits, "f");
    }
    setMaxValueSize(maxValueSize) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxValueSize, maxValueSize, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxValueSize() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxValueSize, "f");
    }
    setCollateralPercentage(collateralPercentage) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_collateralPercentage, collateralPercentage, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    collateralPercentage() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_collateralPercentage, "f");
    }
    setMaxCollateralInputs(maxCollateralInputs) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_maxCollateralInputs, maxCollateralInputs, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    maxCollateralInputs() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_maxCollateralInputs, "f");
    }
    setPoolVotingThresholds(pooVotingThresholds) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_poolVotingThresholds, pooVotingThresholds, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    poolVotingThresholds() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_poolVotingThresholds, "f");
    }
    setDrepVotingThresholds(drepVotingThresholds) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_drepVotingThresholds, drepVotingThresholds, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    drepVotingThresholds() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_drepVotingThresholds, "f");
    }
    setMinCommitteeSize(minCommitteeSize) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_minCommitteeSize, minCommitteeSize, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    minCommitteeSize() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_minCommitteeSize, "f");
    }
    setCommitteeTermLimit(committeeTermLimit) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_committeeTermLimit, committeeTermLimit, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    committeeTermLimit() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_committeeTermLimit, "f");
    }
    setGovernanceActionValidityPeriod(governanceActionValidityPeriod) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_governanceActionValidityPeriod, governanceActionValidityPeriod, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    governanceActionValidityPeriod() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionValidityPeriod, "f");
    }
    setGovernanceActionDeposit(governanceActionDeposit) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_governanceActionDeposit, governanceActionDeposit, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    governanceActionDeposit() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionDeposit, "f");
    }
    setDrepDeposit(drepDeposit) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_drepDeposit, drepDeposit, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    drepDeposit() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_drepDeposit, "f");
    }
    setDrepInactivityPeriod(drepInactivityPeriod) {
        __classPrivateFieldSet(this, _ProtocolParamUpdate_drepInactivityPeriod, drepInactivityPeriod, "f");
        __classPrivateFieldSet(this, _ProtocolParamUpdate_originalBytes, undefined, "f");
    }
    drepInactivityPeriod() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_drepInactivityPeriod, "f");
    }
    minFeeRefScriptCostPerByte() {
        return __classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, "f");
    }
}
_ProtocolParamUpdate_minFeeA = new WeakMap(), _ProtocolParamUpdate_minFeeB = new WeakMap(), _ProtocolParamUpdate_maxBlockBodySize = new WeakMap(), _ProtocolParamUpdate_maxTxSize = new WeakMap(), _ProtocolParamUpdate_maxBlockHeaderSize = new WeakMap(), _ProtocolParamUpdate_keyDeposit = new WeakMap(), _ProtocolParamUpdate_poolDeposit = new WeakMap(), _ProtocolParamUpdate_maxEpoch = new WeakMap(), _ProtocolParamUpdate_nOpt = new WeakMap(), _ProtocolParamUpdate_poolPledgeInfluence = new WeakMap(), _ProtocolParamUpdate_expansionRate = new WeakMap(), _ProtocolParamUpdate_treasuryGrowthRate = new WeakMap(), _ProtocolParamUpdate_d = new WeakMap(), _ProtocolParamUpdate_extraEntropy = new WeakMap(), _ProtocolParamUpdate_protocolVersion = new WeakMap(), _ProtocolParamUpdate_minPoolCost = new WeakMap(), _ProtocolParamUpdate_adaPerUtxoByte = new WeakMap(), _ProtocolParamUpdate_costModels = new WeakMap(), _ProtocolParamUpdate_executionCosts = new WeakMap(), _ProtocolParamUpdate_maxTxExUnits = new WeakMap(), _ProtocolParamUpdate_maxBlockExUnits = new WeakMap(), _ProtocolParamUpdate_maxValueSize = new WeakMap(), _ProtocolParamUpdate_collateralPercentage = new WeakMap(), _ProtocolParamUpdate_maxCollateralInputs = new WeakMap(), _ProtocolParamUpdate_poolVotingThresholds = new WeakMap(), _ProtocolParamUpdate_drepVotingThresholds = new WeakMap(), _ProtocolParamUpdate_minCommitteeSize = new WeakMap(), _ProtocolParamUpdate_committeeTermLimit = new WeakMap(), _ProtocolParamUpdate_governanceActionValidityPeriod = new WeakMap(), _ProtocolParamUpdate_governanceActionDeposit = new WeakMap(), _ProtocolParamUpdate_drepDeposit = new WeakMap(), _ProtocolParamUpdate_drepInactivityPeriod = new WeakMap(), _ProtocolParamUpdate_minFeeRefScriptCostPerByte = new WeakMap(), _ProtocolParamUpdate_originalBytes = new WeakMap(), _ProtocolParamUpdate_instances = new WeakSet(), _ProtocolParamUpdate_getMapSize = function _ProtocolParamUpdate_getMapSize() {
    let mapSize = 0;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeA, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeB, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockBodySize, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxSize, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockHeaderSize, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_keyDeposit, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_poolDeposit, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxEpoch, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_nOpt, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_poolPledgeInfluence, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_expansionRate, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_treasuryGrowthRate, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_d, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_extraEntropy, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_protocolVersion, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minPoolCost, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_adaPerUtxoByte, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_costModels, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_executionCosts, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxTxExUnits, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxBlockExUnits, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxValueSize, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_collateralPercentage, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_maxCollateralInputs, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_poolVotingThresholds, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_drepVotingThresholds, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minCommitteeSize, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_committeeTermLimit, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionValidityPeriod, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_governanceActionDeposit, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_drepDeposit, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_drepInactivityPeriod, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _ProtocolParamUpdate_minFeeRefScriptCostPerByte, "f") !== undefined)
        ++mapSize;
    return mapSize;
};
