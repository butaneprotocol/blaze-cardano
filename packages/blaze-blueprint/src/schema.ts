/*
Unit,
Boolean,
Integer,
Bytes,
String,
Pair(Declaration<Schema>, Declaration<Schema>),
List(Items<Schema>),
Data(Data),
*/

import { Data } from "./data"
import { Declaration } from "./shared"

export type Unit = { "title": "Unit", "anyOf": [{ "dataType": "constructor", "index": 0, "fields": [] }] }
export const Unit: Unit = { title: "Unit", anyOf: [{ dataType: "constructor", index: 0, fields: [] }] }

export type Boolean = {
  "title": "Bool",
  "anyOf": [
    {
      "title": "False",
      "dataType": "constructor",
      "index": 0,
      "fields": []
    },
    {
      "title": "True",
      "dataType": "constructor",
      "index": 1,
      "fields": []
    }
  ]
}

export type Int = { "dataType": "integer" }

export type Bytes = { "dataType": "bytes" }

export type String = { "dataType": "#string" }

export type Pair = {
  "title": "Pair",
  "dataType": "#pair",
  "left": Declaration<Schema>,
  "right": Declaration<Schema>,
}

export type List = {
  "dataType": "list",
  "items": Schema | Schema[],
}

export type Schema = Unit | Boolean | Int | Bytes | String | Pair | List | Data