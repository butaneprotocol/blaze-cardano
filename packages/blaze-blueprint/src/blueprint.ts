import * as fs from "fs/promises";

type Blueprint = {
  preamble: {
    title: string;
    description: string;
    version: string;
    plutusVersion: "v2" | "v1";
    license: string;
  };
  validators: {
    title: string;
    datum?: {
      title: string;
      schema: {
        $ref: string;
      };
    };
    redeemer: {
      title: string;
      schema: {
        $ref: string;
      };
    };
    parameters?: {
      title: string;
      schema: {
        $ref: string;
      };
    }[];
    compiledCode: string;
    hash: string;
  }[];
  definitions: Record<
    string,
    {
      title: string;
      schema: {
        $ref: string;
      };
    }
  >;
};

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

  static resolveSchema(schema: any, definitions: any, refName?: string): any {
    if (schema.items) {
      if (schema.items instanceof Array) {
        return {
          ...schema,
          items: schema.items.map((item: any) =>
            this.resolveSchema(item, definitions, refName),
          ),
        };
      } else {
        return {
          ...schema,
          items: this.resolveSchema(schema.items, definitions, refName),
        };
      }
    } else if (schema.anyOf) {
      return {
        ...schema,
        anyOf: schema.anyOf.map((a: any) => ({
          ...a,
          fields: a.fields.map((field: any) => ({
            ...this.resolveSchema(field, definitions, refName),
            title: field.title
              ? Generator.snakeToCamel(field.title)
              : undefined,
          })),
        })),
      };
    } else if (schema.keys && schema.values) {
      return {
        ...schema,
        keys: this.resolveSchema(schema.keys, definitions, refName),
        values: this.resolveSchema(schema.values, definitions, refName),
      };
    } else {
      if (schema["$ref"]) {
        const refKey = schema["$ref"]
          .replaceAll("~1", "/")
          .split("#/definitions/")[1];

        if (refKey === refName) {
          return schema;
        } else {
          refName = refKey;
          const resolved = this.resolveSchema(
            definitions[refKey],
            definitions,
            refName,
          );
          return resolved;
        }
      } else {
        return schema;
      }
    }
  }

  schemaToType(schema: any): string {
    if (!schema) throw new Error("Could not generate type.");
    const shapeType = (schema.anyOf ? "enum" : "") || schema.dataType;

    switch (shapeType) {
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
              (field: any) =>
                `${field.title || "wrapper"}:${this.schemaToType(field)}`,
            )
            .join(";")}}`;
        }
      }
      case "enum": {
        // When enum has only one entry it's a single constructor/record object
        if (schema.anyOf.length === 1) {
          return this.schemaToType(schema.anyOf[0]);
        }
        if (Generator.isBoolean(schema)) {
          return "boolean";
        }
        if (Generator.isNullable(schema)) {
          return `${this.schemaToType(schema.anyOf[0].fields[0])} | null`;
        }
        return schema.anyOf
          .map((entry: any) =>
            entry.fields.length === 0
              ? `"${entry.title}"`
              : `{${entry.title}: ${
                  entry.fields[0].title
                    ? `{${entry.fields
                        .map((field: any) =>
                          [field.title, this.schemaToType(field)].join(":"),
                        )
                        .join(",")}}}`
                    : `[${entry.fields
                        .map((field: any) => this.schemaToType(field))
                        .join(",")}]}`
                }`,
          )
          .join(" | ");
      }
      case "list": {
        if (schema.items instanceof Array) {
          return `[${schema.items
            .map((item: any) => this.schemaToType(item))
            .join(",")}]`;
        } else {
          return `Array<${this.schemaToType(schema.items)}>`;
        }
      }
      case "map": {
        return `Map<${this.schemaToType(schema.keys)}, ${this.schemaToType(
          schema.values,
        )}>`;
      }
      case undefined: {
        if (!this.dataImported) {
          this.imports += this.pdataImport;
          this.dataImported = true;
        }
        return "PlutusData";
      }
    }
    throw new Error("Could not type cast data.");
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
  recursiveType?: string;
};
export async function generateBlueprint({
  infile = "plutus.json",
  outfile = "plutus.ts",
  useSdk = false,
  recursiveType,
}: BlueprintArgs) {
  const plutusJson: Blueprint = JSON.parse(await fs.readFile(infile, "utf8"));

  const plutusVersion =
    plutusJson.preamble.plutusVersion == "v2" ? '"PlutusV2"' : '"PlutusV1"';

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
      const [a, b] = processedTitle.split(".");
      return (
        Generator.upperFirst(Generator.snakeToCamel(a!)) +
        Generator.upperFirst(Generator.snakeToCamel(b!))
      );
    })();
    const datum = validator.datum;
    const datumTitle = datum ? Generator.snakeToCamel(datum.title) : null;
    const datumSchema = datum
      ? Generator.resolveSchema(datum.schema, definitions, recursiveType)
      : null;

    const redeemer = validator.redeemer;
    const redeemerTitle = Generator.snakeToCamel(redeemer.title);
    const redeemerSchema = Generator.resolveSchema(
      redeemer.schema,
      definitions,
      recursiveType,
    );

    const params = validator.parameters || [];
    const paramsSchema = {
      dataType: "list",
      items: params.map((param) =>
        Generator.resolveSchema(param.schema, definitions, recursiveType),
      ),
    };

    const paramsArgs = params.map((param, index) => [
      Generator.snakeToCamel(param.title),
      generator.schemaToType(paramsSchema.items[index]),
    ]);

    const script = validator.compiledCode;

    return `export interface ${name} {
    new (${paramsArgs.map((param) => param.join(":")).join(",")}): Script;${
      datum ? `\n${datumTitle}: ${generator.schemaToType(datumSchema)};` : ""
    }
    ${redeemerTitle}: ${generator.schemaToType(redeemerSchema)};
  };

  export const ${name} = Object.assign(
    function (${paramsArgs.map((param) => param.join(":")).join(",")}) {${
      paramsArgs.length > 0
        ? `return cborToScript(applyParamsToScript("${script}", [${paramsArgs
            .map((param) => param[0])
            .join(",")}], ${JSON.stringify(
            paramsSchema,
          )} as any), ${plutusVersion});`
        : `return cborToScript("${script}", ${plutusVersion});`
    }},
    ${datum ? `{${datumTitle}: ${JSON.stringify(datumSchema)}},` : ""}
    {${redeemerTitle}: ${JSON.stringify(redeemerSchema)}},
  ) as unknown as ${name};`;
  });

  const plutus = generator.imports + "\n\n" + validators.join("\n\n");
  await fs.writeFile(outfile, plutus);
}
