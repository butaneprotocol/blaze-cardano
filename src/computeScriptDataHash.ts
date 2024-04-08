/* eslint-disable unicorn/number-literal-case */
import * as Crypto from '@cardano-sdk/crypto';
import { Cardano, Serialization } from '@cardano-sdk/core';
import { Hash32ByteBase16 } from '@cardano-sdk/crypto';
import { HexBlob } from '@cardano-sdk/util';

const CBOR_EMPTY_LIST = new Uint8Array([0x80]);
const CBOR_EMPTY_MAP = new Uint8Array([0xa0]);

const getCborEncodedArray = <T extends { toCbor: () => HexBlob }>(items: T[]): Uint8Array => {
  const writer = new Serialization.CborWriter();

  writer.writeStartArray(items.length);

  for (const item of items) {
    writer.writeEncodedValue(Buffer.from(item.toCbor(), 'hex'));
  }

  return writer.encode();
};

function hashScriptData (
  costModels: Serialization.Costmdls,
  redemeers?: Serialization.Redeemer[],
  datums?: Serialization.PlutusData[]
): Crypto.Hash32ByteBase16 | undefined {
  const writer = new Serialization.CborWriter();

  if (datums && datums.length > 0 && (!redemeers || redemeers.length === 0)) {
    /*
     ; Note that in the case that a transaction includes datums but does not
     ; include any redeemers, the script data format becomes (in hex):
     ; [ 80 | datums | A0 ]
     ; corresponding to a CBOR empty list and an empty map).
    */
    writer.writeEncodedValue(CBOR_EMPTY_LIST);
    writer.writeEncodedValue(getCborEncodedArray(datums));
    writer.writeEncodedValue(CBOR_EMPTY_MAP);
  } else {
    if (!redemeers || redemeers.length === 0) return undefined;
    /*
     ; script data format:
     ; [ redeemers | datums | language views ]
     ; The redeemers are exactly the data present in the transaction witness set.
     ; Similarly for the datums, if present. If no datums are provided, the middle
     ; field is an empty string.
    */
    writer.writeEncodedValue(getCborEncodedArray(redemeers));

    if (datums && datums.length > 0) writer.writeEncodedValue(getCborEncodedArray(datums));

    writer.writeEncodedValue(Buffer.from(costModels.languageViewsEncoding(), 'hex'));
  }

  return Hash32ByteBase16.fromHexBlob(
    HexBlob.fromBytes(Crypto.blake2b(Crypto.blake2b.BYTES).update(writer.encode()).digest())
  );
};

export function computeScriptDataHash (
  costModels: Cardano.CostModels,
  usedLanguages: Cardano.PlutusLanguageVersion[],
  redeemers?: Cardano.Redeemer[],
  datums?: Cardano.PlutusData[]
): Crypto.Hash32ByteBase16 | undefined {
  if ((!redeemers || redeemers.length === 0) && (!datums || datums.length === 0)) return undefined;

  const requiredCostModels = new Serialization.Costmdls();

  // We will only include the cost models we need in the hash computation.
  for (const language of usedLanguages) {
    const costModel = costModels.get(language);
    if (costModel) {
      requiredCostModels.insert(new Serialization.CostModel(language, costModel));
    }
  }

  return hashScriptData(
    requiredCostModels,
    redeemers?.map((r) => Serialization.Redeemer.fromCore(r)),
    datums?.map((d) => Serialization.PlutusData.fromCore(d))
  );
};