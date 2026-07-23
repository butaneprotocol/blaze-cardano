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
var _TransactionBody_instances, _TransactionBody_inputs, _TransactionBody_outputs, _TransactionBody_fee, _TransactionBody_ttl, _TransactionBody_certs, _TransactionBody_withdrawals, _TransactionBody_update, _TransactionBody_auxiliaryDataHash, _TransactionBody_validityStartInterval, _TransactionBody_mint, _TransactionBody_scriptDataHash, _TransactionBody_collateral, _TransactionBody_requiredSigners, _TransactionBody_networkId, _TransactionBody_collateralReturn, _TransactionBody_totalCollateral, _TransactionBody_referenceInputs, _TransactionBody_votingProcedures, _TransactionBody_proposalProcedures, _TransactionBody_currentTreasuryValue, _TransactionBody_donation, _TransactionBody_originalBytes, _TransactionBody_getMapSize;
import * as Crypto from "../../../deps/crypto.js";
import { Address, RewardAddress } from '../../Cardano/Address/index.js';
import { CborReader, CborReaderState, CborTag, CborWriter } from '../CBOR/index.js';
import { CborSet, Hash } from '../Common/index.js';
import { Certificate } from '../Certificates/index.js';
import { HexBlob } from "../../../deps/util.js";
import { ProposalProcedure } from './ProposalProcedure/index.js';
import { SerializationError, SerializationFailure } from '../../errors.js';
import { Slot } from '../../Cardano/types/Block.js';
import { TransactionInput } from './TransactionInput.js';
import { TransactionOutput } from './TransactionOutput.js';
import { Update } from '../Update/index.js';
import { VotingProcedures } from './VotingProcedures/index.js';
import { hexToBytes } from '../../util/misc/index.js';
import { multiAssetsToTokenMap, sortCanonically, tokenMapToMultiAsset } from './Utils.js';
export class TransactionBody {
    constructor(inputs, outputs, fee, ttl) {
        _TransactionBody_instances.add(this);
        _TransactionBody_inputs.set(this, void 0);
        _TransactionBody_outputs.set(this, void 0);
        _TransactionBody_fee.set(this, void 0);
        _TransactionBody_ttl.set(this, void 0);
        _TransactionBody_certs.set(this, void 0);
        _TransactionBody_withdrawals.set(this, void 0);
        _TransactionBody_update.set(this, void 0);
        _TransactionBody_auxiliaryDataHash.set(this, void 0);
        _TransactionBody_validityStartInterval.set(this, void 0);
        _TransactionBody_mint.set(this, void 0);
        _TransactionBody_scriptDataHash.set(this, void 0);
        _TransactionBody_collateral.set(this, void 0);
        _TransactionBody_requiredSigners.set(this, void 0);
        _TransactionBody_networkId.set(this, void 0);
        _TransactionBody_collateralReturn.set(this, void 0);
        _TransactionBody_totalCollateral.set(this, void 0);
        _TransactionBody_referenceInputs.set(this, void 0);
        _TransactionBody_votingProcedures.set(this, void 0);
        _TransactionBody_proposalProcedures.set(this, void 0);
        _TransactionBody_currentTreasuryValue.set(this, void 0);
        _TransactionBody_donation.set(this, void 0);
        _TransactionBody_originalBytes.set(this, undefined);
        __classPrivateFieldSet(this, _TransactionBody_inputs, inputs, "f");
        __classPrivateFieldSet(this, _TransactionBody_outputs, outputs, "f");
        __classPrivateFieldSet(this, _TransactionBody_fee, fee, "f");
        __classPrivateFieldSet(this, _TransactionBody_ttl, ttl, "f");
    }
    toCbor() {
        const writer = new CborWriter();
        if (__classPrivateFieldGet(this, _TransactionBody_originalBytes, "f"))
            return __classPrivateFieldGet(this, _TransactionBody_originalBytes, "f");
        writer.writeStartMap(__classPrivateFieldGet(this, _TransactionBody_instances, "m", _TransactionBody_getMapSize).call(this));
        if (__classPrivateFieldGet(this, _TransactionBody_inputs, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_inputs, "f").size() > 0) {
            writer.writeInt(0n);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionBody_inputs, "f").toCbor()));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_outputs, "f") !== undefined) {
            writer.writeInt(1n);
            writer.writeStartArray(__classPrivateFieldGet(this, _TransactionBody_outputs, "f").length);
            for (const output of __classPrivateFieldGet(this, _TransactionBody_outputs, "f")) {
                writer.writeEncodedValue(Buffer.from(output.toCbor(), 'hex'));
            }
        }
        if (__classPrivateFieldGet(this, _TransactionBody_fee, "f") !== undefined) {
            writer.writeInt(2n);
            writer.writeInt(__classPrivateFieldGet(this, _TransactionBody_fee, "f"));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_ttl, "f") !== undefined) {
            writer.writeInt(3n);
            writer.writeInt(__classPrivateFieldGet(this, _TransactionBody_ttl, "f"));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_certs, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_certs, "f").size() > 0) {
            writer.writeInt(4n);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionBody_certs, "f").toCbor()));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_withdrawals, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_withdrawals, "f").size > 0) {
            writer.writeInt(5n);
            const withdrawalsWithAddressBytes = new Map();
            for (const [key, value] of __classPrivateFieldGet(this, _TransactionBody_withdrawals, "f")) {
                const rewardAddress = RewardAddress.fromAddress(Address.fromBech32(key));
                if (!rewardAddress) {
                    throw new SerializationError(SerializationFailure.InvalidAddress, `Invalid withdrawal address: ${key}`);
                }
                const rewardAddressBytes = rewardAddress.toAddress().toBytes();
                withdrawalsWithAddressBytes.set(rewardAddressBytes, value);
            }
            const sortedCanonically = [...withdrawalsWithAddressBytes].sort((a, b) => (a > b ? 1 : -1));
            writer.writeStartMap(sortedCanonically.length);
            for (const [key, value] of sortedCanonically) {
                writer.writeByteString(Buffer.from(key, 'hex'));
                writer.writeInt(value);
            }
        }
        if (__classPrivateFieldGet(this, _TransactionBody_update, "f") !== undefined) {
            writer.writeInt(6n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionBody_update, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_auxiliaryDataHash, "f") !== undefined) {
            writer.writeInt(7n);
            writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionBody_auxiliaryDataHash, "f"), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_validityStartInterval, "f") !== undefined) {
            writer.writeInt(8n);
            writer.writeInt(__classPrivateFieldGet(this, _TransactionBody_validityStartInterval, "f"));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_mint, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_mint, "f").size > 0) {
            writer.writeInt(9n);
            const multiassets = tokenMapToMultiAsset(__classPrivateFieldGet(this, _TransactionBody_mint, "f"));
            writer.writeStartMap(multiassets.size);
            const sortedMultiAssets = new Map([...multiassets.entries()].sort(sortCanonically));
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
        if (__classPrivateFieldGet(this, _TransactionBody_scriptDataHash, "f") !== undefined) {
            writer.writeInt(11n);
            writer.writeByteString(Buffer.from(__classPrivateFieldGet(this, _TransactionBody_scriptDataHash, "f"), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_collateral, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_collateral, "f").size() > 0) {
            writer.writeInt(13n);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionBody_collateral, "f").toCbor()));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_requiredSigners, "f")?.values() !== undefined && __classPrivateFieldGet(this, _TransactionBody_requiredSigners, "f").size() > 0) {
            writer.writeInt(14n);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionBody_requiredSigners, "f").toCbor()));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_networkId, "f") !== undefined) {
            writer.writeInt(15n);
            writer.writeInt(__classPrivateFieldGet(this, _TransactionBody_networkId, "f"));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_collateralReturn, "f") !== undefined) {
            writer.writeInt(16n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionBody_collateralReturn, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_totalCollateral, "f") !== undefined) {
            writer.writeInt(17n);
            writer.writeInt(__classPrivateFieldGet(this, _TransactionBody_totalCollateral, "f"));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f").size() > 0) {
            writer.writeInt(18n);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f").toCbor()));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_votingProcedures, "f") !== undefined) {
            writer.writeInt(19n);
            writer.writeEncodedValue(Buffer.from(__classPrivateFieldGet(this, _TransactionBody_votingProcedures, "f").toCbor(), 'hex'));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f").size() > 0) {
            writer.writeInt(20n);
            writer.writeEncodedValue(hexToBytes(__classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f").toCbor()));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_currentTreasuryValue, "f") !== undefined) {
            writer.writeInt(21n);
            writer.writeInt(__classPrivateFieldGet(this, _TransactionBody_currentTreasuryValue, "f"));
        }
        if (__classPrivateFieldGet(this, _TransactionBody_donation, "f") !== undefined) {
            writer.writeInt(22n);
            writer.writeInt(__classPrivateFieldGet(this, _TransactionBody_donation, "f"));
        }
        return writer.encodeAsHex();
    }
    static fromCbor(cbor) {
        const reader = new CborReader(cbor);
        const inputs = CborSet.fromCore([], TransactionInput.fromCore);
        const outputs = new Array();
        const fee = 0n;
        const body = new TransactionBody(inputs, outputs, fee);
        reader.readStartMap();
        while (reader.peekState() !== CborReaderState.EndMap) {
            const key = reader.readInt();
            switch (key) {
                case 0n: {
                    const inputsBytes = reader.readEncodedValue();
                    body.setInputs(CborSet.fromCbor(HexBlob.fromBytes(inputsBytes), TransactionInput.fromCbor));
                    break;
                }
                case 1n: {
                    reader.readStartArray();
                    while (reader.peekState() !== CborReaderState.EndArray) {
                        body.outputs().push(TransactionOutput.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                    }
                    reader.readEndArray();
                    break;
                }
                case 2n:
                    body.setFee(reader.readInt());
                    break;
                case 3n:
                    body.setTtl(Slot(Number(reader.readInt())));
                    break;
                case 4n: {
                    body.setCerts(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), Certificate.fromCbor));
                    break;
                }
                case 5n: {
                    reader.readStartMap();
                    body.setWithdrawals(new Map());
                    while (reader.peekState() !== CborReaderState.EndMap) {
                        const account = Address.fromBytes(HexBlob.fromBytes(reader.readByteString())).toBech32();
                        const amount = reader.readInt();
                        body.withdrawals().set(account, amount);
                    }
                    reader.readEndMap();
                    break;
                }
                case 6n:
                    body.setUpdate(Update.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                    break;
                case 7n:
                    body.setAuxiliaryDataHash(HexBlob.fromBytes(reader.readByteString()));
                    break;
                case 8n:
                    body.setValidityStartInterval(Slot(Number(reader.readInt())));
                    break;
                case 9n: {
                    const multiassets = new Map();
                    reader.readStartMap();
                    while (reader.peekState() !== CborReaderState.EndMap) {
                        const scriptHash = HexBlob.fromBytes(reader.readByteString());
                        if (!multiassets.has(scriptHash))
                            multiassets.set(scriptHash, new Map());
                        reader.readStartMap();
                        while (reader.peekState() !== CborReaderState.EndMap) {
                            const assetName = Buffer.from(reader.readByteString()).toString('hex');
                            const quantity = reader.readInt();
                            multiassets.get(scriptHash).set(assetName, quantity);
                        }
                        reader.readEndMap();
                    }
                    reader.readEndMap();
                    body.setMint(multiAssetsToTokenMap(multiassets));
                    break;
                }
                case 11n:
                    body.setScriptDataHash(HexBlob.fromBytes(reader.readByteString()));
                    break;
                case 13n:
                    body.setCollateral(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), TransactionInput.fromCbor));
                    break;
                case 14n:
                    body.setRequiredSigners(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), Hash.fromCbor));
                    break;
                case 15n:
                    body.setNetworkId(Number(reader.readInt()));
                    break;
                case 16n:
                    body.setCollateralReturn(TransactionOutput.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                    break;
                case 17n:
                    body.setTotalCollateral(reader.readInt());
                    break;
                case 18n:
                    body.setReferenceInputs(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), TransactionInput.fromCbor));
                    break;
                case 19n:
                    body.setVotingProcedures(VotingProcedures.fromCbor(HexBlob.fromBytes(reader.readEncodedValue())));
                    break;
                case 20n:
                    body.setProposalProcedures(CborSet.fromCbor(HexBlob.fromBytes(reader.readEncodedValue()), ProposalProcedure.fromCbor));
                    break;
                case 21n:
                    body.setCurrentTreasuryValue(reader.readInt());
                    break;
                case 22n:
                    body.setDonation(reader.readInt());
                    break;
            }
        }
        reader.readEndMap();
        __classPrivateFieldSet(body, _TransactionBody_originalBytes, cbor, "f");
        return body;
    }
    toCore() {
        return {
            auxiliaryDataHash: __classPrivateFieldGet(this, _TransactionBody_auxiliaryDataHash, "f"),
            certificates: __classPrivateFieldGet(this, _TransactionBody_certs, "f")?.values() ? __classPrivateFieldGet(this, _TransactionBody_certs, "f").toCore() : undefined,
            collateralReturn: __classPrivateFieldGet(this, _TransactionBody_collateralReturn, "f")?.toCore(),
            collaterals: __classPrivateFieldGet(this, _TransactionBody_collateral, "f")?.values() ? __classPrivateFieldGet(this, _TransactionBody_collateral, "f").toCore() : undefined,
            donation: __classPrivateFieldGet(this, _TransactionBody_donation, "f"),
            fee: __classPrivateFieldGet(this, _TransactionBody_fee, "f"),
            inputs: __classPrivateFieldGet(this, _TransactionBody_inputs, "f").toCore(),
            mint: __classPrivateFieldGet(this, _TransactionBody_mint, "f"),
            networkId: __classPrivateFieldGet(this, _TransactionBody_networkId, "f"),
            outputs: __classPrivateFieldGet(this, _TransactionBody_outputs, "f").map((output) => output.toCore()),
            proposalProcedures: __classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f")?.values() ? __classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f").toCore() : undefined,
            referenceInputs: __classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f")?.size() ? __classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f").toCore() : undefined,
            requiredExtraSignatures: __classPrivateFieldGet(this, _TransactionBody_requiredSigners, "f")?.toCore(),
            scriptIntegrityHash: __classPrivateFieldGet(this, _TransactionBody_scriptDataHash, "f"),
            totalCollateral: __classPrivateFieldGet(this, _TransactionBody_totalCollateral, "f"),
            treasuryValue: __classPrivateFieldGet(this, _TransactionBody_currentTreasuryValue, "f"),
            update: __classPrivateFieldGet(this, _TransactionBody_update, "f") ? __classPrivateFieldGet(this, _TransactionBody_update, "f").toCore() : undefined,
            validityInterval: __classPrivateFieldGet(this, _TransactionBody_ttl, "f") !== undefined || __classPrivateFieldGet(this, _TransactionBody_validityStartInterval, "f") !== undefined
                ? {
                    invalidBefore: __classPrivateFieldGet(this, _TransactionBody_validityStartInterval, "f"),
                    invalidHereafter: __classPrivateFieldGet(this, _TransactionBody_ttl, "f")
                }
                : undefined,
            votingProcedures: __classPrivateFieldGet(this, _TransactionBody_votingProcedures, "f") ? __classPrivateFieldGet(this, _TransactionBody_votingProcedures, "f").toCore() : undefined,
            withdrawals: __classPrivateFieldGet(this, _TransactionBody_withdrawals, "f")
                ? [...__classPrivateFieldGet(this, _TransactionBody_withdrawals, "f")].map(([stakeAddress, quantity]) => ({ quantity, stakeAddress }))
                : undefined
        };
    }
    static fromCore(coreTransactionBody) {
        const body = new TransactionBody(CborSet.fromCore(coreTransactionBody.inputs, TransactionInput.fromCore), coreTransactionBody.outputs.map((output) => TransactionOutput.fromCore(output)), coreTransactionBody.fee);
        if (coreTransactionBody.auxiliaryDataHash)
            body.setAuxiliaryDataHash(coreTransactionBody.auxiliaryDataHash);
        if (coreTransactionBody.certificates)
            body.setCerts(CborSet.fromCore(coreTransactionBody.certificates, Certificate.fromCore));
        if (coreTransactionBody.collateralReturn)
            body.setCollateralReturn(TransactionOutput.fromCore(coreTransactionBody.collateralReturn));
        if (coreTransactionBody.collaterals)
            body.setCollateral(CborSet.fromCore(coreTransactionBody.collaterals, TransactionInput.fromCore));
        if (coreTransactionBody.mint)
            body.setMint(coreTransactionBody.mint);
        if (coreTransactionBody.networkId !== undefined)
            body.setNetworkId(coreTransactionBody.networkId);
        if (coreTransactionBody.referenceInputs)
            body.setReferenceInputs(CborSet.fromCore(coreTransactionBody.referenceInputs, TransactionInput.fromCore));
        if (coreTransactionBody.requiredExtraSignatures)
            body.setRequiredSigners(CborSet.fromCore(coreTransactionBody.requiredExtraSignatures, Hash.fromCore));
        if (coreTransactionBody.scriptIntegrityHash)
            body.setScriptDataHash(coreTransactionBody.scriptIntegrityHash);
        if (coreTransactionBody.totalCollateral !== undefined)
            body.setTotalCollateral(coreTransactionBody.totalCollateral);
        if (coreTransactionBody.update)
            body.setUpdate(Update.fromCore(coreTransactionBody.update));
        if (coreTransactionBody.validityInterval) {
            if (coreTransactionBody.validityInterval.invalidHereafter !== undefined)
                body.setTtl(coreTransactionBody.validityInterval.invalidHereafter);
            if (coreTransactionBody.validityInterval.invalidBefore !== undefined)
                body.setValidityStartInterval(coreTransactionBody.validityInterval.invalidBefore);
        }
        if (coreTransactionBody.withdrawals) {
            body.setWithdrawals(new Map());
            for (const coreWithdrawal of coreTransactionBody.withdrawals) {
                body.withdrawals().set(coreWithdrawal.stakeAddress, coreWithdrawal.quantity);
            }
        }
        if (coreTransactionBody.donation !== undefined)
            body.setDonation(coreTransactionBody.donation);
        if (coreTransactionBody.treasuryValue !== undefined)
            body.setCurrentTreasuryValue(coreTransactionBody.treasuryValue);
        if (coreTransactionBody.votingProcedures)
            body.setVotingProcedures(VotingProcedures.fromCore(coreTransactionBody.votingProcedures));
        if (coreTransactionBody.proposalProcedures)
            body.setProposalProcedures(CborSet.fromCore(coreTransactionBody.proposalProcedures, ProposalProcedure.fromCore));
        return body;
    }
    setInputs(inputs) {
        __classPrivateFieldSet(this, _TransactionBody_inputs, inputs, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    inputs() {
        return __classPrivateFieldGet(this, _TransactionBody_inputs, "f");
    }
    setOutputs(outputs) {
        __classPrivateFieldSet(this, _TransactionBody_outputs, outputs, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    outputs() {
        return __classPrivateFieldGet(this, _TransactionBody_outputs, "f");
    }
    setFee(fee) {
        __classPrivateFieldSet(this, _TransactionBody_fee, fee, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    fee() {
        return __classPrivateFieldGet(this, _TransactionBody_fee, "f");
    }
    setTtl(ttl) {
        __classPrivateFieldSet(this, _TransactionBody_ttl, ttl, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    ttl() {
        return __classPrivateFieldGet(this, _TransactionBody_ttl, "f");
    }
    setCerts(certs) {
        __classPrivateFieldSet(this, _TransactionBody_certs, certs, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    certs() {
        return __classPrivateFieldGet(this, _TransactionBody_certs, "f");
    }
    setWithdrawals(withdrawals) {
        __classPrivateFieldSet(this, _TransactionBody_withdrawals, withdrawals, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    withdrawals() {
        return __classPrivateFieldGet(this, _TransactionBody_withdrawals, "f");
    }
    setUpdate(update) {
        __classPrivateFieldSet(this, _TransactionBody_update, update, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    update() {
        return __classPrivateFieldGet(this, _TransactionBody_update, "f");
    }
    setAuxiliaryDataHash(auxiliaryDataHash) {
        __classPrivateFieldSet(this, _TransactionBody_auxiliaryDataHash, auxiliaryDataHash, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    auxiliaryDataHash() {
        return __classPrivateFieldGet(this, _TransactionBody_auxiliaryDataHash, "f");
    }
    setValidityStartInterval(validityStartInterval) {
        __classPrivateFieldSet(this, _TransactionBody_validityStartInterval, validityStartInterval, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    validityStartInterval() {
        return __classPrivateFieldGet(this, _TransactionBody_validityStartInterval, "f");
    }
    setMint(mint) {
        __classPrivateFieldSet(this, _TransactionBody_mint, multiAssetsToTokenMap(new Map([...tokenMapToMultiAsset(mint).entries()].sort(sortCanonically))), "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    mint() {
        return __classPrivateFieldGet(this, _TransactionBody_mint, "f");
    }
    setScriptDataHash(scriptDataHash) {
        __classPrivateFieldSet(this, _TransactionBody_scriptDataHash, scriptDataHash, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    scriptDataHash() {
        return __classPrivateFieldGet(this, _TransactionBody_scriptDataHash, "f");
    }
    setCollateral(collateral) {
        __classPrivateFieldSet(this, _TransactionBody_collateral, collateral, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    collateral() {
        return __classPrivateFieldGet(this, _TransactionBody_collateral, "f");
    }
    setRequiredSigners(requiredSigners) {
        __classPrivateFieldSet(this, _TransactionBody_requiredSigners, requiredSigners, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    requiredSigners() {
        return __classPrivateFieldGet(this, _TransactionBody_requiredSigners, "f");
    }
    setNetworkId(networkId) {
        __classPrivateFieldSet(this, _TransactionBody_networkId, networkId, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    networkId() {
        return __classPrivateFieldGet(this, _TransactionBody_networkId, "f");
    }
    setCollateralReturn(collateralReturn) {
        __classPrivateFieldSet(this, _TransactionBody_collateralReturn, collateralReturn, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    collateralReturn() {
        return __classPrivateFieldGet(this, _TransactionBody_collateralReturn, "f");
    }
    setTotalCollateral(totalCollateral) {
        __classPrivateFieldSet(this, _TransactionBody_totalCollateral, totalCollateral, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    totalCollateral() {
        return __classPrivateFieldGet(this, _TransactionBody_totalCollateral, "f");
    }
    setReferenceInputs(referenceInputs) {
        __classPrivateFieldSet(this, _TransactionBody_referenceInputs, referenceInputs, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    referenceInputs() {
        return __classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f");
    }
    setVotingProcedures(votingProcedures) {
        __classPrivateFieldSet(this, _TransactionBody_votingProcedures, votingProcedures, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    votingProcedures() {
        return __classPrivateFieldGet(this, _TransactionBody_votingProcedures, "f");
    }
    setProposalProcedures(proposalProcedure) {
        __classPrivateFieldSet(this, _TransactionBody_proposalProcedures, proposalProcedure, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    proposalProcedures() {
        return __classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f");
    }
    setCurrentTreasuryValue(currentTreasuryValue) {
        __classPrivateFieldSet(this, _TransactionBody_currentTreasuryValue, currentTreasuryValue, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    currentTreasuryValue() {
        return __classPrivateFieldGet(this, _TransactionBody_currentTreasuryValue, "f");
    }
    setDonation(donation) {
        __classPrivateFieldSet(this, _TransactionBody_donation, donation, "f");
        __classPrivateFieldSet(this, _TransactionBody_originalBytes, undefined, "f");
    }
    donation() {
        return __classPrivateFieldGet(this, _TransactionBody_donation, "f");
    }
    hash() {
        return Crypto.blake2b.hash(this.toCbor(), 32);
    }
    hasTaggedSets() {
        const reader = new CborReader(__classPrivateFieldGet(this, _TransactionBody_inputs, "f").toCbor());
        return reader.peekState() === CborReaderState.Tag && reader.peekTag() === CborTag.Set;
    }
    hasBabbageOutput() {
        if (__classPrivateFieldGet(this, _TransactionBody_outputs, "f").length === 0)
            return false;
        const reader = new CborReader(__classPrivateFieldGet(this, _TransactionBody_outputs, "f")[0].toCbor());
        return reader.peekState() === CborReaderState.StartMap;
    }
}
_TransactionBody_inputs = new WeakMap(), _TransactionBody_outputs = new WeakMap(), _TransactionBody_fee = new WeakMap(), _TransactionBody_ttl = new WeakMap(), _TransactionBody_certs = new WeakMap(), _TransactionBody_withdrawals = new WeakMap(), _TransactionBody_update = new WeakMap(), _TransactionBody_auxiliaryDataHash = new WeakMap(), _TransactionBody_validityStartInterval = new WeakMap(), _TransactionBody_mint = new WeakMap(), _TransactionBody_scriptDataHash = new WeakMap(), _TransactionBody_collateral = new WeakMap(), _TransactionBody_requiredSigners = new WeakMap(), _TransactionBody_networkId = new WeakMap(), _TransactionBody_collateralReturn = new WeakMap(), _TransactionBody_totalCollateral = new WeakMap(), _TransactionBody_referenceInputs = new WeakMap(), _TransactionBody_votingProcedures = new WeakMap(), _TransactionBody_proposalProcedures = new WeakMap(), _TransactionBody_currentTreasuryValue = new WeakMap(), _TransactionBody_donation = new WeakMap(), _TransactionBody_originalBytes = new WeakMap(), _TransactionBody_instances = new WeakSet(), _TransactionBody_getMapSize = function _TransactionBody_getMapSize() {
    let mapSize = 0;
    if (__classPrivateFieldGet(this, _TransactionBody_inputs, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_inputs, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_outputs, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_fee, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_ttl, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_certs, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_certs, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_withdrawals, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_withdrawals, "f").size > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_update, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_auxiliaryDataHash, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_validityStartInterval, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_mint, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_mint, "f").size > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_scriptDataHash, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_collateral, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_collateral, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_requiredSigners, "f")?.values() !== undefined && __classPrivateFieldGet(this, _TransactionBody_requiredSigners, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_networkId, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_collateralReturn, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_totalCollateral, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_referenceInputs, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_votingProcedures, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f") !== undefined && __classPrivateFieldGet(this, _TransactionBody_proposalProcedures, "f").size() > 0)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_currentTreasuryValue, "f") !== undefined)
        ++mapSize;
    if (__classPrivateFieldGet(this, _TransactionBody_donation, "f") !== undefined)
        ++mapSize;
    return mapSize;
};
