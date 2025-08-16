import { HotSingleWallet, type Provider, Core } from "@blaze-cardano/sdk";

export async function walletFromMnemonic(mnemonic: string, provider: Provider) {
  if (!mnemonic || mnemonic.trim().split(/\s+/).length < 12) {
    throw new Error("Invalid mnemonic");
  }
  const entropy = Core.mnemonicToEntropy(mnemonic, Core.wordlist);
  return new HotSingleWallet(
    Core.Ed25519PrivateKey.fromNormalBytes(entropy).hex(),
    Core.NetworkId.Testnet,
    provider,
  );
}
