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

export class Generator {
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

  public writeImports(useSdk: boolean) {
    this.writeLine(`/* eslint-disable */`);
    this.writeLine(`// @ts-nocheck`);
    if (useSdk) {
      this.writeLine(
        `import { applyParamsToScript, cborToScript, Core } from "@blaze-cardano/sdk"`,
      );
      this.writeLine(
        `import { Type, Exact, TPlutusData } from "@blaze-cardano/data";`,
      );
      this.writeLine(`type Script = Core.Script;`);
      this.writeLine(`const Script = Core.Script;`);
    } else {
      this.writeLine(
        `import { applyParamsToScript, cborToScript } from "@blaze-cardano/uplc";`,
      );
      this.writeLine(`import { type Script } from "@blaze-cardano/core";`);
      this.writeLine(
        `import { Type, Exact, TPlutusData } from "@blaze-cardano/data";`,
      );
    }

    // Map Plutus types to TS types.
    this.writeLine(`type Data = Exact<typeof TPlutusData>;`);
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

  /**
   * Extracts type parameter names from the schema definition structure.
   * This is more reliable than parsing the definition name string.
   *
   * @param schema - The schema definition that may contain type parameter info
   * @returns Array of type parameter names, or null if not extractable from schema
   */
  private extractTypeParamsFromSchema(
    schema: Annotated<Schema> | undefined,
  ): string[] | null {
    if (!schema || !("dataType" in schema)) {
      return null;
    }

    // Tuple types: items is an array of $ref to each type param
    // e.g., "Tuple$aiken/crypto/VerificationKey_sundae/cose/COSESign1"
    if (schema.dataType === "list" && Array.isArray(schema.items)) {
      const typeParams: string[] = [];
      for (const item of schema.items) {
        if ("$ref" in item) {
          const paramName = this.definitionName(item);
          const lastSegment = paramName.split("/").pop()!;
          typeParams.push(lastSegment.replace(/~/g, "_"));
        }
      }
      if (typeParams.length > 0) {
        return typeParams;
      }
    }

    // Map/Pairs types: keys and values contain the type params
    // e.g., "Pairs$Int_Int" has keys=$ref:Int and values=$ref:Int
    if (
      schema.dataType === "map" &&
      "keys" in schema &&
      "values" in schema &&
      schema.keys &&
      schema.values
    ) {
      const typeParams: string[] = [];
      if ("$ref" in schema.keys) {
        const keyName = this.definitionName(schema.keys);
        const lastSegment = keyName.split("/").pop()!;
        typeParams.push(lastSegment.replace(/~/g, "_"));
      }
      if ("$ref" in schema.values) {
        const valueName = this.definitionName(schema.values);
        const lastSegment = valueName.split("/").pop()!;
        typeParams.push(lastSegment.replace(/~/g, "_"));
      }
      if (typeParams.length > 0) {
        return typeParams;
      }
    }

    // List types: items is a single $ref to the type param
    // e.g., "List$Int" has items=$ref:Int
    if (
      schema.dataType === "list" &&
      !Array.isArray(schema.items) &&
      schema.items &&
      "$ref" in schema.items &&
      typeof schema.items.$ref === "string"
    ) {
      const paramName = this.definitionName(schema.items as { $ref: string });
      const lastSegment = paramName.split("/").pop()!;
      return [lastSegment.replace(/~/g, "_")];
    }

    return null;
  }

  /**
   * Extracts the generic type name (the part before $) from a definition name.
   *
   * @param fullDefinitionName - The full definition name (e.g., "Tuple$aiken/crypto/Key")
   * @returns The generic type name, or null if not a generic type
   */
  private extractGenericBaseName(fullDefinitionName: string): string | null {
    const parts = fullDefinitionName.split("/");
    const genericPartIndex = parts.findIndex((part) => part.includes("$"));

    if (genericPartIndex === -1) {
      return null;
    }

    const genericPart = parts[genericPartIndex]!;
    const dollarIndex = genericPart.indexOf("$");
    return genericPart.substring(0, dollarIndex);
  }

  /**
   * Normalizes a full definition name into a valid TypeScript identifier.
   * Handles generic types by extracting type parameters from the schema when available,
   * falling back to parsing the definition name string.
   *
   * @param fullDefinitionName - The full definition name from plutus.json
   * @param schema - Optional schema definition to extract type params from structure
   * @returns A normalized TypeScript-safe type name
   */
  public normalizeTypeName(
    fullDefinitionName: string,
    schema?: Annotated<Schema>,
  ): string {
    const parts = fullDefinitionName.split("/");

    // Find the part containing "$" (indicates generic type instantiation)
    // e.g., "v0_3/types/SignedPayload$v0_3/types/ProtocolRedeemer"
    // e.g., "Tuple$aiken/crypto/VerificationKey_sundae/cose/COSESign1"
    const genericBaseName = this.extractGenericBaseName(fullDefinitionName);

    if (genericBaseName !== null) {
      // Try to extract type params from schema structure first (more reliable)
      const schemaTypeParams = this.extractTypeParamsFromSchema(schema);

      if (schemaTypeParams !== null && schemaTypeParams.length > 0) {
        return `${genericBaseName}_${schemaTypeParams.join("_")}`;
      }

      // Fallback: parse type params from the definition name string
      // This is less reliable for module names with underscores like "module_name"
      const genericPartIndex = parts.findIndex((part) => part.includes("$"));
      const genericPart = parts[genericPartIndex]!;
      const dollarIndex = genericPart.indexOf("$");

      // Reconstruct the full type parameter path after the "$"
      // e.g., "v0_3/types/ProtocolRedeemer" or "aiken/crypto/VerificationKey_sundae/cose/COSESign1"
      const remainingPath = [
        genericPart.substring(dollarIndex + 1),
        ...parts.slice(genericPartIndex + 1),
      ].join("/");

      // Multiple type params are separated by "_" followed by a module path (lowercase letter).
      // This distinguishes from underscores in module names like "v0_3" (followed by number).
      // e.g., "aiken/crypto/VerificationKey_sundae/cose/COSESign1"
      //       -> ["aiken/crypto/VerificationKey", "sundae/cose/COSESign1"]
      // But "v0_3/types/ExtraProtocolRedeemer" stays as single param (no split at "v0_3")
      // WARNING: This heuristic will incorrectly split module names like "module_name"
      const typeParamPaths = remainingPath.split(/_(?=[a-z])/);

      // Extract the last segment (type name) from each parameter path
      const typeParamNames = typeParamPaths.map((paramPath) => {
        const segments = paramPath.split("/");
        return segments[segments.length - 1]!;
      });

      // Return combined name: "GenericName_TypeParam1_TypeParam2_..."
      return `${genericBaseName}_${typeParamNames.join("_")}`.replace(
        /~/g,
        "_",
      );
    }

    // Regular types: just use the last part
    return parts[parts.length - 1]!.replace(/~/g, "_");
  }

  public typeName(
    declaration: { $ref: string },
    definitions?: Record<string, Annotated<Schema>>,
  ): string {
    const defName = this.definitionName(declaration);
    const schema = definitions?.[defName];
    return this.normalizeTypeName(defName, schema);
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
      const normalizedName = this.normalizeTypeName(name, definition);
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
            const typeName = this.typeName(param.schema, blueprint.definitions);
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
            const typeName = this.typeName(param.schema, blueprint.definitions);
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
    options: { isMapKey?: boolean } = {},
  ) {
    if ("dataType" in schema) {
      switch (schema.dataType) {
        case "integer": {
          // Map keys must be number (not BigInt) since JS object keys can't be BigInt
          this.buildLine(options.isMapKey ? `Type.Number()` : `Type.BigInt()`);
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
          // Map keys must use Number instead of BigInt for integer types
          this.writeTypeboxType(schema.keys, definitions, stack, {
            isMapKey: true,
          });
          this.finishLine(",");
          this.writeTypeboxType(schema.values, definitions, stack);
          this.finishLine(",");
          this.outdent();
          this.buildLine(")");
          break;
        }
        case undefined: {
          this.buildLine("TPlutusData");
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
        // Pass through options (e.g., isMapKey) when resolving $ref
        this.writeTypeboxType(
          definition,
          definitions,
          [resolvedName, ...stack],
          options,
        );
      } else {
        const normalizedName = this.normalizeTypeName(resolvedName, definition);
        this.buildLine(`Type.Ref("${normalizedName}")`);
      }
    } else {
      this.buildLine("TPlutusData");
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

  generator.writeImports(useSdk);
  generator.writeLine();
  generator.writeModule(definitions);
  generator.writeLine();
  generator.writeValidators(plutusJson, plutusJsonWithTrace);

  const plutus = generator.buffer.join("\n");
  await fs.writeFile(outfile, plutus);
}
