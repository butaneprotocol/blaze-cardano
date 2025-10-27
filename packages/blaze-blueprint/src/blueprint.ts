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
  buffer: string[] = [];
  line: string = "";
  indentLevel = 0;
  indentSize = 2;

  public indent() {
    if (this.line) {
      this.finishLine();
    }
    this.indentLevel += 1;
  }

  public outdent() {
    if (this.line) {
      this.finishLine();
    }
    this.indentLevel -= 1;
  }

  private _writeLine(line?: string) {
    if (!line) {
      this.buffer.push("");
      return;
    }
    this.buffer.push(" ".repeat(this.indentLevel * this.indentSize) + line);
  }

  public writeLine(line?: string) {
    if (this.line) {
      this.finishLine();
    }
    this._writeLine(line);
  }

  public buildLine(segment: string) {
    this.line += segment;
  }

  public finishLine(segment?: string) {
    if (segment) {
      this.line += segment;
    }
    this._writeLine(this.line);
    this.line = "";
  }

  public writeImports(useSdk: boolean, plutusData: boolean) {
    this.writeLine(`/* eslint-disable */`);
    this.writeLine(`// @ts-nocheck`);
    if (useSdk) {
      this.writeLine(
        `import { applyParamsToScript, cborToScript, Core } from "@blaze-cardano/sdk"`,
      );
      this.writeLine(`type Script = Core.Script;`);
      this.writeLine(`const Script = Core.Script;`);
      if (plutusData) {
        this.writeLine(`type PlutusData = Core.PlutusData;`);
        this.writeLine(`const PlutusData = Core.PlutusData;`);
      }
    } else {
      this.writeLine(
        `import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";`,
      );
      this.writeLine(`import { type Script } from "@blaze-cardano/core";`);
      this.writeLine(
        `import { Type, Exact, TPlutusData } from "@blaze-cardano/data";`,
      );
      if (plutusData) {
        this.writeLine(
          `import { type PlutusData } from "@blaze-cardano/core";`,
        );
      }
    }

    // Map Plutus types to TS types.
    this.writeLine(`type Data = PlutusData;`);
    this.writeLine(`type Int = bigint;`);
    this.writeLine(`type ByteArray = string;`);
    this.writeLine(`const PolicyId = Type.String();`);

    if (useSdk) {
      this.writeLine(`type OutputReference = Core.TransactionInput;`);
    } else {
      this.writeLine(
        `type OutputReference = { output_index: bigint; transaction_id: string };`,
      );
    }
  }

  public isStandardType(name: string): boolean {
    return (
      name === "Void" ||
      name === "ByteArray" ||
      name === "Int" ||
      name === "Data" ||
      name === "OutputReference" ||
      name.startsWith("cardano/") ||
      name.startsWith("aiken/") ||
      name.startsWith("List") ||
      name.startsWith("Option") ||
      name.startsWith("Pairs")
    );
  }

  public definitionName(declaration: { $ref: string }): string {
    if (!("$ref" in declaration)) {
      throw new Error(
        "Unexpected declaration format: " + JSON.stringify(declaration),
      );
    }
    const fullName = declaration.$ref.replaceAll("~1", "/");
    return fullName.split("#/definitions/")[1]!;
  }

  public typeName(declaration: { $ref: string }): string {
    const name = this.definitionName(declaration);
    const parts = name.split("/");
    const type = parts[parts.length - 1]!;
    return type;
  }

  public writeModule(definitions: Record<string, Annotated<Schema>>) {
    const types = [];
    this.writeLine(`const Contracts = Type.Module({`);
    this.indent();
    for (const [name, definition] of Object.entries(definitions)) {
      if (this.isStandardType(name)) {
        continue;
      }
      if (name.startsWith("List$")) {
        continue;
      }
      const parts = name.split("/");
      const normalizedName = parts[parts.length - 1];
      types.push(normalizedName);
      this.buildLine(`${normalizedName}: `);
      this.writeTypeboxType(definition, definitions);
      this.finishLine(`,`);
    }
    this.outdent();
    this.writeLine(`});`);
    this.writeLine();
    for (const name of types) {
      this.writeLine(`export const ${name} = Contracts.Import("${name}");`);
      this.writeLine(`export type ${name} = Exact<typeof ${name}>;`);
    }
  }

  public writeValidators(blueprint: Blueprint, blueprintWithTrace?: Blueprint) {
    const plutusVersion = (() => {
      switch (blueprint.preamble.plutusVersion) {
        case "v3":
          return '"PlutusV3"';
        case "v2":
          return '"PlutusV2"';
        default:
          return '"PlutusV1"';
      }
    })();
    for (const validator of blueprint.validators) {
      const validatorWithTrace = blueprintWithTrace?.validators.find(
        (v) => v.title === validator.title,
      );
      const title = validator.title;
      const name = (() => {
        // Validators can reside under sub-directories and without replacing `/`
        // in the path the resulting `plutus.ts` will have validators with `/`
        // in their names.
        const processedTitle = title.replace("/", "_");
        const [module, validator, purpose] = processedTitle.split(".");
        return (
          Generator.upperFirst(Generator.snakeToCamel(module))! +
          Generator.upperFirst(Generator.snakeToCamel(validator))! +
          Generator.upperFirst(Generator.snakeToCamel(purpose))!
        );
      })();
      // const datum = validator.datum;
      // const datumTitle = Generator.snakeToCamel(datum?.title);
      // const datumSchema = datum?.schema;

      // const redeemer = validator.redeemer;
      // const redeemerTitle = Generator.snakeToCamel(redeemer?.title);
      // const redeemerSchema = redeemer?.schema;

      const params = validator.parameters ?? [];
      const hasParams = params.length > 0;

      // const paramsArgs = params.map((_, idx) => {
      //   const name = paramNames[idx]!;
      //   const paramType = paramTypes[idx]!;
      //   return `${name}: ${paramType}`;
      // });

      // const script = validator.compiledCode;
      // const constructorArgsString = `${paramsArgs.join(",\n  ")}`;
      // const parts = [];

      this.writeLine(`export class ${name} {`);
      this.indent();
      this.writeLine(`public Script: Script`);
      this.buildLine(`constructor(`);
      const hasConstructorArgs = hasParams || !!validatorWithTrace;
      if (hasConstructorArgs) {
        this.finishLine();
        this.indent();
      }
      if (hasParams) {
        for (const param of params) {
          this.buildLine(`${Generator.snakeToCamel(param.title)}: `);
          if ("$ref" in param.schema) {
            const typeName = this.typeName(param.schema);
            this.buildLine(typeName);
          } else {
            console.log("???", param);
          }
          this.finishLine(",");
        }
      }
      if (validatorWithTrace) {
        this.buildLine(`trace?: boolean = false`);
        this.finishLine(`,`);
      }
      if (hasConstructorArgs) {
        this.outdent();
      }
      this.finishLine(") {");
      this.indent();
      this.writeLine(`this.Script = cborToScript(`);
      this.indent();
      if (hasParams) {
        this.writeLine(`applyParamsToScript(`);
        this.indent();
      }
      if (validatorWithTrace) {
        this.writeLine(`trace`);
        this.indent();
        this.writeLine(`?`);
        this.writeLine(`"${validatorWithTrace.compiledCode}"`);
        this.finishLine(`:`);
      }
      this.writeLine(`"${validator.compiledCode}",`);
      if (validatorWithTrace) {
        this.outdent();
      }
      if (hasParams) {
        this.writeLine(`Type.Tuple([`);
        this.indent();
        for (const param of params) {
          if ("$ref" in param.schema) {
            const typeName = this.typeName(param.schema);
            if (this.isStandardType(typeName)) {
              this.writeTypeboxType(param.schema, blueprint.definitions);
            } else {
              this.buildLine(typeName);
            }
          } else {
            console.log("???", param);
          }
          this.finishLine(",");
        }
        this.outdent();
        this.writeLine(`]),`);
        this.writeLine(`[`);
        this.indent();
        for (const param of params) {
          this.writeLine(`${Generator.snakeToCamel(param.title)},`);
        }
        this.outdent();
        this.writeLine(`],`);
        this.outdent();
        this.writeLine(`),`);
      }
      this.writeLine(`${plutusVersion}`);
      this.outdent();
      this.writeLine(`);`);
      this.outdent();
      this.finishLine("}");
      this.indent();
      this.buildLine(``);
      this.outdent();
      this.outdent();
      this.writeLine(`}`);
    }
  }

  public writeTypeboxType(
    schema:
      | Declaration<Schema>
      | Annotated<Declaration<Schema>>
      | Data
      | Annotated<Data>
      | Annotated<Constructor>,
    definitions: Record<string, Annotated<Schema>>,
    stack: string[] = [],
  ) {
    if ("dataType" in schema) {
      switch (schema.dataType) {
        case "integer": {
          this.buildLine(`Type.BigInt()`);
          break;
        }
        case "bytes": {
          this.buildLine(`Type.String()`);
          break;
        }
        case "constructor": {
          if (Generator.isVoid(schema)) {
            this.buildLine(`Type.Undefined()`);
            break;
          }
          this.finishLine(`Type.Object({`);
          this.indent();
          for (const field of schema.fields) {
            this.buildLine(`${field.title || "Wrapper"}: `);
            this.writeTypeboxType(field, definitions, stack);
            this.finishLine(`,`);
          }
          this.outdent();
          this.buildLine(`}, { ctor: ${schema.index}n })`);
          break;
        }
        case "list": {
          if (schema.items instanceof Array) {
            this.finishLine(`Type.Tuple([`);
            this.indent();
            for (const item of schema.items) {
              this.writeTypeboxType(item, definitions);
              this.finishLine(",");
            }
            this.outdent();
            this.buildLine(`])`);
          } else {
            this.finishLine(`Type.Array(`);
            this.indent();
            this.writeTypeboxType(schema.items, definitions, stack);
            this.outdent();
            this.buildLine(`)`);
          }
          break;
        }
        case "map": {
          this.finishLine(`Type.Record(`);
          this.indent();
          this.writeTypeboxType(schema.keys, definitions);
          this.finishLine(",");
          this.writeTypeboxType(schema.values, definitions);
          this.finishLine(",");
          this.outdent();
          this.buildLine(")");
          break;
        }
        case undefined: {
          this.buildLine("Type.Unsafe<PlutusData>(Type.Any())");
        }
      }
    } else if ("anyOf" in schema) {
      if (schema.anyOf.length === 1) {
        this.writeTypeboxType(schema.anyOf[0], definitions, stack);
        return;
      }

      if (Generator.isUnit(schema)) {
        throw new Error("unreachable?");
      }
      if (Generator.isBoolean(schema)) {
        this.buildLine("Type.Boolean()");
        return;
      }
      if (Generator.isNullable(schema)) {
        this.finishLine("Type.Optional(");
        this.indent();
        this.writeTypeboxType(schema.anyOf[0].fields[0]!, definitions);
        this.outdent();
        this.buildLine(")");
        return;
      }

      this.finishLine(`Type.Union([`);
      this.indent();
      for (let idx = 0; idx < schema.anyOf.length; idx++) {
        const item = schema.anyOf[idx]!;
        if (item.fields.length == 0) {
          this.writeLine(`Type.Literal("${item.title!}", { ctor: ${idx}n }),`);
          continue;
        }
        this.writeLine(`Type.Object({`);
        this.indent();
        this.buildLine(`${item.title!}: `);
        if (item.fields[0]?.title) {
          this.finishLine("Type.Object({");
          this.indent();
          for (const field of item.fields) {
            this.buildLine(`${field.title}: `);
            this.writeTypeboxType(field, definitions, stack);
            this.finishLine(",");
          }
          this.outdent();
          this.finishLine(`}, { ctor: ${idx}n })`);
        } else {
          this.finishLine("Type.Tuple([");
          this.indent();
          for (const field of item.fields) {
            this.writeTypeboxType(field, definitions, stack);
            this.finishLine(",");
          }
          this.outdent();
          this.finishLine(`], { ctor: ${idx}n })`);
        }
        this.outdent();
        this.buildLine(`}),`);
      }
      this.outdent();
      this.buildLine(`])`);
    } else if ("$ref" in schema) {
      const resolvedName = this.definitionName(schema);
      const definition = definitions[resolvedName];
      if (!definition) {
        throw new Error(`Definition not found for ${resolvedName}`);
      }
      if (this.isStandardType(resolvedName)) {
        this.writeTypeboxType(definition, definitions, [
          resolvedName,
          ...stack,
        ]);
      } else {
        this.buildLine(`Type.Ref("${definition.title}")`);
      }
    } else {
      this.buildLine("Type.Unsafe<PlutusData>(Type.Any())");
    }
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
  tracedBlueprint?: string;
  outfile?: string;
  useSdk?: boolean;
  recursiveType?: string;
};

/**
 * Example documentation for this function.
 */
export async function generateBlueprint({
  infile = "plutus.json",
  tracedBlueprint = undefined,
  outfile = "plutus.ts",
  useSdk = false,
}: BlueprintArgs) {
  const plutusJson: Blueprint = JSON.parse(await fs.readFile(infile, "utf8"));

  let plutusJsonWithTrace: Blueprint | undefined;
  if (tracedBlueprint) {
    plutusJsonWithTrace = JSON.parse(
      await fs.readFile(tracedBlueprint, "utf8"),
    );
  } else {
    plutusJsonWithTrace = undefined;
  }

  const definitions = plutusJson.definitions;

  const generator = new Generator();

  generator.writeImports(useSdk, true);
  generator.writeLine();
  generator.writeModule(definitions);
  generator.writeLine();
  generator.writeValidators(plutusJson, plutusJsonWithTrace);

  const plutus = generator.buffer.join("\n");
  await fs.writeFile(outfile, plutus);
}
