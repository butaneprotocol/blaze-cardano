import * as BaseEncoding from '@scure/base';
import { Bip32PublicKeyHex } from "../../../deps/crypto.js";
import { InvalidStringError, assertIsBech32WithPrefix } from "../../../deps/util.js";
const MAX_BECH32_LENGTH_LIMIT = 1023;
const bip32PublicKeyPrefix = 'acct_shared_xvk';
export const Cip1854ExtendedAccountPublicKey = (value) => {
    try {
        assertIsBech32WithPrefix(value, [bip32PublicKeyPrefix]);
    }
    catch {
        throw new InvalidStringError(value, 'Expected key to be a bech32 encoded string');
    }
    return value;
};
Cip1854ExtendedAccountPublicKey.fromBip32PublicKeyHex = (value) => {
    const words = BaseEncoding.bech32.toWords(Buffer.from(value, 'hex'));
    return Cip1854ExtendedAccountPublicKey(BaseEncoding.bech32.encode(bip32PublicKeyPrefix, words, MAX_BECH32_LENGTH_LIMIT));
};
Cip1854ExtendedAccountPublicKey.toBip32PublicKeyHex = (value) => {
    const { words } = BaseEncoding.bech32.decode(value, MAX_BECH32_LENGTH_LIMIT);
    return Bip32PublicKeyHex(Buffer.from(BaseEncoding.bech32.fromWords(words)).toString('hex'));
};
