import type { Data } from "./data";
import type { Declaration } from "./shared";
export type Unit = {
    title: "Unit";
    anyOf: [{
        dataType: "constructor";
        index: 0;
        fields: [];
    }];
};
export declare const Unit: Unit;
export type Boolean = {
    title: "Bool";
    anyOf: [
        {
            title: "False";
            dataType: "constructor";
            index: 0;
            fields: [];
        },
        {
            title: "True";
            dataType: "constructor";
            index: 1;
            fields: [];
        }
    ];
};
export type Int = {
    dataType: "integer";
};
export type Bytes = {
    dataType: "bytes";
};
export type String = {
    dataType: "#string";
};
export type Pair = {
    title: "Pair";
    dataType: "#pair";
    left: Declaration<Schema>;
    right: Declaration<Schema>;
};
export type List = {
    dataType: "list";
    items: Schema | Schema[];
};
export type Schema = Unit | Boolean | Int | Bytes | String | Pair | List | Data;
//# sourceMappingURL=schema.d.ts.map