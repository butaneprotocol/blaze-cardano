import * as fs from "fs/promises";
import type { Schema, Unit } from "./schema";
import type { Annotated, Declaration } from "./shared";
import type { Constructor, Data } from "./data";

type Blueprint = {
  preamble: {
    title: string;
    description: string;
    version: string;
    plutusVersion: "v3" | "v2" | "v1";
    license: string;
  };
  validators: Validator[];
  definitions: Record<string, Annotated<Schema>>;
};

type Validator = {
  title: string;
  datum?: Parameter;
  redeemer: Parameter;
  parameters?: Parameter[];
  compiledCode: string;
  hash: string;
};

type Parameter = {
  title: string;
  schema: Declaration<Schema>;
};

class Generator {
  dataImported = false;
  imports = `// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { type Script } from "@blaze-cardano/core";
import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";`;

  pdataImport = `import { type PlutusData } from "@blaze-cardano/core";`;

  refTypeNames = new Map<string, string>();

  useSDK() {
    this.imports = `// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { applyParamsToScript, cborToScript, Core } from "@blaze-cardano/sdk";
type Script = Core.Script;
const Script = Core.Script;`;

    this.pdataImport = `type PlutusData = Core.PlutusData;
const PlutusData = Core.PlutusData;`;
  }

  static inlineSchema(
    schema: Declaration<Schema> | Annotated<Schema>,
    definitions: Record<string, Annotated<Schema>>,
    stack: string[] = [],
  ): Schema | Annotated<Schema> {
    if ("items" in schema) {
      if (schema.items instanceof Array) {
        const items: Schema[] = schema.items;
        return {
          ...schema,
          items: items.map((item) =>
            this.inlineSchema(item, definitions, stack),
          ),
        };
      } else {
        return {
          ...schema,
          items: this.inlineSchema(schema.items, definitions, stack),
        };
      }
    } else if ("anyOf" in schema) {
      return {
        ...schema,
        anyOf: schema.anyOf.map((a) => ({
          ...a,
          fields: a.fields.map((field) => ({
            ...this.inlineSchema(field, definitions, stack),
            title: field.title
              ? Generator.snakeToCamel(field.title)
              : undefined,
          })),
        })),
      };
    } else if ("keys" in schema && "values" in schema) {
      return {
        ...schema,
        keys: this.inlineSchema(schema.keys, definitions, stack),
        values: this.inlineSchema(schema.values, definitions, stack),
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
          throw new Error(
            `Schema refers to ${schema.$ref}, which doesn't appear in the definitions`,
          );
        }
        if (stack.includes(refKey)) {
          console.warn(
            `Schema ${refKey} is recursive, which isn't supported quite yet; buttoming out with any.`,
          );
          return `any`;
        }

        const resolved = this.inlineSchema(definitions[refKey], definitions, [
          refKey,
          ...stack,
        ]);
        return resolved;
      } else {
        return schema;
      }
    }
  }

  schemaToType(
    schema:
      | Declaration<Schema>
      | Annotated<Declaration<Schema>>
      | Data
      | Annotated<Data>
      | Annotated<Constructor>,
    definitions: Record<string, Annotated<Schema>>,
  ): string {
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
                (field) =>
                  `${field.title || "wrapper"}: ${this.schemaToType(field, definitions)}`,
              )
              .join(";")}}`;
          }
        }
        case "list": {
          if (schema.items instanceof Array) {
            const items: Schema[] = schema.items;
            const itemTypes = items.map((item) =>
              this.schemaToType(item, definitions),
            );
            return `[${itemTypes.join(", ")}]`;
          } else {
            return `Array<${this.schemaToType(schema.items, definitions)}>`;
          }
        }
        case "map": {
          const keysType = this.schemaToType(schema.keys, definitions);
          const valuesType = this.schemaToType(schema.values, definitions);
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
        return this.schemaToType(schema.anyOf[0], definitions);
      }
      if (Generator.isUnit(schema)) {
        throw new Error("unreachable?");
      }
      if (Generator.isBoolean(schema)) {
        return "boolean";
      }
      if (Generator.isNullable(schema)) {
        return `${this.schemaToType(schema.anyOf[0].fields[0]!, definitions)} | null`;
      }
      return schema.anyOf
        .map((entry) => {
          if (entry.fields.length === 0) {
            return `"${entry.title}"`;
          }
          const key = entry.title;
          let valueType: string;
          if (entry.fields[0]?.title) {
            const fields = entry.fields
              .map((f) => `${f.title}: ${this.schemaToType(f, definitions)}`)
              .join(", ");
            valueType = `{ ${fields} }`;
          } else {
            const elementType = entry.fields
              .map((f) => this.schemaToType(f, definitions))
              .join(", ");
            valueType = `[ ${elementType} ]`;
          }

          return `{ ${key}: ${valueType} }`;
        })
        .join(" | ");
    } else if ("$ref" in schema) {
      const fullName = schema.$ref.replaceAll("~1", "/");
      const refKey = fullName.split("#/definitions/")[1];
      if (!refKey) {
        throw new Error(`Schema has an undefined or empty string $ref`);
      }
      if (definitions[refKey] === undefined) {
        throw new Error(
          `Schema refers to ${schema.$ref} (${refKey}), which doesn't appear in the definitions`,
        );
      }
      if (this.refTypeNames.has(refKey)) {
        return this.refTypeNames.get(refKey)!;
      }
      return this.schemaToType(definitions[refKey], definitions);
    } else {
      return "any";
    }
    throw new Error("Could not type cast data.");
  }

  static isBoolean(shape: Schema): shape is boolean {
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

  static isNullable(shape: Schema): shape is {
    anyOf: [
      { title: "Some"; fields: (Schema | Annotated<Schema>)[] },
      { title: "None" },
    ];
  } {
    return (
      "anyOf" in shape &&
      "title" in shape.anyOf[0] &&
      shape.anyOf[0]?.title === "Some" &&
      shape.anyOf[1]?.title === "None"
    );
  }

  static snakeToCamel(s: string | undefined): string | undefined {
    if (!s) return undefined;
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

  static upperFirst(s: string | undefined): string | undefined {
    if (!s) return undefined;
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
  for (const key of Object.keys(definitions)) {
    // TODO: it would be nice to have a better sense of what definitions we should emit and which not
    if (key.startsWith("List")) {
      continue;
    }
    if (key.startsWith("Pair")) {
      continue;
    }
    const typeName = key.replaceAll("/", "_");
    generator.refTypeNames.set(key, typeName);
  }
  console.log(generator.refTypeNames);

  const typeDefinitionParts = [];
  for (const [key, typeName] of generator.refTypeNames.entries()) {
    const value = definitions[key]!;
    typeDefinitionParts.push(
      `export type ${typeName} = ${generator.schemaToType(value, definitions)};`,
    );
  }

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
        Generator.upperFirst(Generator.snakeToCamel(a))! +
        Generator.upperFirst(Generator.snakeToCamel(b))! +
        Generator.upperFirst(Generator.snakeToCamel(c))!
      );
    })();
    const datum = validator.datum;
    const datumTitle = Generator.snakeToCamel(datum?.title);
    const datumSchema = datum?.schema;

    const redeemer = validator.redeemer;
    const redeemerTitle = Generator.snakeToCamel(redeemer?.title);
    const redeemerSchema = redeemer?.schema;

    const params = validator.parameters || [];

    const paramNames = params.map((param) =>
      Generator.snakeToCamel(param.title),
    );
    const paramsSchema = {
      dataType: "list",
      items: params.map((param) =>
        Generator.inlineSchema(param.schema, definitions),
      ),
    };
    const paramTypes = params.map((param) =>
      generator.schemaToType(param.schema, definitions),
    );
    const paramsArgs = params.map((_, idx) => {
      const name = paramNames[idx]!;
      const paramType = paramTypes[idx]!;
      return `${name}: ${paramType}`;
    });

    const script = validator.compiledCode;
    const constructorArgsString = `${paramsArgs.join(",\n  ")}`;
    const parts = [];

    parts.push(
      `export interface ${name} {`,
      `  scriptBytes: string;`,
      `  new(${constructorArgsString}): Script;`,
    );
    if (datum) {
      parts.push(
        `  ${datumTitle}: ${generator.schemaToType(datumSchema!, definitions)};`,
      );
    }
    if (redeemer) {
      parts.push(
        `  ${redeemerTitle}: ${generator.schemaToType(redeemerSchema, definitions)};`,
      );
    }
    parts.push("}");

    parts.push(
      `export const ${name} = Object.assign(`,
      `  function (${paramsArgs.join(",")}) {`,
    );
    if (paramsArgs.length > 0) {
      parts.push(
        `    return cborToScript(`,
        `      applyParamsToScript(`,
        `        ${name}.scriptBytes, `,
        `        [${paramNames.join(", ")}],`,
        `        ${JSON.stringify(paramsSchema)} as any,`,
        `      ),`,
        `      ${plutusVersion},`,
        `    );`,
      );
    } else {
      parts.push(`    return cborToScript("${script}", ${plutusVersion});`);
    }
    parts.push("  },");
    parts.push(`  { scriptBytes: "${script}" },`);
    if (datum) {
      parts.push(
        `  { ${datumTitle}: ${JSON.stringify(Generator.inlineSchema(datumSchema!, definitions))} },`,
      );
    }
    if (redeemer) {
      parts.push(
        `  { ${redeemerTitle}: ${JSON.stringify(Generator.inlineSchema(redeemerSchema!, definitions))} },`,
      );
    }
    parts.push(`) as unknown as ${name};\n`);

    return parts.join("\n");
  });

  const plutus = [
    generator.imports,
    "\n",
    typeDefinitionParts.join("\n"),
    "\n",
    validators.join("\n\n"),
  ].join("\n");
  await fs.writeFile(outfile, plutus);
}
