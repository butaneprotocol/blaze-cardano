/**
 * The namespace of the wallet.
 */
export type Namespace =
  | "nami"
  | "eternl"
  | "flint"
  | "gerowallet"
  | "nufi"
  | "begin"
  | "lace"
  | "yoroi";

/**
 * The URL of the wallet.
 */
type Url = `${"http" | "https"}://${string}`;

/**
 * The interface for a wallet.
 */
interface Wallet {
  namespace: Namespace;
  name: string;
  icon?: string;
  websiteUrl: Url;
}

/**
 * The details of the wallets.
 */
export const WalletDetails: Wallet[] = [
  {
    namespace: "nami",
    name: "Nami Wallet",
    websiteUrl: "https://www.namiwallet.io/",
  },
];
