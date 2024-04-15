
export type Namespace = 
    "nami"
    | "eternl"
    | "flint"
    | "gerowallet"
    | "nufi"
    | "begin"
    | "lace"
    | "yoroi"

type Url = `${("http" | "https")}://${string}`

interface Wallet {
    namespace: Namespace,
    name: string,
    icon?: string,
    websiteUrl: Url
}

export const WalletDetails: Wallet[] = [
    {
        namespace: "nami",
        name: "Nami Wallet",
        websiteUrl: "https://www.namiwallet.io/"
    }
]