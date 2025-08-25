import * as bip39 from '@scure/bip39';
import * as C from '@cardano-sdk/core';
import { Cardano } from '@cardano-sdk/core';
import * as _cardano_sdk_util from '@cardano-sdk/util';
import * as Crypto from '@cardano-sdk/crypto';
import { Exact } from '@blaze-cardano/data';
import { HexBlob } from '@cardano-sdk/util';
import { OpaqueString } from '@cardano-sdk/util';
import * as Schema from '@cardano-ogmios/schema';
import { TArray } from '@blaze-cardano/data';
import { typedHex } from '@cardano-sdk/util';
import { Unwrapped } from '@blaze-cardano/ogmios';
import { wordlist } from '@scure/bip39/wordlists/english';

declare const Address: typeof C.Cardano.Address;

declare type Address = C.Cardano.Address;

/**
 * Function to create an Address from a Bech32 string.
 * @param {string} bech32 - The Bech32 string to create the Address from.
 * @returns {Address} The created Address.
 */
declare const addressFromBech32: typeof C.Cardano.Address.fromBech32;

/**
 * Function to create an Address from a credential.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Credential} credential - The credential to create the Address from.
 * @returns {Address} The created Address.
 */
declare const addressFromCredential: (network: NetworkId, credential: Credential) => Address;

/**
 * Function to create an Address from payment and optional delegation credentials.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Credential} paymentCredential - The payment credential to create the Address from.
 * @param {Credential} [delegationCredential] - The optional delegation credential to create the Address from.
 * @returns {Address} The created Address.
 */
declare const addressFromCredentials: (network: NetworkId, paymentCredential: Credential, delegationCredential?: Credential) => Address;

/**
 * Function to create an Address from a validator script.
 * @param {NetworkId} network - The network ID of the Address.
 * @param {Script} validator - The validator script to create the Address from.
 * @returns {Address} The created Address.
 */
declare const addressFromValidator: (network: NetworkId, validator: Script) => Address;

declare const AddressType: typeof C.Cardano.AddressType;

declare type AddressType = C.Cardano.AddressType;

/**
 * Applies parameters to a UPLC program encoded as a hex blob.
 *
 * This function takes a hex-encoded UPLC program and applies one or more
 * Plutus data parameters to it. It does this by decoding the program,
 * modifying its AST to apply the parameters, and then re-encoding it.
 *
 * @param hex - The hex-encoded UPLC program.
 * @param params - The Plutus data parameters to apply to the program.
 * @returns A new hex-encoded UPLC program with the parameters applied.
 */
export declare function applyParams(hex: HexBlob, ...params: PlutusData[]): HexBlob;

/**
 * Applies the given Plutus data parameters to a hex-encoded Plutus script.
 *
 * This function decodes the provided Plutus script, applies the given parameters
 * to it, and then re-encodes the script. The parameters are cast to the specified
 * type and converted to a list of PlutusData before being applied.
 *
 * @template T - The type of the parameters list.
 * @param {HexBlob} plutusScript - The hex-encoded Plutus script to which the parameters will be applied.
 * @param {Exact<T>} params - The parameters to apply to the Plutus script.
 * @param {T} type - The type of the parameters list.
 * @returns {HexBlob} - A new hex-encoded Plutus script with the parameters applied.
 */
export declare function applyParamsToScript<T extends TArray>(plutusScript: string, type: T, params: Exact<T>): HexBlob;

/**
 * Asserts that the given address is a valid lock address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is not a script hash.
 */
export declare const assertLockAddress: (address: Address) => never | void;

/**
 * Asserts that the given address is a valid payment address.
 *
 * @param {Address} address - The address to be checked.
 * @throws {Error} If the address has no payment part or if the payment credential is a script hash.
 */
export declare const assertPaymentsAddress: (address: Address) => never | void;

/**
 * Utility function to test the validity of a TransactionOutput.
 *
 * @param {TransactionOutput} output The TransactionOutput to test.
 * @param {number} coinsPerUtxoByte From the environment's protocol params.
 * @param {number} maxValueSize From the environment's protocl params.
 * @throws If the output does not satisfy the minAda required, or the output is larger than the maxValueSize, it will throw an error.
 */
export declare const assertValidOutput: (output: TransactionOutput, coinsPerUtxoByte: number, maxValueSize: number) => void | never;

declare const AssetId: {
    (value: string): C.Cardano.AssetId;
    getPolicyId(id: C.Cardano.AssetId): C.Cardano.PolicyId;
    getAssetName(id: C.Cardano.AssetId): C.Cardano.AssetName;
    fromParts(policyId: C.Cardano.PolicyId, assetName: C.Cardano.AssetName): C.Cardano.AssetId;
};

declare type AssetId = C.Cardano.AssetId;

declare const AssetName: {
    (value: string): C.Cardano.AssetName;
    toUTF8(assetName: C.Cardano.AssetName, stripInvisibleCharacters?: boolean): string;
};

declare type AssetName = C.Cardano.AssetName;

declare const AuxiliaryData: typeof C.Serialization.AuxiliaryData;

declare type AuxiliaryData = C.Serialization.AuxiliaryData;

/**
 * Returns the maximum of two BigInt values.
 * @param {bigint} a - The first bigint value.
 * @param {bigint} b - The second bigint value.
 * @returns {bigint} The maximum value.
 */
export declare const bigintMax: (a: bigint, b: bigint) => bigint;

declare const Bip32PrivateKey: typeof Crypto.Bip32PrivateKey;

declare type Bip32PrivateKey = Crypto.Bip32PrivateKey;

declare type Bip32PrivateKeyHex = OpaqueString<"Bip32PrivateKeyHex">;

declare const Bip32PrivateKeyHex: (value: string) => Bip32PrivateKeyHex;

declare const Bip32PublicKey: typeof Crypto.Bip32PublicKey;

declare type Bip32PublicKey = Crypto.Bip32PublicKey;

declare type Bit = 0 | 1;

/**
 * Function to compute the BLAKE2b-224 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash28ByteBase16 format.
 */
declare function blake2b_224(data: HexBlob): Hash28ByteBase16;

/**
 * Function to compute the BLAKE2b-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
declare function blake2b_256(data: HexBlob): Hash32ByteBase16;

/**
 * The Blaze class is used to create and manage Cardano transactions.
 * It requires a provider and a wallet to interact with the blockchain and manage funds.
 */
export declare class Blaze<ProviderType extends Provider, WalletType extends Wallet> {
    readonly provider: ProviderType;
    wallet: WalletType;
    readonly params: ProtocolParameters;
    /**
     * Constructs a new instance of the Blaze class.
     * @param {ProviderType} provider - The provider to use for interacting with the blockchain.
     * @param {WalletType} wallet - The wallet to use for managing funds and signing transactions.
     * @private
     */
    private constructor();
    static from<ProviderType extends Provider, WalletType extends Wallet>(provider: ProviderType, wallet: WalletType): Promise<Blaze<ProviderType, WalletType>>;
    /**
     * Creates a new transaction using the provider and wallet.
     * @returns {TxBuilder} - The newly created transaction builder.
     */
    newTransaction(): TxBuilder;
    /**
     * Signs a transaction using the wallet.
     * @param {Transaction} tx - The transaction to sign.
     * @returns {Promise<Transaction>} - The signed transaction.
     */
    signTransaction(tx: Transaction): Promise<Transaction>;
    /**
     * Submits a transaction to the blockchain.
     * @param {Transaction} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The transaction ID.
     * @throws {Error} If the transaction submission fails.
     * @description This method sends the provided transaction to the blockchain network
     * using the configured wallet, or the configured provider if set.
     */
    submitTransaction(tx: Transaction, useProvider?: boolean): Promise<TransactionId>;
}

export declare class Blockfrost extends Provider {
    url: string;
    private projectId;
    private scriptCache;
    withScriptRefCaching: boolean;
    constructor({ network, projectId, withScriptRefCaching, }: {
        network: NetworkName;
        projectId: string;
        withScriptRefCaching?: boolean;
    });
    headers(): {
        project_id: string;
    };
    /**
     * This method fetches the protocol parameters from the Blockfrost API.
     * It constructs the query URL, sends a GET request with the appropriate headers, and processes the response.
     * The response is parsed into a ProtocolParameters object, which is then returned.
     * If the response is not in the expected format, an error is thrown.
     * @returns A Promise that resolves to a ProtocolParameters object.
     */
    getParameters(): Promise<ProtocolParameters>;
    /**
     * This method fetches the UTxOs under a given address.
     * The response is parsed into a TransactionUnspentOutput[] type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param address - The Address or Payment Credential
     * @returns A Promise that resolves to TransactionUnspentOutput[].
     */
    getUnspentOutputs(address: Address | Credential, filter?: (utxo: BlockfrostUTxO) => boolean): Promise<TransactionUnspentOutput[]>;
    /**
     * This method fetches the UTxOs under a given address that hold
     * a particular asset.
     * The response is parsed into a TransactionUnspentOutput[] type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param address - Address or Payment Credential.
     * @param unit - The AssetId
     * @returns A Promise that resolves to TransactionUnspentOutput[].
     */
    getUnspentOutputsWithAsset(address: Address | Credential, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    /**
     * This method fetches the UTxO that holds a particular NFT given as
     * argument.
     * The response is parsed into a TransactionUnspentOutput type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param nft - The AssetId for the NFT
     * @returns A Promise that resolves to TransactionUnspentOutput.
     */
    getUnspentOutputByNFT(nft: AssetId): Promise<TransactionUnspentOutput>;
    /**
     * This method resolves transaction outputs from a list of transaction
     * inputs given as argument.
     * The response is parsed into a TransactionUnspentOutput[] type, which is
     * then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param txIns - A list of TransactionInput
     * @returns A Promise that resolves to TransactionUnspentOutput[].
     */
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    /**
     * This method returns the datum for the datum hash given as argument.
     * The response is parsed into a PlutusData type, which is then returned.
     * If the response is not in the expected format, an error is thrown.
     * @param datumHash - The hash of a datum
     * @returns A Promise that resolves to PlutusData
     */
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    /**
     * This method awaits confirmation of the transaction given as argument.
     * The response is parsed into a boolean, which is then returned.
     * If tx is not confirmed at first and no value for timeout is provided,
     * then false is returned.
     * If tx is not confirmed at first and a value for timeout (in ms) is given,
     * then subsequent checks will be performed at a 20 second interval until
     * timeout is reached.
     * @param txId - The hash of a transaction
     * @param timeout - An optional timeout for waiting for confirmation. This
     * value should be greater than average block time of 20000 ms
     * @returns A Promise that resolves to a boolean
     */
    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    /**
     * This method submits a transaction to the chain.
     * @param tx - The Transaction
     * @returns A Promise that resolves to a TransactionId type
     */
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    /**
     * This method evaluates how much execution units a transaction requires.
     * Optionally, additional outputs can be provided. These are added to the
     * evaluation without checking for their presence on-chain. This is useful
     * when performing transaction chaining, where some outputs used as inputs
     * to a transaction will have not yet been submitted to the network.
     * @param tx - The Transaction
     * @param additionalUtxos - Optional utxos to be added to the evaluation.
     * @returns A Promise that resolves to a Redeemers type
     */
    evaluateTransaction(tx: Transaction, additionalUtxos?: TransactionUnspentOutput[]): Promise<Redeemers>;
    private getScriptRef;
    resolveScriptRef(script: Script | Hash28ByteBase16, address?: Address): Promise<TransactionUnspentOutput | undefined>;
    private buildTransactionUnspentOutput;
}

declare type BlockfrostLanguageVersions = "PlutusV1" | "PlutusV2" | "PlutusV3";

export declare interface BlockfrostProtocolParametersResponse {
    epoch: number;
    min_fee_a: number;
    min_fee_b: number;
    max_block_size: number;
    max_tx_size: number;
    max_block_header_size: number;
    key_deposit: number;
    pool_deposit: number;
    e_max: number;
    n_opt: number;
    a0: string;
    rho: string;
    tau: string;
    decentralisation_param: number;
    extra_entropy: null;
    protocol_major_ver: number;
    protocol_minor_ver: number;
    min_utxo: string;
    min_pool_cost: number;
    nonce: string;
    cost_models: Record<BlockfrostLanguageVersions, {
        [key: string]: number;
    }>;
    cost_models_raw: Record<BlockfrostLanguageVersions, number[]>;
    price_mem: string;
    price_step: string;
    max_tx_ex_mem: number;
    max_tx_ex_steps: number;
    max_block_ex_mem: number;
    max_block_ex_steps: number;
    max_val_size: number;
    collateral_percent: number;
    max_collateral_inputs: number;
    coins_per_utxo_size: number;
    min_fee_ref_script_cost_per_byte?: number;
}

declare interface BlockfrostUTxO {
    address: string;
    tx_hash: string;
    output_index: number;
    amount: {
        unit: string;
        quantity: string;
    }[];
    block: string;
    data_hash?: string;
    inline_datum?: string;
    reference_script_hash?: string;
}

declare type BuiltinFunction = (typeof BuiltinFunctions)[number];

declare const BuiltinFunctions: readonly ["addInteger", "subtractInteger", "multiplyInteger", "divideInteger", "quotientInteger", "remainderInteger", "modInteger", "equalsInteger", "lessThanInteger", "lessThanEqualsInteger", "appendByteString", "consByteString", "sliceByteString", "lengthOfByteString", "indexByteString", "equalsByteString", "lessThanByteString", "lessThanEqualsByteString", "sha2_256", "sha3_256", "blake2b_256", "verifyEd25519Signature", "appendString", "equalsString", "encodeUtf8", "decodeUtf8", "ifThenElse", "chooseUnit", "trace", "fstPair", "sndPair", "chooseList", "mkCons", "headList", "tailList", "nullList", "chooseData", "constrData", "mapData", "listData", "iData", "bData", "unConstrData", "unMapData", "unListData", "unIData", "unBData", "equalsData", "mkPairData", "mkNilData", "mkNilPairData", "serialiseData", "verifyEcdsaSecp256k1Signature", "verifySchnorrSecp256k1Signature"];

declare type BuiltinFunctions = typeof BuiltinFunctions;

declare type Byte = number & {
    __opaqueNumber: "Byte";
};

declare const Byte: (number: number) => Byte;

/**
 * This methods calculates the minimum ada required for a transaction output.
 * @param {TransactionOutput} output - The transaction output to calculate the minimum ada for.
 * @param {number} coinsPerUtxoByte - The coinsPerUtxoByte value from the protocol parameters.
 * @returns {bigint} The minimum ada required for the output.
 */
export declare function calculateMinAda(output: TransactionOutput, coinsPerUtxoByte: number): bigint;

/**
 * Calculates the fee for reference scripts in the transaction.
 * This method iterates through the reference inputs, finds the corresponding UTXOs,
 * and calculates the fee based on the size of the Plutus scripts referenced.
 *
 * The fee calculation follows a tiered approach where the base fee increases
 * for each range of script size, as defined in the protocol parameters.
 * See https://github.com/CardanoSolutions/ogmios/releases/tag/v6.5.0
 *
 * @param {readonly TransactionInput[]} refScripts - An array of reference inputs in the transaction.
 * @returns {number} The calculated fee for all reference scripts.
 * @throws {Error} If a reference input cannot be resolved or if a reference script is not a Plutus script.
 */
export declare function calculateReferenceScriptFee(refScripts: Script[], params: ProtocolParameters): number;

/**
 * Calculate the required "collateral" the a transaction must put up if it is running smart contracts.
 * This is to prevent DDOS attacks with failing scripts, and must be some percentage above the total fee of the script.
 *
 * @param {bigint} fee The full transaction fee
 * @param {number} collateralPercentage The protocol parameter defining the buffer above the fee that is required
 * @returns {bigint}
 */
export declare function calculateRequiredCollateral(fee: bigint, collateralPercentage: number): bigint;

declare const CborReader: typeof C.Serialization.CborReader;

declare type CborReader = C.Serialization.CborReader;

declare const CborReaderState: typeof C.Serialization.CborReaderState;

declare type CborReaderState = C.Serialization.CborReaderState;

/**
 * Interface for objects that can be serialized to CBOR.
 */
declare interface CborSerializable<C> {
    /**
     * Function to serialize the object to CBOR.
     * @returns {HexBlob} The serialized object.
     */
    toCbor(): HexBlob;
    /**
     * Function to convert the object to its core representation.
     * @returns {C} The core representation of the object.
     */
    toCore(): C;
}

/**
 * Exporting CborSet from C.Serialization.
 */
declare const CborSet: typeof C.Serialization.CborSet;

/**
 * Type definition for CborSet.
 */
declare type CborSet<A, B extends CborSerializable<A>> = C.Serialization.CborSet<A, B>;

/**
 * Converts the compiled code of a UPLC program into a Script based on the specified script type, handling possible double-CBOR encoding.
 *
 * @param {HexBlob} cbor - The script, possibly double-CBOR-encoded.
 * @param {ScriptType} type - The type of the script (Native, PlutusV1, or PlutusV2).
 * @returns {Script} - The Script created from the hex blob.
 * @throws {Error} - Throws an error if the script type is unsupported.
 */
export declare function cborToScript(cbor: string, type: ScriptType): Script;

declare const CborWriter: typeof C.Serialization.CborWriter;

declare type CborWriter = C.Serialization.CborWriter;

declare const Certificate: typeof C.Serialization.Certificate;

declare type Certificate = C.Serialization.Certificate;

declare const CertificateType: typeof C.Cardano.CertificateType;

declare type CertificateType = C.Cardano.CertificateType;

export declare interface CIP30DataSignature {
    key: CoseKeyCborHex;
    signature: CoseSign1CborHex;
}

/**
 * CIP-30 Wallet interface.
 */
export declare interface CIP30Interface {
    /**
     * Retrieves the network ID of the currently connected account.
     *
     * @returns {Promise<number>} - The network ID of the currently connected account.
     */
    getNetworkId(): Promise<number>;
    /**
     * Retrieves the unspent transaction outputs (UTXOs) controlled by the wallet.
     *
     * @returns {Promise<string[] | undefined>} - The UTXOs controlled by the wallet.
     */
    getUtxos(): Promise<string[] | undefined>;
    /**
     * Retrieves the total available balance of the wallet, encoded in CBOR.
     *
     * @returns {Promise<string>} - The balance of the wallet.
     */
    getBalance(): Promise<string>;
    /**
     * Retrieves all used addresses controlled by the wallet.
     *
     * @returns {Promise<string[]>} - The used addresses controlled by the wallet.
     */
    getUsedAddresses(): Promise<string[]>;
    /**
     * Retrieves all unused addresses controlled by the wallet.
     *
     * @returns {Promise<string[]>} - The unused addresses controlled by the wallet.
     */
    getUnusedAddresses(): Promise<string[]>;
    /**
     * Retrieves an address owned by the wallet which should be used to return transaction change.
     *
     * @returns {Promise<string>} - The change address.
     */
    getChangeAddress(): Promise<string>;
    /**
     * Retrieves all reward addresses owned by the wallet.
     *
     * @returns {Promise<string[]>} - The reward addresses owned by the wallet.
     */
    getRewardAddresses(): Promise<string[]>;
    /**
     * Requests a user's signature for the unsigned portions of a transaction.
     *
     * @param tx - The transaction CBOR to sign
     * @param partialSign - Whether a partial signature is permitted. If true, the wallet signs what it can. If false, the wallet must sign the full transaction.
     * @returns {Promise<string>} - The signed transaction's witness set, CBOR-encoded.
     */
    signTx(tx: string, partialSign: boolean): Promise<string>;
    /**
     * Request's a user's signature for a given payload conforming to the [CIP-0008 signing spec](https://github.com/cardano-foundation/CIPs/blob/master/CIP-0008/README.md)
     *
     * @param address - The address to sign the payload with. The payment key is used for base, enterprise, and pointer addresses. The staking key is used for reward addresses.
     * @param payload - The payload to sign.
     * @returns {Promise<{ signature: string; key: string }>} - The hex-encoded CBOR bytes of the signature and public key parts of the signing-key.
     */
    signData(address: string, payload: string): Promise<{
        signature: string;
        key: string;
    }>;
    /**
     * Submits a signed transaction to the network.
     *
     * @param tx - The hex-encoded CBOR bytes of the transaction to submit.
     * @returns {Promise<string>} - The transaction ID of the submitted transaction.
     */
    submitTx(tx: string): Promise<string>;
    /**
     * Retrieves all collateral UTXOs owned by the wallet.
     *
     * @returns {Promise<string[]>} - The hex-encoded CBOR bytes of the collateral UTXOs owned by the wallet.
     */
    getCollateral(): Promise<string[]>;
}

export declare namespace CoinSelector {
        { index_hvfSelector as hvfSelector, index_micahsSelector as micahsSelector };
}

/**
 * Wallet class that interacts with the ColdWallet.
 */
export declare class ColdWallet implements Wallet {
    private provider;
    readonly address: Address;
    readonly networkId: NetworkId;
    /**
     * Constructs a new instance of the ColdWallet class.
     * @param {Address} address - The address of the wallet.
     * @param {NetworkId} networkId - The network ID of the wallet.
     * @param {Provider} provider - The provider of the wallet.
     */
    constructor(address: Address, networkId: NetworkId, provider: Provider);
    /**
     * Retrieves the network ID of the currently connected account.
     * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
     */
    getNetworkId(): Promise<NetworkId>;
    /**
     * Retrieves the UTxO(s) controlled by the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
     */
    getUnspentOutputs(): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the total available balance of the wallet, encoded in CBOR.
     * @returns {Promise<Value>} - The balance of the wallet.
     */
    getBalance(): Promise<Value_2>;
    /**
     * Retrieves all used addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
     */
    getUsedAddresses(): Promise<Address[]>;
    /**
     * Retrieves all unused addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
     */
    getUnusedAddresses(): Promise<Address[]>;
    /**
     * Retrieves an address owned by the wallet which should be used to return transaction change.
     * @returns {Promise<Address>} - The change address.
     */
    getChangeAddress(): Promise<Address>;
    /**
     * Retrieves the reward addresses controlled by the wallet.
     * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
     */
    getRewardAddresses(): Promise<RewardAddress[]>;
    /**
     * Requests a transaction signature from the wallet.
     * @param {string} tx - The transaction to sign.
     * @param {boolean} partialSign - Whether to partially sign the transaction.
     * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
     */
    signTransaction(_tx: Transaction, _partialSign?: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
     * @param {Address} address - The address to sign the data with.
     * @param {string} payload - The data to sign.
     * @returns {Promise<CIP30DataSignature>} - The signed data.
     */
    signData(_address: Address, _payload: string): Promise<CIP30DataSignature>;
    /**
     * Submits a transaction through the wallet.
     * @param {string} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
     */
    postTransaction(tx: Transaction): Promise<TransactionId>;
    /**
     * Retrieves the collateral UTxO(s) for the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
     */
    getCollateral(): Promise<TransactionUnspentOutput[]>;
}

/**
 * Calculates the correct script data hash for a transaction
 *
 * Separate from the `getScriptData` method in `TxBuilder` to allow for more thorough testing
 * This is heavily documented here:
 * https://github.com/IntersectMBO/cardano-ledger/blob/master/eras/conway/impl/cddl-files/conway.cddl#L423-L490
 *
 * @param redeemers - The redeemers of the transaction
 * @param datums - The datums in the witness set of the transaction
 * @param usedCostModels - The cost models for any languages used in the transaction
 */
export declare function computeScriptData(redeemers: Redeemers, datums: ReturnType<TransactionWitnessSet["plutusData"]>, // TODO: weird import shenanigans
usedCostModels: Costmdls): IScriptData | undefined;

declare const ConstrPlutusData: typeof C.Serialization.ConstrPlutusData;

declare type ConstrPlutusData = C.Serialization.ConstrPlutusData;

export declare namespace Core {
    export {
        HexBlob,
        OpaqueString,
        typedHex,
        wordlist,
        Address,
        AddressType,
        AssetId,
        AssetName,
        AuxiliaryData,
        Bip32PrivateKey,
        Bip32PrivateKeyHex,
        Bip32PublicKey,
        CborReader,
        CborReaderState,
        CborSet,
        CborWriter,
        Certificate,
        CertificateType,
        ConstrPlutusData,
        CostModel,
        CostModels,
        Costmdls,
        Credential,
        CredentialCore,
        CredentialType,
        Datum,
        DatumHash,
        DatumKind,
        Ed25519KeyHashHex,
        Ed25519PrivateExtendedKeyHex,
        Ed25519PrivateKey,
        Ed25519PrivateNormalKeyHex,
        Ed25519PublicKey,
        Ed25519PublicKeyHex,
        Ed25519Signature,
        Ed25519SignatureHex,
        Evaluator,
        ExUnits,
        Hash,
        Hash28ByteBase16,
        Hash32ByteBase16,
        HashAsPubKeyHex,
        Metadata,
        Metadatum,
        MetadatumList,
        MetadatumMap,
        MinFeeReferenceScripts,
        NativeScript,
        nativescript as NativeScripts,
        NetworkId,
        PaymentAddress,
        PlutusData,
        PlutusDataKind,
        PlutusLanguageVersion,
        PlutusList,
        PlutusMap,
        PlutusV1Script,
        PlutusV2Script,
        PlutusV3Script,
        PolicyId,
        PolicyIdToHash,
        PoolId,
        Prettier,
        ProtocolParameters,
        Redeemer,
        RedeemerPurpose,
        RedeemerTag,
        Redeemers,
        RewardAccount,
        RewardAddress,
        SLOT_CONFIG_NETWORK,
        Script,
        ScriptAll,
        ScriptAny,
        ScriptHash,
        ScriptNOfK,
        ScriptPubkey,
        SelectionPhase,
        Slot,
        SlotConfig,
        StakeDelegation,
        StakeDelegationCertificate,
        StakeDeregistration,
        StakeRegistration,
        TimelockExpiry,
        TimelockStart,
        TokenMap,
        Transaction,
        TransactionBody,
        TransactionId,
        TransactionInput,
        TransactionInputSet,
        TransactionMetadatumKind,
        TransactionOutput,
        TransactionUnspentOutput,
        TransactionWitnessPlutusData,
        TransactionWitnessSet,
        TxCBOR,
        UTxOSelectionError,
        Value_2 as Value,
        VkeyWitness,
        addressFromBech32,
        addressFromCredential,
        addressFromCredentials,
        addressFromValidator,
        blake2b_224,
        blake2b_256,
        derivePublicKey,
        entropyToMnemonic,
        fromHex,
        generateMnemonic,
        getBurnAddress,
        getPaymentAddress,
        hardCodedProtocolParams,
        mnemonicToEntropy,
        prettify,
        setInConwayEra,
        sha2_256,
        sha3_256,
        signMessage,
        toHex
    }
}

declare type CoseKeyCborHex = HexBlob;

declare type CoseSign1CborHex = HexBlob;

declare const Costmdls: typeof C.Serialization.Costmdls;

declare type Costmdls = C.Serialization.Costmdls;

declare const CostModel: typeof C.Serialization.CostModel;

declare type CostModel = C.Serialization.CostModel;

declare type CostModels = C.Cardano.CostModels;

declare const Credential: typeof C.Serialization.Credential;

declare type Credential = C.Serialization.Credential;

declare type CredentialCore = C.Cardano.Credential;

declare const CredentialType: typeof C.Cardano.CredentialType;

declare type CredentialType = C.Cardano.CredentialType;

declare type Data = ReturnType<PlutusData["toCore"]>;

declare const DataType: Record<Byte, DataType>;

declare type DataType = "Integer" | "ByteString" | "String" | "Unit" | "Bool" | "Data" | {
    pair: [DataType, DataType];
} | {
    list: DataType;
};

declare const Datum: typeof C.Serialization.Datum;

declare type Datum = PlutusData | DatumHash;

declare const DatumHash: {
    (value: string): Crypto.Hash32ByteBase16;
    fromHexBlob<T>(value: _cardano_sdk_util.HexBlob): T;
};

declare type DatumHash = Crypto.Hash32ByteBase16;

declare const DatumKind: typeof C.Serialization.DatumKind;

/**
 * Function to derive the public key from a private key.
 * @param {Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex} privateKey - The private key to derive the public key from.
 * @returns {Ed25519PublicKeyHex} The derived public key.
 */
declare function derivePublicKey(privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex): Ed25519PublicKeyHex;

declare const Ed25519KeyHashHex: (value: string) => Crypto.Ed25519KeyHashHex;

declare type Ed25519KeyHashHex = Crypto.Ed25519KeyHashHex;

declare type Ed25519PrivateExtendedKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;

declare const Ed25519PrivateExtendedKeyHex: (value: string) => Ed25519PrivateExtendedKeyHex;

declare const Ed25519PrivateKey: typeof Crypto.Ed25519PrivateKey;

declare type Ed25519PrivateKey = Crypto.Ed25519PrivateKey;

declare type Ed25519PrivateNormalKeyHex = OpaqueString<"Ed25519PrivateKeyHex">;

declare const Ed25519PrivateNormalKeyHex: (value: string) => Ed25519PrivateNormalKeyHex;

declare const Ed25519PublicKey: typeof Crypto.Ed25519PublicKey;

declare type Ed25519PublicKey = Crypto.Ed25519PublicKey;

declare const Ed25519PublicKeyHex: (value: string) => Crypto.Ed25519PublicKeyHex;

declare type Ed25519PublicKeyHex = Crypto.Ed25519PublicKeyHex;

declare const Ed25519Signature: typeof Crypto.Ed25519Signature;

declare type Ed25519Signature = Crypto.Ed25519Signature;

declare const Ed25519SignatureHex: (value: string) => Crypto.Ed25519SignatureHex;

declare type Ed25519SignatureHex = Crypto.Ed25519SignatureHex;

declare class Encoder {
    private buffer;
    private currentByte;
    private bitIndex;
    pushBit(bit: 0 | 1): void;
    pushBits(value: number, numBits: number): void;
    pushByte(byte: number): void;
    pad(): void;
    getBytes(): Uint8Array;
}

/**
 * Function to convert entropy to a mnemonic.
 * @param {Buffer} entropy - The entropy to convert.
 * @returns {string} The generated mnemonic.
 */
declare const entropyToMnemonic: typeof bip39.entropyToMnemonic;

declare type Evaluator = (tx: Transaction, additionalUtxos: TransactionUnspentOutput[]) => Promise<Redeemers>;

declare type ExUnits = C.Serialization.ExUnits;

declare const ExUnits: typeof C.Serialization.ExUnits;

export declare const fromBlockfrostLanguageVersion: (x: BlockfrostLanguageVersions) => PlutusLanguageVersion;

/**
 * Converts a hex string to a byte array.
 * @param {string} hexString - The hex string to convert.
 * @returns {Uint8Array} The resulting byte array.
 */
declare function fromHex(hexString: string): Uint8Array;

/**
 * Function to generate a mnemonic.
 * @returns {string} The generated mnemonic.
 */
declare const generateMnemonic: typeof bip39.generateMnemonic;

/**
 * Computes the hash of the auxiliary data if it exists.
 *
 * @param {AuxiliaryData} data - The auxiliary data to hash.
 * @returns {Hash32ByteBase16} The hash of the auxiliary data or undefined if no auxiliary data is provided.
 */
export declare const getAuxiliaryDataHash: (data: AuxiliaryData) => Hash32ByteBase16;

declare const getBurnAddress: (network: NetworkId) => C.Cardano.Address;

/**
 * Converts an Address to a PaymentAddress.
 * @param {Address} address - The address to be converted.
 * @returns {PaymentAddress} The converted address in PaymentAddress format.
 * @throws {Error} If a reward account is passed in.
 */
declare function getPaymentAddress(address: Address): PaymentAddress;

export declare function getScriptSize(script: Script): number;

/**
 * Hard coded protocol parameters for the Cardano ledger.
 * These parameters are used as default values in the absence of network-provided parameters.
 */
declare const hardCodedProtocolParams: ProtocolParameters;

declare const Hash: typeof C.Serialization.Hash;

declare type Hash<T extends string> = C.Serialization.Hash<T>;

declare const Hash28ByteBase16: {
    (value: string): Crypto.Hash28ByteBase16;
    fromEd25519KeyHashHex(value: Crypto.Ed25519KeyHashHex): Crypto.Hash28ByteBase16;
};

declare type Hash28ByteBase16 = Crypto.Hash28ByteBase16;

declare const Hash32ByteBase16: {
    (value: string): Crypto.Hash32ByteBase16;
    fromHexBlob<T>(value: _cardano_sdk_util.HexBlob): T;
};

declare type Hash32ByteBase16 = Crypto.Hash32ByteBase16;

/**
 * Converts a Hash28ByteBase16 to an Ed25519PublicKeyHex format.
 * @param {Hash28ByteBase16} hash - The hash to be converted.
 * @returns {Ed25519PublicKeyHex} The converted hash in Ed25519PublicKeyHex format.
 */
declare function HashAsPubKeyHex(hash: Hash28ByteBase16): Ed25519PublicKeyHex;

/**
 * Wallet class that interacts with the HotSingleWallet.
 * This is like HotWallet, but without key derivation.
 */
export declare class HotSingleWallet implements Wallet {
    private provider;
    private paymentSigningKey;
    private paymentPublicKey;
    private stakeSigningKey;
    private stakePublicKey;
    readonly address: Address;
    readonly networkId: NetworkId;
    /**
     * Constructs a new instance of the HotSingleWallet class.
     * @param {Ed25519PrivateNormalKeyHex} signingKey - The private signing key of the wallet.
     * @param {NetworkId} networkId - The network ID for the wallet.
     * @param {Provider} provider - The provider for the wallet.
     * @param {Ed25519PrivateNormalKeyHex} stakeSigningKey - An optional private signing key for the delegation part of the wallet. If not provided, the wallet will have an enterprise address.
     */
    constructor(paymentSigningKey: Ed25519PrivateNormalKeyHex, networkId: NetworkId, provider: Provider, stakeSigningKey?: Ed25519PrivateNormalKeyHex);
    /**
     * Retrieves the network ID of the currently connected account.
     * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
     */
    getNetworkId(): Promise<NetworkId>;
    /**
     * Retrieves the UTxO(s) controlled by the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
     */
    getUnspentOutputs(): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the total available balance of the wallet, encoded in CBOR.
     * @returns {Promise<Value>} - The balance of the wallet.
     */
    getBalance(): Promise<Value_2>;
    /**
     * Retrieves all used addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
     */
    getUsedAddresses(): Promise<Address[]>;
    /**
     * Retrieves all unused addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
     */
    getUnusedAddresses(): Promise<Address[]>;
    /**
     * Retrieves an address owned by the wallet which should be used to return transaction change.
     * @returns {Promise<Address>} - The change address.
     */
    getChangeAddress(): Promise<Address>;
    /**
     * Retrieves the reward addresses controlled by the wallet.
     * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
     */
    getRewardAddresses(): Promise<RewardAddress[]>;
    /**
     * Requests a transaction signature from the wallet.
     * @param {string} tx - The transaction to sign.
     * @param {boolean} partialSign - Whether to partially sign the transaction.
     * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
     */
    signTransaction(tx: Transaction, partialSign?: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
     * Not supported, will always throw an error.
     * @param {Address} address - The address to sign the data with.
     * @param {string} payload - The data to sign.
     * @returns {Promise<CIP30DataSignature>} - The signed data.
     */
    signData(address: Address, payload: string): Promise<CIP30DataSignature>;
    /**
     * Submits a transaction through the wallet.
     * @param {string} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
     */
    postTransaction(tx: Transaction): Promise<TransactionId>;
    /**
     * Retrieves the collateral UTxO(s) for the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
     */
    getCollateral(): Promise<TransactionUnspentOutput[]>;
}

/**
 * Wallet class that interacts with the HotWallet.
 */
export declare class HotWallet implements Wallet {
    private provider;
    private signingKey;
    private stakeSigningKey;
    private publicKey;
    readonly address: Address;
    readonly rewardAddress: RewardAddress | undefined;
    readonly networkId: NetworkId;
    /**
     * Constructs a new instance of the HotWallet class.
     * @param {Address} address - the wallets's address
     * @param {RewardAddress} rewardAddress - the wallet's reward address if there is any
     * @param {Bip32PrivateKey} signingKey - The signing key of the derived account's of wallet.
     * @param {Bip32PublicKey} publicKey - The public key of the derived account's of the wallet.
     * @param {Provider} provider - The provider of the wallet.
     */
    private constructor();
    private static harden;
    static generateAccountAddressFromMasterkey(masterkey: Bip32PrivateKey, networkId?: NetworkId, addressType?: AddressType): Promise<{
        address: Address;
        paymentKey: Bip32PrivateKey;
        stakePaymentKey: Bip32PrivateKey;
        publicKey: Bip32PublicKey;
    }>;
    static fromMasterkey(masterkey: Bip32PrivateKeyHex, provider: Provider, networkId?: NetworkId, addressType?: AddressType): Promise<HotWallet>;
    /**
     * Retrieves the network ID of the currently connected account.
     * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
     */
    getNetworkId(): Promise<NetworkId>;
    /**
     * Retrieves the UTxO(s) controlled by the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
     */
    getUnspentOutputs(): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the total available balance of the wallet, encoded in CBOR.
     * @returns {Promise<Value>} - The balance of the wallet.
     */
    getBalance(): Promise<Value_2>;
    /**
     * Retrieves all used addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
     */
    getUsedAddresses(): Promise<Address[]>;
    /**
     * Retrieves all unused addresses controlled by the wallet.
     * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
     */
    getUnusedAddresses(): Promise<Address[]>;
    /**
     * Retrieves an address owned by the wallet which should be used to return transaction change.
     * @returns {Promise<Address>} - The change address.
     */
    getChangeAddress(): Promise<Address>;
    /**
     * Retrieves the reward addresses controlled by the wallet.
     * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
     */
    getRewardAddresses(): Promise<RewardAddress[]>;
    /**
     * Requests a transaction signature from the wallet.
     * @param {string} tx - The transaction to sign.
     * @param {boolean} partialSign - Whether to partially sign the transaction.
     * @param {boolean} signWithStakeKey - Whether to also sign the transaction with the stake key.
     * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
     */
    signTransaction(tx: Transaction, partialSign?: boolean, signWithStakeKey?: boolean): Promise<TransactionWitnessSet>;
    /**
     * Requests signed data from the wallet.
     * @param {Address} address - The address to sign the data with.
     * @param {string} payload - The data to sign.
     * @returns {Promise<CIP30DataSignature>} - The signed data.
     */
    signData(address: Address, payload: string): Promise<CIP30DataSignature>;
    /**
     * Submits a transaction through the wallet.
     * @param {string} tx - The transaction to submit.
     * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
     */
    postTransaction(tx: Transaction): Promise<TransactionId>;
    /**
     * Retrieves the collateral UTxO(s) for the wallet.
     * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
     */
    getCollateral(): Promise<TransactionUnspentOutput[]>;
}

/**
 * Given an array and a string, it mutates the provided array and inserts
 * the string after the closest match. It returns the index at which the
 * string was inserted.
 *
 * @param {string[]} arr An array of strings to mutate.
 * @param {string} el The element to insert in provided array.
 * @returns {number} The index of the insert.
 */
export declare const insertSorted: (arr: string[], el: string) => number;

/**
 * The type interface for script data.
 */
declare interface IScriptData {
    redeemersEncoded: string;
    datumsEncoded: string | undefined;
    costModelsEncoded: string;
    hashedData: HexBlob;
    scriptDataHash: Hash32ByteBase16;
}

/**
 * Utility function to compare the equality of two inputs.
 * @param {TransactionInput} self
 * @param {TransactionInput} that
 * @returns {boolean}
 */
export declare const isEqualInput: (self: TransactionInput, that: TransactionInput) => boolean;

/**
 * Utility function to compare the equality of two outputs.
 * @param {TransactionOutput} self
 * @param {TransactionOutput} that
 * @returns {boolean}
 */
export declare const isEqualOutput: (self: TransactionOutput, that: TransactionOutput) => boolean;

/**
 * Utility function to compare the equality of two UTxOs.
 * @param {TransactionUnspentOutput} self
 * @param {TransactionUnspentOutput} that
 * @returns {boolean}
 */
export declare const isEqualUTxO: (self: TransactionUnspentOutput, that: TransactionUnspentOutput) => boolean;

export declare class Kupmios extends Provider {
    kupoUrl: string;
    ogmios: Unwrapped.Ogmios;
    static readonly plutusVersions: string[];
    static readonly confirmationTimeout: number;
    /**
     * Constructor to initialize Kupmios instance.
     * @param kupoUrl - URL of the Kupo service.
     * @param ogmiosUrl - URL of the Ogmios service.
     */
    constructor(kupoUrl: string, ogmios: Unwrapped.Ogmios);
    /**
     * Parses a fractional string into a number.
     * @param fraction - Fractional string in the format "numerator/denominator".
     * @returns The parsed fraction as a number.
     */
    private parseFraction;
    /**
     * Fetches unspent outputs using Kupo API.
     * @param prefix - Prefix for the URL.
     * @param postfix - Postfix for the URL.
     * @returns A promise that resolves to an array of fully resolved unspent outputs.
     */
    private _getUnspentOutputs;
    /**
     * Gets unspent outputs for a given address.
     * @param address - Address to fetch unspent outputs for.
     * @returns A promise that resolves to an array of unspent outputs.
     */
    getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>;
    /**
     * Gets unspent outputs containing a specific asset.
     * @param address - Address to fetch unspent outputs for.
     * @param unit - Asset ID to filter by.
     * @returns A promise that resolves to an array of unspent outputs.
     */
    getUnspentOutputsWithAsset(address: Address | null, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    /**
     * Gets an unspent output containing a specific NFT.
     * @param unit - Asset ID of the NFT.
     * @returns A promise that resolves to the unspent output.
     */
    getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    /**
     * Resolves unspent outputs for given transaction inputs.
     * @param txIns - Array of transaction inputs.
     * @returns A promise that resolves to an array of unspent outputs.
     */
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    /**
     * Gets the protocol parameters from the blockchain.
     * @returns A promise that resolves to the protocol parameters.
     */
    getParameters(): Promise<ProtocolParameters>;
    /**
     * Resolves the datum for a given datum hash.
     * @param datumHash - Hash of the datum to resolve.
     * @returns A promise that resolves to the Plutus data.
     */
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    /**
     * Awaits confirmation of a transaction.
     * @param txId - ID of the transaction to await confirmation for.
     * @param timeout - Optional timeout in milliseconds.
     * @returns A promise that resolves to a boolean indicating confirmation status.
     */
    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    /**
     * Posts a transaction to the blockchain.
     * @param tx - Transaction to post.
     * @returns A promise that resolves to the transaction ID.
     */
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    /**
     * Resolves the scripts for a given script hash.
     * @param scriptHash - Hash of the script to resolve.
     * @returns A promise that resolves to the JSON represenation of the scrip.
     * Note: we should reconsider creating a class for this as it could be expensive operation
     */
    private resolveScript;
    /**
     * Evaluates a transaction.
     * @param tx - Transaction to evaluate.
     * @param additionalUtxos - Additional UTXOs to consider.
     * @returns A promise that resolves to the redeemers.
     */
    evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
    /**
     * Serialize unspent outputs to JSON format.
     * @param unspentOutputs - Unspent outputs to serialize.
     * @returns the serialized unspent outputs.
     */
    static serializeUtxos(unspentOutputs: TransactionUnspentOutput[]): Schema.Utxo;
}

export declare class Maestro extends Provider {
    private url;
    private apiKey;
    constructor({ network, apiKey, }: {
        network: "mainnet" | "preview" | "preprod";
        apiKey: string;
    });
    private headers;
    /**
     * This method fetches the protocol parameters from the Maestro API.
     * It constructs the query URL, sends a GET request with the appropriate headers, and processes the response.
     * The response is parsed into a ProtocolParameters object, which is then returned.
     * If the response is not in the expected format, an error is thrown.
     * @returns A Promise that resolves to a ProtocolParameters object.
     */
    getParameters(): Promise<ProtocolParameters>;
    getUnspentOutputs(address: Address | Credential): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputsWithAsset(address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
}

/**
 * Creates a new Value object with the specified amount of lovelace and assets.
 *
 * @param {bigint} lovelace - The amount of lovelace.
 * @param {...[string, bigint][]} assets - The assets to include in the Value object.
 * @returns {Value} - The newly created Value object.
 */
export declare function makeValue(lovelace: bigint, ...assets: [string, bigint][]): Value_2;

declare const Metadata: typeof C.Serialization.GeneralTransactionMetadata;

declare type Metadata = C.Serialization.GeneralTransactionMetadata;

declare const Metadatum: typeof C.Serialization.TransactionMetadatum;

declare type Metadatum = C.Serialization.TransactionMetadatum;

declare const MetadatumList: typeof C.Serialization.MetadatumList;

declare type MetadatumList = C.Serialization.MetadatumList;

declare const MetadatumMap: typeof C.Serialization.MetadatumMap;

declare type MetadatumMap = C.Serialization.MetadatumMap;

declare interface MinFeeReferenceScripts {
    base: number;
    range: number;
    multiplier: number;
}

/**
 * Function to convert a mnemonic to entropy.
 * @param {string} mnemonic - The mnemonic to convert.
 * @returns {Buffer} The generated entropy.
 */
declare const mnemonicToEntropy: typeof bip39.mnemonicToEntropy;

/**
 * The namespace of the wallet.
 */
export declare type Namespace = "nami" | "eternl" | "flint" | "gerowallet" | "nufi" | "begin" | "lace" | "yoroi";

declare const NativeScript: typeof C.Serialization.NativeScript;

declare type NativeScript = C.Serialization.NativeScript;

declare namespace nativescript {
        { nativescript_address as address, nativescript_after as after, nativescript_allOf as allOf, nativescript_anyOf as anyOf, nativescript_atLeastNOfK as atLeastNOfK, nativescript_before as before, nativescript_justAddress as justAddress };
}

declare const NetworkId: typeof C.Cardano.NetworkId;

declare type NetworkId = C.Cardano.ChainId["networkId"];

export declare type NetworkName = "cardano-mainnet" | "cardano-preprod" | "cardano-preview" | "cardano-sanchonet" | "unknown";

declare type ParsedProgram = Program<bigint, BuiltinFunction>;

declare type ParsedTerm = Term<bigint, BuiltinFunction>;

declare class Parser {
    #private;
    constructor(bytes: Uint8Array);
    static fromHex(hex: string): Parser;
    popBit(): Bit;
    popBits(n: number): Byte;
    popByte(): Byte;
    takeBytes(n: number): Uint8Array;
    skipByte(): void;
}

declare const PaymentAddress: (value: string) => C.Cardano.PaymentAddress;

declare type PaymentAddress = C.Cardano.PaymentAddress;

declare const PlutusData: typeof C.Serialization.PlutusData;

declare type PlutusData = C.Serialization.PlutusData;

declare const PlutusDataKind: typeof C.Serialization.PlutusDataKind;

declare type PlutusDataKind = C.Serialization.PlutusDataKind;

declare const PlutusLanguageVersion: typeof C.Cardano.PlutusLanguageVersion;

declare type PlutusLanguageVersion = C.Cardano.PlutusLanguageVersion;

declare const PlutusList: typeof C.Serialization.PlutusList;

declare type PlutusList = C.Serialization.PlutusList;

declare const PlutusMap: typeof C.Serialization.PlutusMap;

declare type PlutusMap = C.Serialization.PlutusMap;

declare const PlutusV1Script: typeof C.Serialization.PlutusV1Script;

declare type PlutusV1Script = C.Serialization.PlutusV1Script;

declare const PlutusV2Script: typeof C.Serialization.PlutusV2Script;

declare type PlutusV2Script = C.Serialization.PlutusV2Script;

declare const PlutusV3Script: typeof C.Serialization.PlutusV3Script;

declare type PlutusV3Script = C.Serialization.PlutusV3Script;

declare const PolicyId: (value: string) => C.Cardano.PolicyId;

declare type PolicyId = C.Cardano.PolicyId;

/**
 * Converts a PolicyId to a Hash28ByteBase16 format.
 * @param {PolicyId} policy - The policy ID to be converted.
 * @returns {Hash28ByteBase16} The converted hash in Hash28ByteBase16 format.
 */
declare function PolicyIdToHash(policy: PolicyId): Hash28ByteBase16;

declare const PoolId: {
    (value: string): PoolId;
    fromKeyHash(value: Crypto.Ed25519KeyHashHex): PoolId;
    toKeyHash(poolId: PoolId): Crypto.Ed25519KeyHashHex;
};

declare type PoolId = OpaqueString<"PoolId">;

declare type Prettier = PlutusData | string | number | boolean | null;

declare function prettify(data: Prettier, indent?: string): string;

declare type Program<name, fun> = {
    version: SemVer;
    body: Term<name, fun>;
};

/**
 * Cardano ledger protocol parameters.
 */
declare interface ProtocolParameters {
    /** The number of coins per UTXO byte. */
    coinsPerUtxoByte: number;
    /** The maximum transaction size. */
    maxTxSize: number;
    /** The minimum fee coefficient. */
    minFeeCoefficient: number;
    /** The minimum fee constant. */
    minFeeConstant: number;
    /** The maximum block body size. */
    maxBlockBodySize: number;
    /** The maximum block header size. */
    maxBlockHeaderSize: number;
    /** The stake key deposit. */
    stakeKeyDeposit: number;
    /** The pool deposit. */
    poolDeposit: number | null;
    /** The pool retirement epoch bound. */
    poolRetirementEpochBound: number;
    /** The desired number of pools. */
    desiredNumberOfPools: number;
    /** The pool influence. */
    poolInfluence: string;
    /** The monetary expansion. */
    monetaryExpansion: string;
    /** The treasury expansion. */
    treasuryExpansion: string;
    /** The minimum pool cost. */
    minPoolCost: number;
    /** The protocol version. */
    protocolVersion: Cardano.ProtocolVersion;
    /** The maximum value size. */
    maxValueSize: number;
    /** The collateral percentage. */
    collateralPercentage: number;
    /** The maximum collateral inputs. */
    maxCollateralInputs: number;
    /** The cost models. */
    costModels: Cardano.CostModels;
    /** The prices. */
    prices: Cardano.Prices;
    /** The maximum execution units per transaction. */
    maxExecutionUnitsPerTransaction: Cardano.ExUnits;
    /** The maximum execution units per block. */
    maxExecutionUnitsPerBlock: Cardano.ExUnits;
    /** Params used for calculating the minimum fee from reference inputs (see https://github.com/CardanoSolutions/ogmios/releases/tag/v6.5.0) */
    minFeeReferenceScripts?: MinFeeReferenceScripts;
}

/**
 * Abstract class for the Provider.
 * This class provides an interface for interacting with the blockchain.
 */
export declare abstract class Provider {
    network: NetworkId;
    networkName: NetworkName;
    constructor(network: NetworkId, networkName: NetworkName);
    /**
     * Retrieves the parameters for a transaction.
     *
     * @returns {Promise<ProtocolParameters>} - The parameters for a transaction.
     */
    abstract getParameters(): Promise<ProtocolParameters>;
    /**
     * Retrieves the unspent outputs for a given address.
     *
     * @param {Address} address - The address to retrieve unspent outputs for.
     * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address.
     */
    abstract getUnspentOutputs(address: Address): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the unspent outputs for a given address and asset.
     *
     * @param {Address} address - The address to retrieve unspent outputs for.
     * @param {AssetId} unit - The asset to retrieve unspent outputs for.
     * @returns {Promise<TransactionUnspentOutput[]>} - The unspent outputs for the address and asset.
     */
    abstract getUnspentOutputsWithAsset(address: Address, unit: AssetId): Promise<TransactionUnspentOutput[]>;
    /**
     * Retrieves the unspent output for a given NFT.
     *
     * @param {AssetId} unit - The NFT to retrieve the unspent output for.
     * @returns {Promise<TransactionUnspentOutput>} - The unspent output for the NFT.
     */
    abstract getUnspentOutputByNFT(unit: AssetId): Promise<TransactionUnspentOutput>;
    /**
     * Resolves the unspent outputs for a given set of transaction inputs.
     *
     * @param {TransactionInput[]} txIns - The transaction inputs to resolve unspent outputs for.
     * @returns {Promise<TransactionUnspentOutput[]>} - The resolved unspent outputs.
     */
    abstract resolveUnspentOutputs(txIns: TransactionInput[]): Promise<TransactionUnspentOutput[]>;
    /**
     * Resolves the datum for a given datum hash.
     *
     * @param {DatumHash} datumHash - The datum hash to resolve the datum for.
     * @returns {Promise<PlutusData>} - The resolved datum.
     */
    abstract resolveDatum(datumHash: DatumHash): Promise<PlutusData>;
    /**
     * Waits for the confirmation of a given transaction.
     *
     * @param {TransactionId} txId - The transaction id to wait for confirmation.
     * @param {number} [timeout] - The timeout in milliseconds.
     * @returns {Promise<boolean>} - A boolean indicating whether the transaction is confirmed.
     */
    abstract awaitTransactionConfirmation(txId: TransactionId, timeout?: number): Promise<boolean>;
    /**
     * Posts a given transaction to the chain.
     *
     * @param {Transaction} tx - The transaction to post to the chain.
     * @returns {Promise<TransactionId>} - The id of the posted transaction.
     */
    abstract postTransactionToChain(tx: Transaction): Promise<TransactionId>;
    /**
     * Evaluates the transaction by calculating the exunits for each redeemer, applying them, and returning the redeemers.
     * This makes a remote call to the provider in most cases, however may use a virtual machine in some implementations.
     *
     * @param {Transaction} tx - The transaction to evaluate.
     * @param {TransactionUnspentOutput[]} additionalUtxos - The additional unspent outputs to consider.
     * @returns {Promise<Redeemers>} - The redeemers with applied exunits.
     */
    abstract evaluateTransaction(tx: Transaction, additionalUtxos: TransactionUnspentOutput[]): Promise<Redeemers>;
    /**
     * Resolves the script deployment by finding a UTxO containing the script reference.
     *
     * @param {Script | Hash28ByteBase16} script - The script or its hash to resolve.
     * @param {Address} [address] - The address to search for the script deployment. Defaults to a burn address.
     * @returns {Promise<TransactionUnspentOutput | undefined>} - The UTxO containing the script reference, or undefined if not found.
     *
     * @remarks
     * This is a default implementation that works but may not be optimal.
     * Subclasses of Provider should implement their own version for better performance.
     *
     * The method searches for a UTxO at the given address (or a burn address by default)
     * that contains a script reference matching the provided script or script hash.
     *
     * @example
     * ```typescript
     * const scriptUtxo = await provider.resolveScriptRef(myScript);
     * if (scriptUtxo) {
     *   console.log("Script found in UTxO:", scriptUtxo.input().toCore());
     * } else {
     *   console.log("Script not found");
     * }
     * ```
     */
    resolveScriptRef(script: Script | Hash28ByteBase16, address?: Address): Promise<TransactionUnspentOutput | undefined>;
    /**
     * Get the slot config, which describes how to translate between slots and unix timestamps
     * TODO: this is brittle; in theory this should work with the era histories; also, networkName is awkward
     */
    getSlotConfig(): SlotConfig;
    /**
     * Translate a unix millisecond timestamp to slot, according to the providers network
     * @param unix_millis Milliseconds since midnight, Jan 1 1970
     * @returns The slot in the relevant network
     */
    unixToSlot(unix_millis: bigint | number): Slot;
    /**
     * Translate a slot to a unix millisecond timestamp
     * @param slot The network slot
     * @returns The milliseconds since midnight, Jan 1 1970
     */
    slotToUnix(slot: Slot | number | bigint): number;
}

/**
 * Mapping of RedeemerPurpose to RedeemerTag.
 * Ensures consistency between purpose strings and tag numbers.
 */
export declare const purposeToTag: {
    [key: string]: number;
};

declare const Redeemer: typeof C.Serialization.Redeemer;

declare type Redeemer = C.Serialization.Redeemer;

declare const RedeemerPurpose: typeof C.Cardano.RedeemerPurpose;

declare type RedeemerPurpose = C.Cardano.RedeemerPurpose;

declare const Redeemers: typeof C.Serialization.Redeemers;

declare type Redeemers = C.Serialization.Redeemers;

declare const RedeemerTag: typeof C.Serialization.RedeemerTag;

declare type RedeemerTag = C.Serialization.RedeemerTag;

declare const RewardAccount: {
    (value: string): C.Cardano.RewardAccount;
    toHash(rewardAccount: C.Cardano.RewardAccount): Hash28ByteBase16;
    fromCredential(credential: C.Cardano.Credential, networkId: C.Cardano.NetworkId): C.Cardano.RewardAccount;
    toNetworkId(rewardAccount: C.Cardano.RewardAccount): C.Cardano.NetworkId;
};

declare type RewardAccount = OpaqueString<"RewardAccount">;

declare const RewardAddress: typeof C.Cardano.RewardAddress;

declare type RewardAddress = C.Cardano.RewardAddress;

declare const Script: typeof C.Serialization.Script;

declare type Script = C.Serialization.Script;

declare const ScriptAll: typeof C.Serialization.ScriptAll;

declare type ScriptAll = C.Serialization.ScriptAll;

declare const ScriptAny: typeof C.Serialization.ScriptAny;

declare type ScriptAny = C.Serialization.ScriptAny;

declare type ScriptHash = Crypto.Hash28ByteBase16;

declare const ScriptNOfK: typeof C.Serialization.ScriptNOfK;

declare type ScriptNOfK = C.Serialization.ScriptNOfK;

declare const ScriptPubkey: typeof C.Serialization.ScriptPubkey;

declare type ScriptPubkey = C.Serialization.ScriptPubkey;

export declare type ScriptType = "Native" | "PlutusV1" | "PlutusV2" | "PlutusV3";

declare type SelectionPhase = "wide" | "deep" | "final";

/**
 * The result of a coin selection operation.
 * It includes the selected inputs, the total value of the selected inputs, and the remaining inputs.
 */
declare type SelectionResult = {
    leftoverInputs: TransactionUnspentOutput[];
    selectedInputs: TransactionUnspentOutput[];
    selectedValue: Value_2;
};

declare type SemVer = `${number}.${number}.${number}`;

/**
 * Helper function to set the serialization era.
 */
declare const setInConwayEra: (value: boolean) => false;

/**
 * Function to compute the SHA2-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
declare function sha2_256(data: HexBlob): Hash32ByteBase16;

/**
 * Function to compute the SHA3-256 hash of a hex blob.
 * @param {HexBlob} _data - The hex blob to compute the hash of.
 * @returns {Hash32ByteBase16} The computed hash in Hash32ByteBase16 format.
 */
declare function sha3_256(data: HexBlob): Hash32ByteBase16;

/**
 * Function to sign a message with a private key.
 * @param {HexBlob} message - The message to sign.
 * @param {Ed25519PrivateNormalKeyHex} privateKey - The private key to sign the message with.
 * @returns {Ed25519SignatureHex} The signature of the message.
 */
declare function signMessage(message: HexBlob, privateKey: Ed25519PrivateNormalKeyHex | Ed25519PrivateExtendedKeyHex): Ed25519SignatureHex;

declare const Slot: (value: number) => C.Cardano.Slot;

declare type Slot = C.Cardano.Slot;

declare const SLOT_CONFIG_NETWORK: {
    Mainnet: {
        zeroTime: number;
        zeroSlot: number;
        slotLength: number;
    };
    Preview: {
        zeroTime: number;
        zeroSlot: number;
        slotLength: number;
    };
    Preprod: {
        zeroTime: number;
        zeroSlot: number;
        slotLength: number;
    };
};

/**
 * The SlotConfig interface defines the configuration for slots.
 * @interface SlotConfig
 * @property {number} zeroTime - The zero time for slot calculation.
 * @property {number} zeroSlot - The zero slot.
 * @property {number} slotLength - The slot length.
 */
declare interface SlotConfig {
    zeroTime: number;
    zeroSlot: number;
    slotLength: number;
}

/**
 * Sorts a list of UTxOs by highest total value first.
 * @param {TransactionUnspentOutput[]} inputs A list of UTxOs to sort.
 * @returns {TransactionUnspentOutput[]}
 */
export declare function sortLargestFirst(inputs: TransactionUnspentOutput[]): TransactionUnspentOutput[];

declare const StakeDelegation: typeof C.Serialization.StakeDelegation;

declare type StakeDelegation = C.Serialization.StakeDelegation;

declare type StakeDelegationCertificate = C.Cardano.StakeDelegationCertificate;

declare const StakeDeregistration: typeof C.Serialization.StakeDeregistration;

declare type StakeDeregistration = C.Serialization.StakeDeregistration;

declare const StakeRegistration: typeof C.Serialization.StakeRegistration;

declare type StakeRegistration = C.Serialization.StakeRegistration;

/**
 * Wraps JSON.stringify with a serializer for bigints.
 * @param {any} value The value you want to stringify.
 * @returns
 */
export declare const stringifyBigint: typeof JSON.stringify;

declare type Term<name, fun> = {
    type: TermNames["var"];
    name: name;
} | {
    type: TermNames["lam"];
    name: name;
    body: Term<name, fun>;
} | {
    type: TermNames["apply"];
    function: Term<name, fun>;
    argument: Term<name, fun>;
} | {
    type: TermNames["const"];
    valueType: DataType;
    value: Data;
} | {
    type: TermNames["builtin"];
    function: fun;
} | {
    type: TermNames["delay"];
    term: Term<name, fun>;
} | {
    type: TermNames["force"];
    term: Term<name, fun>;
} | {
    type: TermNames["constr"];
    tag: bigint;
    terms: Term<name, fun>[];
} | {
    type: TermNames["case"];
    term: Term<name, fun>;
    cases: Term<name, fun>[];
} | {
    type: TermNames["error"];
};

declare const TermNames: {
    readonly var: "Var";
    readonly lam: "Lambda";
    readonly apply: "Apply";
    readonly const: "Constant";
    readonly builtin: "Builtin";
    readonly delay: "Delay";
    readonly force: "Force";
    readonly constr: "Constr";
    readonly case: "Case";
    readonly error: "Error";
};

declare type TermNames = typeof TermNames;

declare const TimelockExpiry: typeof C.Serialization.TimelockExpiry;

declare type TimelockExpiry = C.Serialization.TimelockExpiry;

declare const TimelockStart: typeof C.Serialization.TimelockStart;

declare type TimelockStart = C.Serialization.TimelockStart;

/**
 * Converts a byte array to a hex string.
 * @param {Uint8Array} byteArray - The byte array to convert.
 * @returns {string} The resulting hex string.
 */
declare function toHex(byteArray: Uint8Array): string;

declare type TokenMap = C.Cardano.TokenMap;

declare const Transaction: typeof C.Serialization.Transaction;

declare type Transaction = C.Serialization.Transaction;

declare const TransactionBody: typeof C.Serialization.TransactionBody;

declare type TransactionBody = C.Serialization.TransactionBody;

declare const TransactionId: {
    (value: string): C.Cardano.TransactionId;
    fromHexBlob(value: _cardano_sdk_util.HexBlob): C.Cardano.TransactionId;
};

declare type TransactionId = C.Cardano.TransactionId;

declare const TransactionInput: typeof C.Serialization.TransactionInput;

declare type TransactionInput = C.Serialization.TransactionInput;

declare type TransactionInputSet = C.Serialization.CborSet<ReturnType<TransactionInput["toCore"]>, TransactionInput>;

declare const TransactionMetadatumKind: typeof C.Serialization.TransactionMetadatumKind;

declare type TransactionMetadatumKind = C.Serialization.TransactionMetadatumKind;

declare const TransactionOutput: typeof C.Serialization.TransactionOutput;

declare type TransactionOutput = C.Serialization.TransactionOutput;

declare const TransactionUnspentOutput: typeof C.Serialization.TransactionUnspentOutput;

declare type TransactionUnspentOutput = C.Serialization.TransactionUnspentOutput;

declare type TransactionWitnessPlutusData = Set<PlutusData>;

declare const TransactionWitnessSet: typeof C.Serialization.TransactionWitnessSet;

declare type TransactionWitnessSet = C.Serialization.TransactionWitnessSet;

/**
 * A builder class for constructing Cardano transactions with various components like inputs, outputs, and scripts.
 */
export declare class TxBuilder {
    private tracing;
    readonly params: ProtocolParameters;
    private preCompleteHooks;
    private body;
    private auxiliaryData?;
    private redeemers;
    private utxos;
    private utxoScope;
    private collateralUtxos;
    private scriptScope;
    private scriptSeen;
    private changeAddress?;
    private collateralChangeAddress?;
    private rewardAddress?;
    private networkId?;
    private changeOutputIndex?;
    private plutusData;
    private requiredWitnesses;
    private requiredNativeScripts;
    private requiredPlutusScripts;
    private usedLanguages;
    private extraneousDatums;
    private fee;
    private additionalSigners;
    private evaluator?;
    private consumedDelegationHashes;
    private consumedMintHashes;
    private consumedWithdrawalHashes;
    private consumedDeregisterHashes;
    private consumedSpendInputs;
    private minimumFee;
    private feePadding;
    private coinSelector;
    private _burnAddress?;
    /**
     * Constructs a new instance of the TxBuilder class.
     * Initializes a new transaction body with an empty set of inputs, outputs, and no fee.
     */
    constructor(params: ProtocolParameters, tracing?: boolean);
    /**
     * Returns the burn address.
     *
     * @returns {Address}
     */
    get burnAddress(): Address;
    /**
     * Returns the number of transaction outputs in the current transaction body.
     *
     * @returns {number} The number of transaction outputs.
     */
    get outputsCount(): number;
    /**
     * Internal tracing functiong to log.
     *
     * @param {string} msg Describe message.
     * @param {any[]} extra Extra variables you want to print in the trace message.
     */
    private trace;
    /**
     * Hook to allow an existing instance to turn on tracing.
     *
     * @param {boolean} enabled Whether to enable tracing.
     * @returns {TxBuilder}
     */
    enableTracing(enabled: boolean): TxBuilder;
    /**
     * Sets the change address for the transaction.
     * This address will receive any remaining funds not allocated to outputs or fees.
     *
     * @param {Address} address - The address to receive the change.
     * @param {boolean} [override=true] - Whether to override the change address if one is already set.
     * @returns {TxBuilder} The same transaction builder
     */
    setChangeAddress(address: Address, override?: boolean): TxBuilder;
    /**
     * Sets the collateral change address for the transaction.
     * This address will receive the collateral change if there is any.
     *
     * @param {Address} address - The address to receive the collateral change.
     * @returns {TxBuilder} The same transaction builder
     */
    setCollateralChangeAddress(address: Address): TxBuilder;
    /**
     * Sets the reward address for the transaction.
     * This address will be used for delegation purposes and also stake key component of the transaction.
     *
     * @param {Address} address - The reward address
     * @returns {TxBuilder} The same transaction builder
     */
    setRewardAddress(address: Address): TxBuilder;
    /**
     * Sets the evaluator for the transaction builder.
     * The evaluator is used to execute Plutus scripts during transaction building.
     *
     * @param {Evaluator} evaluator - The evaluator to be used for script execution.
     * @param {boolean} [override=true] - Whether to override the evaluator if one is already set.
     * @returns {TxBuilder} The same transaction builder
     */
    useEvaluator(evaluator: Evaluator, override?: boolean): TxBuilder;
    /**
     * Sets a custom coin selector function for the transaction builder.
     * This function will be used to select inputs during the transaction building process.
     *
     * @param {(inputs: TransactionUnspentOutput[], dearth: Value): SelectionResult} selector - The coin selector function to use.
         * @returns {TxBuilder} The same transaction builder
         */
     useCoinSelector(selector: (inputs: TransactionUnspentOutput[], dearth: Value_2) => SelectionResult): TxBuilder;
     /**
      * Sets the network ID for the transaction builder.
      * The network ID is used to determine which network the transaction is intended for.
      *
      * @param {NetworkId} networkId - The network ID to set.
      * @returns {TxBuilder} The same transaction builder
      */
     setNetworkId(networkId: NetworkId): TxBuilder;
     /**
      * The additional signers field is used to add additional signing counts for fee calculation.
      * These will be included in the signing phase at a later stage.
      * This is needed due to native scripts signees being non-deterministic.
      * @param {number} amount - The amount of additional signers
      * @returns {TxBuilder} The same transaction builder
      */
     addAdditionalSigners(amount: number): TxBuilder;
     /**
      * Sets the minimum fee for the transaction.
      * This fee will be used during the transaction building process.
      *
      * @param {bigint} fee - The minimum fee to be set.
      * @returns {TxBuilder} The same transaction builder
      */
     setMinimumFee(fee: bigint): TxBuilder;
     /**
      * Sets the donation to the treasury in lovelace
      *
      * @param {bigint} donation - The amount of lovelace to donate back to the treasury
      * @returns {TxBuilder} The same transaction builder
      */
     setDonation(donation: bigint): TxBuilder;
     /**
      * Sets an additional padding to add onto the transactions.
      * Use this only in emergencies, and please open a ticket at https://github.com/butaneprotocol/blaze-cardano so we can correct the fee calculation!
      *
      * @param {bigint} pad - The padding to add onto the transaction fee
      * @returns {TxBuilder} the same transaction builder
      */
     setFeePadding(pad: bigint): TxBuilder;
     /**
      * Adds a reference input to the transaction. Reference inputs are used to refer to outputs from previous transactions
      * without spending them, allowing scripts to read their data. This can be useful for various contract logic, such as
      * checking the state of a datum without consuming the UTxO that holds it.
      *
      * @param {TransactionUnspentOutput} utxo - The unspent transaction output to add as a reference input.
      * @returns {TxBuilder} The same transaction builder
      * @throws {Error} If the input to be added is already present in the list of reference inputs, to prevent duplicates.
      */
     addReferenceInput(utxo: TransactionUnspentOutput): TxBuilder;
     /**
      * Adds an input to the transaction. This method is responsible for including a new input, which represents
      * a reference to an unspent transaction output (UTxO) that will be consumed by the transaction. Optionally,
      * a redeemer and an unhashed datum can be provided for script validation purposes.
      *
      * @param {TransactionUnspentOutput} utxo - The UTxO to be consumed as an input.
      * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation, required for spending Plutus script-locked UTxOs.
      * @param {PlutusData} [unhashDatum] - Optional. The unhashed datum, required if the UTxO being spent includes a datum hash instead of inline datum.
      * @returns {TxBuilder} The same transaction builder
      * @throws {Error} If attempting to add a duplicate input, if the UTxO payment key is missing, if attempting to spend with a redeemer for a KeyHash credential,
      *                 if attempting to spend without a datum when required, or if providing both an inline datum and an unhashed datum.
      */
     addInput(utxo: TransactionUnspentOutput, redeemer?: PlutusData, unhashDatum?: PlutusData): TxBuilder;
     /**
      * Adds unspent transaction outputs (UTxOs) to the set of UTxOs available for this transaction.
      * These UTxOs can then be used for balancing the transaction, ensuring that inputs and outputs are equal.
      *
      * @param {TransactionUnspentOutput[]} utxos - The unspent transaction outputs to add.
      * @returns {TxBuilder} The same transaction builder
      */
     addUnspentOutputs(utxos: TransactionUnspentOutput[]): TxBuilder;
     /**
      * Adds unspent transaction outputs (UTxOs) to the set of collateral UTxOs available for this transaction.
      * These UTxOs can then be used to provide collateral for the transaction, if necessary. If provided, they will b
      * If there are specific, valid collateral UTxOs provided, Blaze will use them before using any other UTxO.
      *
      * @param {TransactionUnspentOutput[]} utxos - the UTxOs to add as collateral
      * @returns {TxBuilder} The same transaction builder
      */
     provideCollateral(utxos: TransactionUnspentOutput[]): TxBuilder;
     /**
      * Adds minting information to the transaction. This includes specifying the policy under which assets are minted,
      * the assets to be minted, and an optional redeemer for Plutus scripts.
      *
      * @param {PolicyId} policy - The policy ID under which the assets are minted.
      * @param {Map<AssetName, bigint>} assets - A map of asset names to the amounts being minted.
      * @param {PlutusData} [redeemer] - Optional. A redeemer to be used if the minting policy requires Plutus script validation.
      */
     addMint(policy: PolicyId, assets: Map<AssetName, bigint>, redeemer?: PlutusData): this;
     /**
      * This methods calculates the minimum ada required for a transaction output.
      * @param {TransactionOutput} output - The transaction output to calculate the minimum ada for.
      * @returns {bigint} The minimum ada required for the output.
      */
     private calculateMinAda;
     /**
      * This method checks and alters the output of a transaction.
      * It ensures that the output meets the minimum ada requirements and does not exceed the maximum value size.
      *
      * @param {TransactionOutput} output - The transaction output to be checked and altered.
      * @returns {TransactionOutput} The altered transaction output.
      * @throws {Error} If the output does not meet the minimum ada requirements or exceeds the maximum value size.
      */
     private checkAndAlterOutput;
     /**
      * Adds a transaction output to the current transaction body. This method also ensures that the minimum ada
      * requirements are met for the output. After adding the output, it updates the transaction body's outputs.
      * It also checks if the output value exceeds the maximum value size.
      *
      * @param {TransactionOutput} output - The transaction output to be added.
      * @returns {TxBuilder} The same transaction builder
      */
     addOutput(output: TransactionOutput): TxBuilder;
     /**
      * Adds a payment in lovelace to the transaction output.
      * This method ensures that the address is valid and the payment is added to the transaction output.
      *
      * @param {Address} address - The address to send the payment to.
      * @param {bigint} lovelace - The amount of lovelace to send.
      * @param {Datum} [datum] - Optional datum to be associated with the paid assets.
      * @returns {TxBuilder} The same transaction builder
      */
     payLovelace(address: Address, lovelace: bigint, datum?: Datum): TxBuilder;
     /**
      * Adds a payment in assets to the transaction output.
      * This method ensures that the address is valid and the payment is added to the transaction output.
      *
      * @param {Address} address - The address to send the payment to.
      * @param {Value} value - The value of the assets to send.
      * @param {Datum} [datum] - Optional datum to be associated with the paid assets.
      * @returns {TxBuilder} The same transaction builder
      */
     payAssets(address: Address, value: Value_2, datum?: Datum): TxBuilder;
     /**
      * Locks a specified amount of lovelace to a script.
      * The difference between 'pay' and 'lock' is that you pay to a public key/user,
      * and you lock at a script.
      * This method ensures that the address is valid and the lovelace is locked to the script.
      *
      * @param {Address} address - The address to lock the lovelace to.
      * @param {bigint} lovelace - The amount of lovelace to lock.
      * @param {Datum} datum - The datum to be associated with the locked lovelace.
      * @param {Script} scriptReference - The reference to the script to lock the lovelace to.
      * @returns {TxBuilder} The same transaction builder
      */
     lockLovelace(address: Address, lovelace: bigint, datum: Datum, scriptReference?: Script): TxBuilder;
     /**
      * Locks a specified amount of assets to a script.
      * The difference between 'pay' and 'lock' is that you pay to a public key/user,
      * and you lock at a script.
      * This method ensures that the address is valid and the assets are locked to the script.
      *
      * @param {Address} address - The address to lock the assets to.
      * @param {Value} value - The value of the assets to lock.
      * @param {Datum} datum - The datum to be associated with the locked assets.
      * @param {Script} scriptReference - The reference to the script to lock the assets to.
      * @returns {TxBuilder} The same transaction builder
      */
     lockAssets(address: Address, value: Value_2, datum: Datum, scriptReference?: Script): TxBuilder;
     /**
      * Deploys a script by creating a new UTxO with the script as its reference.
      *
      * @param {Script} script - The script to be deployed.
      * @param {Address} [address] - The address to lock the script to. Defaults to a burn address where the UTxO will be unspendable.
      * @returns {TxBuilder} The same transaction builder.
      *
      *
      * @example
      * ```typescript
      * const myScript = Script.newPlutusV2Script(new PlutusV2Script("..."));
      * txBuilder.deployScript(myScript);
      * // or
      * txBuilder.deployScript(myScript, someAddress);
      * ```
      */
     deployScript(script: Script, address?: Address): TxBuilder;
     /**
      * Adds a Plutus datum to the transaction. This datum is not directly associated with any particular output but may be used
      * by scripts during transaction validation. This method is useful for including additional information that scripts may
      * need to validate the transaction without requiring it to be attached to a specific output.
      *
      * @param {PlutusData} datum - The Plutus datum to be added to the transaction.
      * @returns {TxBuilder} The same transaction builder
      */
     provideDatum(datum: PlutusData): TxBuilder;
     /**
      * Evaluates the scripts for the given draft transaction and calculates the execution units and fees required.
      * This function iterates over all UTXOs within the transaction's scope, simulates the execution of associated scripts,
      * and aggregates the execution units. It then calculates the total fee based on the execution units and updates the
      * transaction's redeemers with the new execution units.
      *
      * @param {Transaction} draft_tx - The draft transaction to evaluate.
      * @returns {Promise<bigint>} The total fee calculated based on the execution units of the scripts.
      */
     private evaluate;
     /**
      * Builds a full witness set with the provided signatures
      *
      * This includes collecting all necessary scripts (native, Plutus V1, V2, V3),
      * vkey signatures, redeemers, and Plutus data required for script validation.
      *
      * It organizes these components into a structured format that can be
      * serialized and included in the transaction.
      *
      * @returns {TransactionWitnessSet} A constructed transaction witness set.
      * @throws {Error} If a required script cannot be resolved by its hash.
      */
     protected buildFinalWitnessSet(signatures: [Ed25519PublicKeyHex, Ed25519SignatureHex][]): TransactionWitnessSet;
     /**
      * Recalculates the internal tracking of required signatures/redeemers
      * by looping through existing inputs and certificates.
      *
      * @return {void}
      */
     private updateRequiredWitnesses;
     /**
      * Builds a placeholder transaction witness set required for the transaction.
      *
      * This includes collecting all necessary scripts (native, Plutus V1, V2, V3),
      * redeemers, and Plutus data required for script validation.
      *
      * Includes placeholder signatures for the known required signers, so we estimate the transaction size accurately
      *
      * It organizes these components into a structured format that can be
      * serialized and included in the transaction.
      *
      * @returns {TransactionWitnessSet} A constructed transaction witness set.
      * @throws {Error} If a required script cannot be resolved by its hash.
      */
     protected buildPlaceholderWitnessSet(): TransactionWitnessSet;
     /**
      * Calculates the total net change of assets from a transaction.
      * That is, all sources of assets (inputs, withrawal certificates, etc) minus all destinations (outputs, minting, fees, etc)
      * In a balanced / well-formed transaction, this should be zero
      *
      * @returns {Value} The net value that represents the transaction's pitch.
      * @throws {Error} If a corresponding UTxO for an input cannot be found.
      */
     private getAssetSurplus;
     /**
      * Generates a script data hash for the transaction if there are any datums or redeemers present.
      * This hash is crucial for the validation of Plutus scripts in the transaction.
      *
      * @param {TransactionWitnessSet} tw - The transaction witness set containing Plutus data.
      * @returns {IScriptData | undefined} The full lscript data if datums or redeemers are present, otherwise undefined.
      */
     protected getScriptData(tw: TransactionWitnessSet): IScriptData | undefined;
     /**
      * Helper method to just get the script data hash from a TransactionWitnessSet.
      *
      * @param {TransactionWitnessSet} tw - The transaction witness set containing Plutus data.
      * @returns {Hash32ByteBase16 | undefined} The script data hash if datums or redeemers are present, otherwise undefined.
      */
     private getScriptDataHash;
     /**
      * We may have overcommitted some lovelace from our inputs just as part of balance change;
      * On the next time around, we may want to "recover" that lovelace to cover the slightly increased fee, etc.
      */
     private recoverLovelaceFromChangeOutput;
     /**
      * Given some excess value on a transaction, ensure this is returned as change to the change address
      *
      * @param {Value | undefined} surplusValue The excess value to balance into the change output(s)
      */
     private adjustChangeOutput;
     private getOrCreateChangeOutput;
     private splitOutputIfNeeded;
     /**
      * Calculates the transaction fees based on the transaction size and parameters.
      * It updates the transaction body with the calculated fee.
      *
      * @param {Transaction} draft_tx - The draft transaction to calculate fees for.
      */
     protected calculateFees(): void;
     /**
      * Prepares the collateral for the transaction by selecting suitable UTXOs.
      * Throws an error if suitable collateral cannot be found or if some inputs cannot be resolved.{boolean}
      */
     protected prepareCollateral({ useCoinSelection }?: UseCoinSelectionArgs): void;
     /**
      * Prints the transaction cbor in its current state without trying to complete it
      * @returns {string} The CBOR representation of the transaction
      * */
     toCbor(): string;
     /**
      * Completes the transaction by performing several key operations:
      * - Verifies the presence of a change address.
      * - Gathers inputs and performs coin selection if necessary.
      * - Balances the change output.
      * - Builds the transaction witness set.
      * - Calculates the script data hash.
      * - Estimates and sets the transaction fee.
      * - Merges the fee value with the excess value and rebalances the change.
      *
      * @throws {Error} If the change address is not set, or if the coin selection fails to eliminate negative values,
      *                 or if balancing the change output fails.
      * @returns {Promise<Transaction>} A new Transaction object with all components set and ready for submission.
      */
     complete({ useCoinSelection }?: UseCoinSelectionArgs): Promise<Transaction>;
     /**
      * Adds a certificate to delegate a staker to a pool
      *
      * @param {Credential} delegator - The credential of the staker to delegate.
      * @param {PoolId} poolId - The ID of the pool to delegate to.
      * @param {PlutusData} [redeemer] - Optional. A redeemer to be used if the delegation requires Plutus script validation.
      * @returns {TxBuilder} The updated transaction builder.
      */
     addDelegation(delegator: Credential, poolId: PoolId, redeemer?: PlutusData): TxBuilder;
     /**
      * This method delegates the selected reward address to a pool.
      * It first checks if the reward address is set and if it has a stake component.
      * If both conditions are met, it adds a delegation to the transaction.
      *
      * @param {PoolId} poolId - The ID of the pool to delegate the reward address to.
      * @throws {Error} If the reward address is not set or if the method is unimplemented.
      */
     delegate(poolId: PoolId, redeemer?: PlutusData): this;
     /**
      * Adds a certificate to register a staker.
      * @param {Credential} credential - The credential to register.
      * @throws {Error} Method not implemented.
      */
     addRegisterStake(credential: Credential): this;
     /**
      * Adds a certificate to deregister a stake account.
      *
      * @param {Credential} credential - The credential to deregister.
      * @returns {TxBuilder} The updated transaction builder.
      */
     addDeregisterStake(credential: Credential, redeemer?: PlutusData): TxBuilder;
     /**
      * Adds a certificate to register a pool.
      * @throws {Error} Method not implemented.
      */
     addRegisterPool(): void;
     /**
      * Adds a certificate to retire a pool.
      * @throws {Error} Method not implemented.
      */
     addRetirePool(): void;
     /**
      * Specifies the exact time when the transaction becomes valid.
      *
      * @param {Slot} validFrom - The slot from which the transaction becomes valid.
      * @throws {Error} If the validity start interval is already set.
      * @returns {TxBuilder} The instance of this TxBuilder for chaining.
      */
     setValidFrom(validFrom: Slot): TxBuilder;
     /**
      * Specifies the exact time when the transaction expires.
      *
      * @param {Slot} validUntil - The slot until which the transaction is valid.
      * @throws {Error} If the time to live is already set.
      * @returns {TxBuilder} The instance of this TxBuilder for chaining.
      */
     setValidUntil(validUntil: Slot): TxBuilder;
     /**
      * Adds a withdrawal to the transaction. This method allows for the withdrawal of funds from a staking reward account.
      * Optionally, a redeemer can be provided for script validation purposes.
      *
      * @param {C.Cardano.RewardAccount} address - The reward account from which to withdraw.
      * @param {bigint} amount - The amount of ADA to withdraw.
      * @param {PlutusData} [redeemer] - Optional. The redeemer data for script validation.
      * @returns {TxBuilder} The same transaction builder
      * @throws {Error} If the reward account does not have a stake credential or if any other error occurs.
      */
     addWithdrawal(address: RewardAccount, amount: bigint, redeemer?: PlutusData): TxBuilder;
     /**
      * Adds a required signer to the transaction. This is necessary for transactions that must be explicitly signed by a particular key.
      *
      * @param {Ed25519KeyHashHex} signer - The hash of the Ed25519 public key that is required to sign the transaction.
      * @returns {TxBuilder} The same transaction builder
      */
     addRequiredSigner(signer: Ed25519KeyHashHex): TxBuilder;
     /**
      * Sets the auxiliary data for the transaction and updates the transaction's auxiliary data hash.
      *
      * @param {AuxiliaryData} auxiliaryData - The auxiliary data to set.
      * @returns {TxBuilder} The same transaction builder
      */
     setAuxiliaryData(auxiliaryData: AuxiliaryData): TxBuilder;
     /**
      * Sets the transaction metadata and updates the transaction's auxiliary data hash.
      * @param {Metadata} metadata the metadata to set
      * @returns {TxBuilder} The same transaction builder
      */
     setMetadata(metadata: Metadata): TxBuilder;
     /**
      * Adds a script to the transaction's script scope. If the script is already provided via a reference script,
      * it will not be explicitly used again. This method ensures that each script is only included once in the
      * transaction, either directly or by reference, to optimize the transaction size and processing.
      *
      * @param {Script} script - The script to be added to the transaction's script scope.
      * @returns {TxBuilder} The same transaction builder
      */
     provideScript(script: Script): TxBuilder;
     /**
      * Adds a pre-complete hook to the transaction builder. This hook will be executed
      * before the transaction is finalized.
      *
      * Pre-complete hooks are useful for performing last-minute modifications or
      * validations on the transaction before it's completed. Multiple hooks can be
      * added, and they will be executed in the order they were added.
      *
      * @param {(tx: TxBuilder) => Promise<void>} hook - A function that takes the TxBuilder
      * instance as an argument and performs some operation. The hook should be asynchronous.
      * @returns {TxBuilder} The same transaction builder instance for method chaining.
      */
     addPreCompleteHook(hook: (tx: TxBuilder) => Promise<void>): TxBuilder;
    }

    declare const TxCBOR: {
        (tx: string): C.Serialization.TxCBOR;
        serialize(tx: C.Cardano.Tx): C.Serialization.TxCBOR;
        deserialize(tx: C.Serialization.TxCBOR): C.Cardano.Tx;
    };

    declare type TxCBOR = C.Serialization.TxCBOR;

    /**
     * This class provides decoding functionality for UPLC (Untyped Plutus Core) programs.
     * It extends the FlatDecoder class to handle the specific structure of UPLC programs.
     * The decoding process involves interpreting binary data into structured UPLC terms and types.
     */
    export declare class UPLCDecoder extends Parser {
        #private;
        /**
         * Public method to decode a UPLC program from the UPLCDecoder instance
         * @returns {ParsedProgram} The decoded UPLC program.
         */
        decode(): ParsedProgram;
        /**
         * Creates a UPLCDecoder instance from a hexadecimal string.
         * @param {string} hex Hexadecimal string of a UPLC program's binary data.
         * @returns {UPLCDecoder} Initialized UPLCDecoder with the decoded data.
         */
        static fromHex(hex: string): UPLCDecoder;
        /**
         * Decodes a UPLC program from a hexadecimal string.
         * This method utilizes the `fromHex` method to create an instance of UPLCDecoder
         * and then decodes the program using the `decode` method.
         *
         * @param {string} hex - The hexadecimal string representing the binary data of a UPLC program.
         * @returns {ParsedProgram} - The decoded UPLC program.
         */
        static decodeFromHex(hex: string): ParsedProgram;
    }

    /**
     * UPLCEncoder class for encoding Untyped Plutus Core (UPLC) programs.
     * Extends the FlatEncoder class to provide UPLC-specific encoding functionality.
     */
    export declare class UPLCEncoder extends Encoder {
        /**
         * Encodes a semantic version number.
         * @param version - The semantic version as a string (e.g., "1.0.0").
         * @throws {Error} If the version format is invalid.
         */
        encodeVersion(version: SemVer): void;
        encodeList<T>(items: T[], encode: (t: T) => void): void;
        /**
         * Encodes a natural number (non-negative integer).
         * @param n - The natural number to encode.
         */
        encodeNatural(n: bigint): void;
        /**
         * Encodes an integer (positive or negative).
         * @param i - The integer to encode.
         */
        encodeInteger(i: bigint): void;
        /**
         * Encodes a byte string.
         * @param bytes - The byte string to encode as a Uint8Array.
         */
        encodeByteString(bytes: Uint8Array): void;
        /**
         * Encodes a boolean value.
         * @param value - The boolean value to encode.
         */
        encodeBool(value: boolean): void;
        /**
         * Encodes data based on its type.
         * @param type - The type of the data to encode.
         * @param data - The data to encode.
         * @throws {Error} If the data type is not supported.
         */
        encodeData(type: DataType, data: Data): void;
        /**
         * Encodes a data type.
         * @param type - The data type to encode.
         * @returns An array of numbers representing the encoded type.
         * @throws {Error} If the type cannot be encoded.
         */
        encodeType(type: DataType): number[];
        /**
         * Encodes a constant value with its type.
         * @param type - The type of the constant.
         * @param value - The value of the constant.
         */
        encodeConst(type: DataType, value: Data): void;
        /**
         * Encodes a UPLC term.
         * @param term - The parsed term to encode.
         * @throws {Error} If the term type is not supported.
         */
        encodeTerm(term: ParsedTerm): void;
        /**
         * Encodes a complete UPLC program.
         * @param program - The parsed program to encode.
         * @returns A Uint8Array containing the encoded program.
         */
        encodeProgram(program: ParsedProgram): Uint8Array;
    }

    /**
     * The URL of the wallet.
     */
    declare type Url = `${"http" | "https"}://${string}`;

    declare interface UseCoinSelectionArgs {
        useCoinSelection: boolean;
    }

    declare class UTxOSelectionError extends Error {
        phase: SelectionPhase;
        dearth: Value_2;
        availableInputs?: TransactionUnspentOutput[] | undefined;
        selectedInputs?: TransactionUnspentOutput[] | undefined;
        bestStep?: [bigint | number, Value_2, number] | undefined;
        constructor(phase: SelectionPhase, dearth: Value_2, availableInputs?: TransactionUnspentOutput[] | undefined, selectedInputs?: TransactionUnspentOutput[] | undefined, bestStep?: [bigint | number, Value_2, number] | undefined);
    }

    export declare namespace Value {
            { value_assetTypes as assetTypes, value_assets as assets, value_empty as empty, value_intersect as intersect, value_makeValue as makeValue, value_merge as merge, value_negate as negate, value_negatives as negatives, value_positives as positives, value_sub as sub, value_sum as sum, value_zero as zero };
    }

    declare const Value_2: typeof C.Serialization.Value;

    declare type Value_2 = C.Serialization.Value;

    declare const VkeyWitness: typeof C.Serialization.VkeyWitness;

    declare type VkeyWitness = C.Serialization.VkeyWitness;

    /**
     * Abstract class for Wallet.
     */
    export declare abstract class Wallet {
        /**
         * Retrieves the network ID of the currently connected account.
         * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
         */
        abstract getNetworkId(): Promise<NetworkId>;
        /**
         * Retrieves the UnspentOutputs controlled by the wallet.
         * @returns {Promise<TransactionUnspentOutput[]>} - The UnspentOutputs controlled by the wallet.
         */
        abstract getUnspentOutputs(): Promise<TransactionUnspentOutput[]>;
        /**
         * Retrieves the total available balance of the wallet, encoded in CBOR.
         * @returns {Promise<Value>} - The balance of the wallet.
         */
        abstract getBalance(): Promise<Value_2>;
        /**
         * Retrieves all used addresses controlled by the wallet.
         * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
         */
        abstract getUsedAddresses(): Promise<Address[]>;
        /**
         * Retrieves all unused addresses controlled by the wallet.
         * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
         */
        abstract getUnusedAddresses(): Promise<Address[]>;
        /**
         * Retrieves an address owned by the wallet which should be used to return transaction change.
         * @returns {Promise<Address>} - The change address.
         */
        abstract getChangeAddress(): Promise<Address>;
        /**
         * Retrieves the reward addresses controlled by the wallet.
         * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
         */
        abstract getRewardAddresses(): Promise<RewardAddress[]>;
        /**
         * Requests a transaction signature from the wallet.
         * @param {Transaction} tx - The transaction to sign.
         * @param {boolean} partialSign - Whether to partially sign the transaction.
         * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
         */
        abstract signTransaction(tx: Transaction, partialSign: boolean): Promise<TransactionWitnessSet>;
        /**
         * Requests signed data from the wallet.
         * @param {Address} address - The address to sign the data with.
         * @param {string} payload - The data to sign.
         * @returns {Promise<Cip30DataSignature>} - The signed data.
         */
        abstract signData(address: Address, payload: string): Promise<CIP30DataSignature>;
        /**
         * Posts a transaction through the wallet.
         * @param {Transaction} tx - The transaction to submit.
         * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
         */
        abstract postTransaction(tx: Transaction): Promise<TransactionId>;
        /**
         * Retrieves the collateral UnspentOutputs for the wallet.
         * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
         */
        abstract getCollateral(): Promise<TransactionUnspentOutput[]>;
    }

    /**
     * The interface for a wallet.
     */
    declare interface Wallet_2 {
        namespace: Namespace;
        name: string;
        icon?: string;
        websiteUrl: Url;
    }

    /**
     * The details of the wallets.
     */
    export declare const WalletDetails: Wallet_2[];

    /**
     * Wallet class that interacts with the WalletInterface.
     */
    export declare class WebWallet implements Wallet {
        private webWallet;
        /**
         * Constructs a new instance of the WebWallet class.
         * @param {CIP30Interface} webWallet - The CIP30Interface to be used.
         */
        constructor(webWallet: CIP30Interface);
        /**
         * Retrieves the network ID of the currently connected account.
         * @returns {Promise<NetworkId>} - The network ID of the currently connected account.
         */
        getNetworkId(): Promise<NetworkId>;
        /**
         * Retrieves the UTxO(s) controlled by the wallet.
         * @returns {Promise<TransactionUnspentOutput[]>} - The UTXO(s) controlled by the wallet.
         */
        getUnspentOutputs(): Promise<TransactionUnspentOutput[]>;
        /**
         * Retrieves the total available balance of the wallet, encoded in CBOR.
         * @returns {Promise<Value>} - The balance of the wallet.
         */
        getBalance(): Promise<Value_2>;
        /**
         * Retrieves all used addresses controlled by the wallet.
         * @returns {Promise<Address[]>} - The used addresses controlled by the wallet.
         */
        getUsedAddresses(): Promise<Address[]>;
        /**
         * Retrieves all unused addresses controlled by the wallet.
         * @returns {Promise<Address[]>} - The unused addresses controlled by the wallet.
         */
        getUnusedAddresses(): Promise<Address[]>;
        /**
         * Retrieves an address owned by the wallet which should be used to return transaction change.
         * @returns {Promise<Address>} - The change address.
         */
        getChangeAddress(): Promise<Address>;
        /**
         * Retrieves the reward addresses controlled by the wallet.
         * @returns {Promise<RewardAddress[]>} - The reward addresses controlled by the wallet.
         */
        getRewardAddresses(): Promise<RewardAddress[]>;
        /**
         * Requests a transaction signature from the wallet.
         * @param {string} tx - The transaction to sign.
         * @param {boolean} partialSign - Whether to partially sign the transaction.
         * @returns {Promise<TransactionWitnessSet>} - The signed transaction.
         */
        signTransaction(tx: Transaction, partialSign: boolean): Promise<TransactionWitnessSet>;
        /**
         * Requests signed data from the wallet.
         * @param {Address} address - The address to sign the data with.
         * @param {string} payload - The data to sign.
         * @returns {Promise<CIP30DataSignature>} - The signed data.
         */
        signData(address: Address, payload: string): Promise<CIP30DataSignature>;
        /**
         * Submits a transaction through the wallet.
         * @param {Transaction} tx - The transaction to submit.
         * @returns {Promise<TransactionId>} - The ID of the submitted transaction.
         */
        postTransaction(tx: Transaction): Promise<TransactionId>;
        /**
         * Retrieves the collateral UTxO(s) for the wallet.
         * @returns {Promise<TransactionUnspentOutput[]>} - The collateral for the wallet.
         */
        getCollateral(): Promise<TransactionUnspentOutput[]>;
    }

    export { }
