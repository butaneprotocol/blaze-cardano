// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import { HexBlob } from '../../../util/index';

export const bytesToHex = (bytes: Uint8Array): HexBlob => Buffer.from(bytes).toString('hex') as HexBlob;

export const hexToBytes = (hex: HexBlob): Uint8Array => Buffer.from(hex, 'hex');

export const utf8ToBytes = (str: string): Uint8Array => Buffer.from(str, 'utf8');

export const utf8ToHex = (str: string): HexBlob => Buffer.from(str, 'utf8').toString('hex') as HexBlob;
