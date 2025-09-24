/**
 * The namespace of the wallet.
 */
export type Namespace = "nami" | "eternl" | "flint" | "gerowallet" | "nufi" | "begin" | "lace" | "yoroi";
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
export declare const WalletDetails: Wallet[];
export {};
//# sourceMappingURL=wallets.d.ts.map