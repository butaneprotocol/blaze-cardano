import {
  type Ed25519PrivateKey,
  fromHex,
  toHex,
  HexBlob,
  CredentialType,
} from "@blaze-cardano/core";
import type { SubTransaction } from "@blaze-cardano/core";
import { type CIP30DataSignature } from "./types";

// This code was ported from lucid
export async function signData(
  addressHex: string,
  payload: string,
  privateKey: Ed25519PrivateKey,
): Promise<CIP30DataSignature> {
  const {
    Label,
    CBORValue,
    COSESign1Builder,
    Headers,
    HeaderMap,
    ProtectedHeaderMap,
    Int,
    BigNum,
    AlgorithmId,
    COSEKey,
    KeyType,
  } = await import(
    // @ts-expect-error - TS doesn't recognize window object
    typeof window === "undefined"
      ? "@emurgo/cardano-message-signing-nodejs"
      : "@emurgo/cardano-message-signing-browser"
  );
  const protectedHeaders = HeaderMap.new();
  protectedHeaders.set_algorithm_id(Label.from_algorithm_id(AlgorithmId.EdDSA));
  protectedHeaders.set_header(
    Label.new_text("address"),
    CBORValue.new_bytes(fromHex(addressHex)),
  );
  const protectedSerialized = ProtectedHeaderMap.new(protectedHeaders);
  const unprotectedHeaders = HeaderMap.new();
  const headers = Headers.new(protectedSerialized, unprotectedHeaders);
  const builder = COSESign1Builder.new(headers, fromHex(payload), false);
  const toSign = builder.make_data_to_sign().to_bytes();

  const publicKey = privateKey.toPublic();
  const signedSigStruc = privateKey.sign(HexBlob(toHex(toSign)));
  const coseSign1 = builder.build(signedSigStruc.bytes());

  const key = COSEKey.new(
    Label.from_key_type(KeyType.OKP), //OKP
  );
  key.set_algorithm_id(Label.from_algorithm_id(AlgorithmId.EdDSA));
  key.set_header(
    Label.new_int(Int.new_negative(BigNum.from_str("1"))),
    CBORValue.new_int(
      Int.new_i32(6), //CurveType.Ed25519
    ),
  ); // crv (-1) set to Ed25519 (6)
  key.set_header(
    Label.new_int(Int.new_negative(BigNum.from_str("2"))),
    CBORValue.new_bytes(publicKey.bytes()),
  ); // x (-2) set to public key

  return {
    signature: HexBlob(toHex(coseSign1.to_bytes())),
    key: HexBlob(toHex(key.to_bytes())),
  };
}

/** The key hashes a sub-transaction's guards name, whether given as key hashes or as credentials. */
export function guardKeyHashes(subTx: SubTransaction): string[] {
  const guards = subTx.body().guards();
  return (
    guards?.keyHashes() ??
    guards
      ?.credentials()
      ?.filter((credential) => credential.type === CredentialType.KeyHash)
      .map((credential) => credential.hash) ??
    []
  );
}
