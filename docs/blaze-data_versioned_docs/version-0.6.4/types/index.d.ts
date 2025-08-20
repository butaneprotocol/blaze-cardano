import { PlutusData } from '@blaze-cardano/core';
import { Static } from '@sinclair/typebox';
import { TSchema } from '@sinclair/typebox';

export declare type Exact<T> = T extends TSchema ? Static<T> : T;

export declare function parse<T extends TSchema>(type: T, data: PlutusData, defs?: Record<string, TSchema>): Exact<T>;

export declare function _parse<T extends TSchema>(type: T, data: PlutusData, path: string[], defs: Record<string, TSchema>): Exact<T>;

export declare function serialize<T extends TSchema>(type: T, data: Exact<T>, defs?: Record<string, TSchema>): PlutusData;

export declare function _serialize<T extends TSchema>(type: T, data: Exact<T>, path: string[], defs: Record<string, TSchema>): PlutusData;

export declare const TPlutusData: TSchema;

export declare const Void: () => PlutusData;


export * from "@sinclair/typebox";

export { }
