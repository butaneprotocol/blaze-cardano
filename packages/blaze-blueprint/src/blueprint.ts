import * as fs from "fs/promises";
import type { PBoundary, PSchema } from "./schema";
import { Blueprint } from "./schema";
// import { Data, Constr } from "@blaze-cardano/tx";
// import { PlutusData } from "@blaze-cardano/core";

class Generator {
  dataImported = false;
  imports = `
/* eslint-disable @typescript-eslint/no-namespace */
import { PlutusData, type Script, ConstrPlutusData, PlutusList, fromHex } from "@blaze-cardano/core";
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";`;

  pdataImport = `import { type PlutusData } from "@blaze-cardano/core";`;

  useSDK() {
    this.imports = `// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { applyParamsToScript, cborToScript, Core } from "@blaze-cardano/sdk";
type Script = Core.Script;
const Script = Core.Script;`;

    this.pdataImport = `type PlutusData = Core.PlutusData;
const PlutusData = Core.PlutusData;`;
  }

  refToTypeName(ref: string): string {
    const refKey = ref.split("#/definitions/")[1]!.replace(/~1/g, "/");
    return this.keyToTypeName(refKey);
  }

  keyToTypeName(key: string): string {
    if (!key.includes("$")) {
      return key.split("/").reverse()[0]!;
    }
    return Generator.upperFirst(
      Generator.snakeToCamel(key.replace(/\//g, "_"))
        .split("$")
        .map(Generator.upperFirst)
        .join("$"),
    );
  }

  schemaToType(schema: PSchema | PBoundary): string {
    // if (!schema) throw new Error("Could not generate type.");
    // const shapeType = (schema.anyOf ? "enum" : "") || schema.dataType;
    if ("dataType" in schema) {
      const dataType = schema.dataType;
      if (dataType === "integer") {
        return "bigint";
      } else if (dataType === "bytes") {
        return "string";
      } else if (dataType === "constructor") {
        if (Generator.isVoid(schema)) {
          return "undefined";
        } else {
          const bracketType = "title" in schema.fields[0]! ? "curly" : "square";
          let result = bracketType == "curly" ? "{" : "[";
          for (let i = 0; i < schema.fields.length; i++) {
            const field = schema.fields[i]!;
            if (i > 0) {
              result += ";\n";
            }
            if ("title" in field) {
              result += `${field.title}:${this.schemaToType(field)}`;
            } else {
              result += `${this.schemaToType(field)}`;
            }
          }
          result += bracketType == "curly" ? "}" : "]";
          return result;
        }
      } else if (dataType == "list") {
        if (schema.items instanceof Array) {
          return `[${schema.items
            .map((item) => this.schemaToType(item))
            .join(",")}]`;
        } else {
          return `Array<${this.schemaToType(schema.items)}>`;
        }
      } else if (dataType == "map") {
        return `Map<${this.schemaToType(schema.keys)}, ${this.schemaToType(
          schema.values,
        )}>`;
      } else {
        throw new Error("cannot parse dataType: " + dataType);
      }
    } else if ("anyOf" in schema) {
      const anyOf = schema.anyOf;
      if (anyOf.length === 1) {
        return this.schemaToType(anyOf[0]!);
      }
      if (Generator.isBoolean(schema)) {
        return "boolean";
      }
      if (Generator.isNullable(schema)) {
        // todo: fix this
        return `${this.schemaToType(anyOf[0]!.fields[0]!)} | null`;
      }
      const t = schema.anyOf
        .map((entry) =>
          entry.fields.length === 0
            ? `"${entry.title}"`
            : `{${entry.title}: ${
                "title" in entry.fields[0]!
                  ? `{${entry.fields
                      .map((field) =>
                        [
                          "title" in field ? field.title : Error("no title"),
                          this.schemaToType(field),
                        ].join(":"),
                      )
                      .join(",")}}}`
                  : `[${entry.fields
                      .map((field) => this.schemaToType(field))
                      .join(",")}]}`
              }`,
        )
        .join(" | ");
      console.log(t, schema.anyOf);
      return t;
    } else if ("title" in schema && schema.title == "Data") {
      return "PlutusData";
    } else if ("$ref" in schema) {
      return this.refToTypeName(schema["$ref"]);
    } else if ("schema" in schema) {
      return this.schemaToType(schema.schema);
    }
    console.log("unknown: ", schema);
    return "unknown";
    // throw new Error("Could not type cast data.");
  }

  schemaToParser(schema: PSchema | PBoundary, title = "value"): string {
    if ("anyOf" in schema) {
      const anyOf = schema.anyOf;
      if (anyOf.length === 0) {
        throw new Error("unserialisable");
      }
      if (anyOf.length === 1) {
        return this.schemaToParser(anyOf[0]!);
      }
      if (Generator.isBoolean(schema)) {
        return `if (value){
          return PlutusData.newConstrPlutusData(new ConstrPlutusData(1n, new PlutusList()));
        }else{
          return PlutusData.newConstrPlutusData(new ConstrPlutusData(0n, new PlutusList()));
        }`;
      }
      if (Generator.isNullable(schema)) {
        return `if (${title}){
          const list = new PlutusList();
          list.add((()=>{${this.schemaToParser(schema.anyOf[0]!.fields[0]!, title)}})())
          return PlutusData.newConstrPlutusData(new ConstrPlutusData(0n, list))
        }else{
          return PlutusData.newConstrPlutusData(new ConstrPlutusData(1n, new PlutusList()));
        }`;
      }
      const hasEnums = anyOf.some((x) => x.fields.length == 0);
      const hasRecords = anyOf.some((x) => x.fields.length > 0);
      let enumBranch = ``;
      let recordBranch = ``;
      if (hasEnums) {
        let first = true;
        let lastEnumIndex = anyOf.length - 1;
        while (lastEnumIndex >= 0 && anyOf[lastEnumIndex]!.fields.length > 0) {
          lastEnumIndex--;
        }
        for (let i = 0; i <= lastEnumIndex; i += 1) {
          if (anyOf[i]!.fields.length == 0) {
            if (!first) {
              enumBranch += ` else `;
            }
            if (i !== lastEnumIndex || first) {
              enumBranch += `if (${title} == "${schema.anyOf[i]!.title}")`;
            }
            first = false;
            enumBranch += `{
              return PlutusData.newConstrPlutusData(new ConstrPlutusData(${i}n, new PlutusList()));
            }`;
          }
        }
      }
      if (hasRecords) {
        let first = true;
        let lastRecordIndex = anyOf.length - 1;
        while (
          lastRecordIndex >= 0 &&
          anyOf[lastRecordIndex]!.fields.length === 0
        ) {
          lastRecordIndex--;
        }
        for (let i = 0; i <= lastRecordIndex; i += 1) {
          if (schema.anyOf[i]!.fields.length > 0) {
            if (!first) {
              recordBranch += ` else `;
            }
            if (i !== lastRecordIndex || first) {
              recordBranch += `if ("${schema.anyOf[i]!.title}" in ${title})`;
            }
            first = false;
            recordBranch += `{
              const inner = ${title}.${schema.anyOf[i]!.title}`;
            recordBranch += this.schemaToParser(schema.anyOf[i]!, "inner");
            recordBranch += `}`;
          }
        }
      }
      if (hasRecords && !hasEnums) {
        return recordBranch;
      } else if (!hasRecords && hasEnums) {
        return enumBranch;
      } else {
        return `if (typeof ${title} == "object"){
          ${recordBranch}
        }else{
          ${enumBranch}
        }
        throw new Error("unreachable");`;
      }
    }
    if ("dataType" in schema) {
      const dataType = schema.dataType;
      if (dataType == "constructor") {
        return `
          const list = new PlutusList();
          ${schema.fields
            .map((x, i) => {
              if ("$ref" in x) {
                const ref = this.refToTypeName(x["$ref"]);
                return `list.add(this.${ref}ToData(${title}${x.title ? "." + x.title : "[" + i + "]"}))`;
              } else {
                throw new Error("Cannot handle deep constructors!");
              }
            })
            .join("\n")}
          return PlutusData.newConstrPlutusData(new ConstrPlutusData(${schema.index}n, list))
        `;
      } else if (dataType == "list") {
        if ("$ref" in schema.items) {
          const ref = this.refToTypeName(schema.items.$ref);
          return `
            const list = new PlutusList();
            for (const el of ${title}){
              list.add(this.${ref}ToData(el))
            }
            return PlutusData.newList(list);
          `;
        } else if (
          typeof schema.items == "object" &&
          schema.items instanceof Array
        ) {
          return `
          const list = new PlutusList();
          ${schema.items
            .map((x, i) => {
              if ("$ref" in x) {
                const ref = this.refToTypeName(x["$ref"]);
                return `list.add(this.${ref}ToData(${title}[${i}]))`;
              } else {
                throw new Error("Cannot handle deep constructors!");
              }
            })
            .join("\n")}
          return PlutusData.newList(list);
        `;
        }
      } else if (dataType == "bytes") {
        return `return PlutusData.newBytes(fromHex(${title}))`;
      } else if (dataType == "integer") {
        return `return PlutusData.newInteger(${title})`;
      }
    } else if (schema.title == "Data") {
      return `return ${title}`;
    } else if ("$ref" in schema) {
      const ref = this.refToTypeName(schema["$ref"]);
      return `return this.${ref}ToData(${title})`;
    }
    return "return undefined;";
  }

  static isBoolean(shape: any): boolean {
    return (
      shape.anyOf &&
      shape.anyOf[0]?.title === "False" &&
      shape.anyOf[1]?.title === "True"
    );
  }

  static isVoid(shape: any): boolean {
    return shape.index === 0 && shape.fields.length === 0;
  }

  static isNullable(shape: any): boolean {
    return (
      shape.anyOf &&
      shape.anyOf[0]?.title === "Some" &&
      shape.anyOf[1]?.title === "None"
    );
  }

  static snakeToCamel(s: string): string {
    const withUnderscore = s.charAt(0) === "_" ? s.charAt(0) : "";
    return (
      withUnderscore +
      (withUnderscore ? s.slice(1) : s)
        .toLowerCase()
        .replace(/([-_][a-z])/g, (group) =>
          group.toUpperCase().replace("-", "").replace("_", ""),
        )
    );
  }

  static upperFirst(s: string): string {
    const withUnderscore = s.charAt(0) === "_" ? s.charAt(0) : "";
    return (
      withUnderscore +
      s.charAt(withUnderscore ? 1 : 0).toUpperCase() +
      s.slice((withUnderscore ? 1 : 0) + 1)
    );
  }
}

export type BlueprintArgs = {
  infile?: string;
  outfile?: string;
  useSdk?: boolean;
};
export async function generateBlueprint({
  infile = "plutus.json",
  outfile = "plutus.ts",
  useSdk = false,
}: BlueprintArgs) {
  const plutusJson: Blueprint = await Blueprint.parseAsync(
    JSON.parse(await fs.readFile(infile, "utf8")),
  );
  // const plutusVersion =
  //   plutusJson.preamble.plutusVersion == "v2" ? '"PlutusV2"' : '"PlutusV1"';

  const definitions = plutusJson.definitions;

  const generator = new Generator();
  if (useSdk) {
    generator.useSDK();
  }
  const typeDefinitions = Object.entries(definitions).map(([key, schema]) => {
    const typeName = generator.keyToTypeName(key);
    const typeValue = generator.schemaToType(schema);
    if (key.includes("$")) {
      const comment = `// ${key}`;
      return `${comment}\nexport type ${typeName} = ${typeValue};`;
    }
    return `export type ${typeName} = ${typeValue};`;
  });

  const definitionsClass = `export class BlueprintSerialisation {
    ${Object.entries(definitions)
      .map(([key, schema]) => {
        const typeName = generator.keyToTypeName(key);
        const comment = key.includes("$") ? `    // ${key}\n` : "";
        return `${comment}
    static ${typeName}ToData(value: TypeGen.${typeName}): PlutusData {
      ${generator.schemaToParser(schema)}
    }

    static ${typeName}FromData(_data: PlutusData): TypeGen.${typeName} {
      // Implement conversion logic here
      throw new Error("Not implemented");
    }`;
      })
      .join("\n")}
  }`;

  const validators = plutusJson.validators.map((validator) => {
    const title = Generator.upperFirst(Generator.snakeToCamel(validator.title));

    let codeString = `export interface ${title} {\n`;

    for (const [endpointName, endpoint] of Object.entries(
      validator.endpoints,
    )) {
      const datum = endpoint.datum;
      // const datumTitle = datum ? Generator.snakeToCamel(datum.title) : null;
      const datumSchema = datum?.schema;

      const redeemer = endpoint.redeemer;
      // const redeemerTitle = Generator.snakeToCamel(redeemer.title);
      const redeemerSchema = redeemer.schema;
      codeString += `\t${Generator.upperFirst(endpointName)}: {\n`;
      codeString += `\t\t${Generator.upperFirst("redeemer")}(): TypeGen.${generator.schemaToType(redeemerSchema)};\n`;
      if (datum) {
        codeString += `\t\t${Generator.upperFirst("datum")}(): TypeGen.${generator.schemaToType(datumSchema!)};\n`;
      }
      codeString += `\t};\n`;
    }
    codeString += `}`;

    return codeString;
  });

  // export const ${name} = Object.assign(
  //   function (${paramsArgs.map((param) => param.join(":")).join(",")}) {${
  //     paramsArgs.length > 0
  //       ? `return cborToScript(applyParamsToScript("${script}", [${paramsArgs
  //           .map((param) => param[0])
  //           .join(",")}], ${JSON.stringify(
  //           paramsSchema,
  //         )} as any), ${plutusVersion});`
  //       : `return cborToScript("${script}", ${plutusVersion});`
  //   }},
  //   ${datum ? `{${datumTitle}: ${JSON.stringify(datumSchema)}},` : ""}
  //   {${redeemerTitle}: ${JSON.stringify(redeemerSchema)}},
  // ) as unknown as ${name};`;

  const plutus =
    generator.imports +
    "\n\n" +
    validators.join("\n\n") +
    "\n\n" +
    "export namespace TypeGen {\n" +
    typeDefinitions.join("\n\n") +
    "}\n" +
    "\n\n" +
    definitionsClass;
  await fs.writeFile(outfile, plutus);
}
