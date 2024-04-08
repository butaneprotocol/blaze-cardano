import {PolicyId, Hash28ByteBase16, Ed25519PublicKeyHex} from "./types"

export function PolicyIdToHash(policy: PolicyId){
    return policy as unknown as Hash28ByteBase16
}

export function HashAsPubKeyHex(hash: Hash28ByteBase16){
    return hash as unknown as Ed25519PublicKeyHex
}