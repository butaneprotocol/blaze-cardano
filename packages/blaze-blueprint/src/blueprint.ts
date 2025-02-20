import * as fs from "fs/promises";
import { Schema, Boolean, Unit } from "./schema";
import { Annotated, Declaration } from "./shared";
import { Constructor, Data } from "./data";

type Blueprint = {
  preamble: {
    title: string;
    description: string;
    version: string;
    plutusVersion: "v3" | "v2" | "v1";
    license: string;
  };
  validators: Validator[];
  definitions: Record<
    string,
    Annotated<Schema>
  >;
};

type Validator = {
  title: string;
  datum?: Parameter;
  redeemer: Parameter;
  parameters?: Parameter[];
  compiledCode: string;
  hash: string;
}

type Parameter = {
    title: string;
    schema: Declaration<Schema>;
}

class Generator {
  dataImported = false;
  imports = `// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { type Script } from "@blaze-cardano/core";
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

  static resolveSchema(schema: Declaration<Schema> | Annotated<Schema>, definitions: Record<string, Annotated<Schema>>): Schema | Annotated<Schema> {
    if ("items" in schema) {
      if (schema.items instanceof Array) {
        let items: Schema[] = schema.items;
        return {
          ...schema,
          items: items.map((item) =>
            this.resolveSchema(item, definitions),
          ),
        };
      } else {
        return {
          ...schema,
          items: this.resolveSchema(schema.items, definitions),
        };
      }
    } else if ("anyOf" in schema) {
      return {
        ...schema,
        anyOf: schema.anyOf.map(a => ({
          ...a,
          fields: a.fields.map(field => ({
            ...this.resolveSchema(field, definitions),
            title: field.title
              ? Generator.snakeToCamel(field.title)
              : undefined,
          })),
        })),
      };
    } else if ("keys" in schema && "values" in schema) {
      return {
        ...schema,
        keys: this.resolveSchema(schema.keys, definitions),
        values: this.resolveSchema(schema.values, definitions),
      };
    } else {
      if ("$ref" in schema) {
        const refKey = schema.$ref
          .replaceAll("~1", "/")
          .split("#/definitions/")[1];

        if (!refKey) {
          throw new Error(`Schema has an undefined or empty string $ref`);
        }
        if (definitions[refKey] === undefined) {
          throw new Error(`Schema refers to ${schema.$ref}, which doesn't appear in the definitions`)
        }

        const resolved = this.resolveSchema(
          definitions[refKey],
          definitions,
        );
        return resolved;
      } else {
        return schema;
      }
    }
  }

  schemaToType(schema: Schema | Annotated<Schema> | Data | Annotated<Data> | Annotated<Constructor>): string {
    if (!schema) throw new Error("Could not generate type.");

    if ("dataType" in schema) {
      switch (schema.dataType) {
        case "integer": {
          return "bigint";
        }
        case "bytes": {
          return "string";
        }
        case "constructor": {
          if (Generator.isVoid(schema)) {
            return "undefined";
          } else {
            return `{${schema.fields
              .map(
                field =>
                  `${field.title || "wrapper"}: ${this.schemaToType(field)}`,
              )
              .join(";")}}`;
          }
        }
        case "list": {
          if (schema.items instanceof Array) {
            let items: Schema[] = schema.items;
            let itemTypes = items.map(item => this.schemaToType(item));
            return `[${itemTypes.join(", ")}]`;
          } else {
            return `Array<${this.schemaToType(schema.items)}>`;
          }
        }
        case "map": {
          let keysType = this.schemaToType(schema.keys);
          let valuesType = this.schemaToType(schema.values);
          return `Map<${keysType}, ${valuesType}>`;
        }
        case undefined: {
          if (!this.dataImported) {
            this.imports += this.pdataImport;
            this.dataImported = true;
          }
          return "PlutusData";
        }
      }
    } else if ("anyOf" in schema) {
      // When enum has only one entry it's a single constructor/record object
      if (schema.anyOf.length === 1) {
        return this.schemaToType(schema.anyOf[0]);
      }
      if (Generator.isUnit(schema)) {
        throw new Error("unreachable?")
      }
      if (Generator.isBoolean(schema)) {
        return "boolean";
      }
      if (Generator.isNullable(schema)) {
        return `${this.schemaToType(schema.anyOf[0].fields[0]!)} | null`;
      }
      return schema.anyOf
        .map(entry => {
          if (entry.fields.length === 0) {
            return `"${entry.title}"`;
          }
          const key = entry.title;
          let valueType: string;
          if (entry.fields[0]?.title) {
            let fields = entry.fields.map(f => `${f.title}: ${this.schemaToType(f)}`).join(", ");
            valueType = `{ ${fields} }`;
          } else {
            let elementType = entry.fields.map(this.schemaToType).join(", ");
            valueType = `[ ${elementType} ]`;
          }

          return `{ ${key}: ${valueType} }`;
          }
        )
        .join(" | ");
    }
    throw new Error("Could not type cast data.");
  }

  static isBoolean(shape: Schema): shape is Boolean {
    return (
      "anyOf" in shape &&
      "title" in shape.anyOf[0] &&
      shape.anyOf[0]?.title === "False" &&
      shape.anyOf[1]?.title === "True"
    );
  }

  static isUnit(shape: Schema): shape is Unit {
    return (
      "anyOf" in shape &&
      "title" in shape.anyOf[0] &&
      shape.anyOf[0]?.title === "Unit"
    );
  }

  static isVoid(shape: Constructor): boolean {
    return shape.index === 0 && shape.fields.length === 0;
  }

  static isNullable(shape: Schema): shape is { "anyOf": [ { "title": "Some", fields: (Schema | Annotated<Schema>)[] }, { "title": "None" }]} {
    return (
      "anyOf" in shape &&
      "title" in shape.anyOf[0] &&
      shape.anyOf[0]?.title === "Some" &&
      shape.anyOf[1]?.title === "None"
    );
  }

  static snakeToCamel(s: string | undefined): string {
    if (!s) return "";
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
  recursiveType?: string;
};
export async function generateBlueprint({
  infile = "plutus.json",
  outfile = "plutus.ts",
  useSdk = false,
}: BlueprintArgs) {
  const plutusJson: Blueprint = JSON.parse(await fs.readFile(infile, "utf8"));

  const plutusVersion = (() => {
    switch (plutusJson.preamble.plutusVersion) {
      case "v3":
        return '"PlutusV3"';
      case "v2":
        return '"PlutusV2"';
      default:
        return '"PlutusV1"';
    }
  })();

  const definitions = plutusJson.definitions;

  const generator = new Generator();
  if (useSdk) {
    generator.useSDK();
  }
  const validators = plutusJson.validators.map((validator) => {
    const title = validator.title;
    const name = (() => {
      // Validators can reside under sub-directories and without replacing `/`
      // in the path the resulting `plutus.ts` will have validators with `/`
      // in their names.
      const processedTitle = title.replace("/", "_");
      const [a, b, c] = processedTitle.split(".");
      return (
        Generator.upperFirst(Generator.snakeToCamel(a)) +
        Generator.upperFirst(Generator.snakeToCamel(b)) +
        Generator.upperFirst(Generator.snakeToCamel(c))
      );
    })();
    const datum = validator.datum;
    const datumTitle = datum ? Generator.snakeToCamel(datum.title) : null;
    const datumSchema: Schema | Annotated<Schema> | null = datum
      ? Generator.resolveSchema(datum.schema, definitions)
      : null;

    const redeemer = validator.redeemer;
    const redeemerTitle = redeemer.title
      ? Generator.snakeToCamel(redeemer.title)
      : null;
    const redeemerSchema = Generator.resolveSchema(
      redeemer.schema,
      definitions,
    );

    const params = validator.parameters || [];
    const paramsSchema = {
      dataType: "list",
      items: params.map((param) =>
        Generator.resolveSchema(param.schema, definitions),
      ),
    };

    const paramsArgs = params.map((param, index) => [
      Generator.snakeToCamel(param.title),
      generator.schemaToType(paramsSchema.items[index]!),
    ]);

    const script = validator.compiledCode;

    return `export interface ${name} {
    new (${paramsArgs.map((param) => param.join(":")).join(",")}): Script;${datum ? `\n${datumTitle}: ${generator.schemaToType(datumSchema!)};` : ""
      }
    ${redeemerTitle ? `${redeemerTitle}: ${generator.schemaToType(redeemerSchema)};` : ""}
  };

  export const ${name} = Object.assign(
    function (${paramsArgs.map((param) => param.join(":")).join(",")}) {${paramsArgs.length > 0
        ? `return cborToScript(applyParamsToScript("${script}", [${paramsArgs
          .map((param) => param[0])
          .join(",")}], ${JSON.stringify(
            paramsSchema,
          )} as any), ${plutusVersion});`
        : `return cborToScript("${script}", ${plutusVersion});`
      }},
    ${datum ? `{${datumTitle}: ${JSON.stringify(datumSchema)}},` : ""}
    ${redeemerTitle ? `{${redeemerTitle}: ${JSON.stringify(redeemerSchema)}},` : ""}
  ) as unknown as ${name};`;
  });

  const plutus = generator.imports + "\n\n" + validators.join("\n\n");
  await fs.writeFile(outfile, plutus);
}
