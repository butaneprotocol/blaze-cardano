import { z } from "zod";

export type PConstructor = {
  dataType: "constructor";
  index: number;
  fields: PSchema[];
  title?: string;
};

export type PList = {
  dataType: "list";
  items: PSchema[] | PSchema;
  title?: string;
};

export type PEnum = {
  title?: string;
  anyOf: PConstructor[];
};

export type PMap = {
  dataType: "map";
  keys: PSchema;
  values: PSchema;
};

export type PRef = {
  title?: string;
  $ref: string;
};

export type PSchema =
  | {
      title: "Data";
      description: string;
    }
  | {
      dataType:
        | "integer"
        | "bytes"
        | `#${"unit" | "boolean" | "integer" | "bytes" | "string" | "pair" | "list"}`;
    }
  | PList
  | PConstructor
  | PEnum
  | PMap
  | PRef;

export const PConstructor: z.Schema<PConstructor> = z.object({
  dataType: z.literal("constructor"),
  index: z.number(),
  fields: z.lazy(() => z.array(PSchema)),
  title: z.string().optional(),
});

export const PList: z.Schema<PList> = z.object({
  dataType: z.literal("list"),
  items: z.lazy(() => z.union([z.array(PSchema), PSchema])),
  title: z.string().optional(),
});

export const PEnum: z.Schema<PEnum> = z.object({
  title: z.string().optional(),
  anyOf: z.array(PConstructor),
});

export const PMap: z.Schema<PMap> = z.object({
  dataType: z.literal("map"),
  keys: z.lazy(() => PSchema),
  values: z.lazy(() => PSchema),
});

export const PRef = z.object({
  title: z.string().optional(),
  $ref: z.string(),
});

export const PSchema: z.Schema<PSchema> = z.union([
  z.object({
    title: z.literal("Data"),
    description: z.string(),
  }),
  z.object({
    dataType: z.union([
      z.literal("integer"),
      z.literal("bytes"),
      z.union([
        z.literal("#unit"),
        z.literal("#boolean"),
        z.literal("#integer"),
        z.literal("#bytes"),
        z.literal("#string"),
        z.literal("#pair"),
        z.literal("#list"),
      ]),
    ]),
  }),
  PList,
  PConstructor,
  PEnum,
  PMap,
  PRef,
]);

export const PBoundary = z.object({
  title: z.string(),
  schema: PRef,
});

export const Preamble = z.object({
  title: z.string(),
  description: z.string(),
  version: z.string(),
  plutusVersion: z.enum(["v2", "v1"]),
  compiler: z.object({
    name: z.string(),
    version: z.string(),
  }),
  license: z.string(),
});

export const Validator = z.object({
  title: z.string(),
  datum: PBoundary.optional(),
  redeemer: PBoundary,
  parameters: z.array(PBoundary).optional(),
  compiledCode: z.string(),
  hash: z.string(),
});

export const Definitions = z.record(PSchema);

export const Blueprint = z
  .object({
    preamble: Preamble,
    validators: z.array(Validator),
    definitions: Definitions,
  })
  .transform((data) => {
    const transformedData = {
      preamble: data.preamble,
      validators: convertValidatorsToStructured(data.validators),
      definitions: data.definitions,
    };
    return transformedData;
  });

export type PBoundary = z.infer<typeof PBoundary>;
export type Blueprint = z.infer<typeof Blueprint>;
export type Preamble = z.infer<typeof Preamble>;
export type Validator = z.infer<typeof Validator>;
export type Definitions = z.infer<typeof Definitions>;

export type StructuredValidators = {
  title: string;
  endpoints: Record<
    string,
    {
      redeemer: {
        title: string;
        schema: {
          $ref: string;
          title?: string | undefined;
        };
      };
      datum?:
        | {
            title: string;
            schema: {
              $ref: string;
              title?: string | undefined;
            };
          }
        | undefined;
    }
  >;
  compiledCode: string;
  hash: string;
  parameters?:
    | {
        title: string;
        schema: {
          $ref: string;
          title?: string | undefined;
        };
      }[]
    | undefined;
};

export function convertValidatorsToStructured(
  validators: Validator[],
): StructuredValidators[] {
  const structuredValidators: StructuredValidators[] = [];
  const structuredMap: Record<string, number> = {};

  validators.forEach((validator) => {
    const [mainTitle, endpointTitle] = validator.title.split(".");
    const key = `${validator.hash}-${mainTitle}`;

    if (!structuredMap[key]) {
      const index = structuredValidators.length;
      structuredMap[key] = index;
      structuredValidators[index] = {
        title: mainTitle!,
        endpoints: {},
        compiledCode: validator.compiledCode,
        hash: validator.hash,
        parameters: validator.parameters,
      };
    }
    if (!endpointTitle) {
      throw new Error("Endpoint title is required");
    }

    structuredValidators[structuredMap[key]!]!.endpoints[endpointTitle!] = {
      redeemer: validator.redeemer,
      datum: validator.datum,
    };
  });
  return structuredValidators;
}
