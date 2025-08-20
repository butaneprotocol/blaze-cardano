import type { Annotated, Declaration } from "./shared";
export type Integer = {
    dataType: "integer";
};
export type Bytes = {
    dataType: "bytes";
};
export type List = {
    dataType: "list";
    items: Data | Data[];
};
export type Map = {
    dataType: "map";
    keys: Declaration<Data>;
    values: Declaration<Data>;
};
export type Constructor = {
    dataType: "constructor";
    index: number;
    fields: Annotated<Declaration<Data>>[];
};
export type Enum = {
    anyOf: Annotated<Constructor>[];
};
export type Opaque = {};
export type Data = Integer | Bytes | List | Map | Enum | Opaque;
//# sourceMappingURL=data.d.ts.map