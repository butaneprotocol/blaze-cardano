import { plutus } from "../plutus"

type Split<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

type Join<A extends string[], D extends string> =
    A extends [] ? '' :
    A extends [infer T] ? T :
    `${A[0]}${D}${Join<A extends [infer _, ...infer R] ? R : [], D>}`;

    
type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
    ? `${Capitalize<T>}${Capitalize<SnakeToCamel<U>>}`
    : Capitalize<S>;

type ConvertNames<S extends string> = S extends `${infer T}.${infer U}`
    ? `${Capitalize<SnakeToCamel<T>>}${ConvertNames<U>}`
    : Capitalize<SnakeToCamel<S>>

type ParseRef<S extends string> = S extends `#/definitions/${infer T}`
    ? `${Join<Split<T, "~1">, "/">}`
    : Error

type VMapX<El> = El extends {title, compiledCode} ?
    { [K in El["title"]]: El["compiledCode"] } : {}

type VMapper<L> = 
    L extends readonly [infer A, ...infer C]
    ? VMapX<A> & VMapper<C>
    : Error
type VMap = VMapper<plutus["validators"]>

type VMapKeys = { [K in keyof VMap]: ConvertNames<K> };

//ConvertNames<plutus["validators"][number]["title"]>
type Refs = ParseRef<plutus["validators"][number]["redeemer"]["schema"]["$ref"]>
type DataSerialization = plutus["definitions"][Refs]

function getScript<K extends plutus["validators"][number]["title"], J extends VMap[K]>(k: K): J {
    for (const validator of plutus.validators) {
        if (validator["title"] == k){
            return validator.compiledCode as J
        }
    }
    throw new Error ("Unreachable!")
}