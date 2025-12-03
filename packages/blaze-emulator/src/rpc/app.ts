import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { Emulator } from "../emulator";
import { type EmulatorOptions } from "../types";
import type { Context } from "hono";
import { makeValue } from "@blaze-cardano/sdk";
import {
  serializeState,
  toUtxoSnapshot,
  listWallets,
  getGovernanceState,
} from "./adapters/state";
import {
  CredentialType,
  type CredentialCore,
  EpochNo,
  GovernanceActionId,
  Hash28ByteBase16,
  Script,
  HexBlob,
  Transaction,
  TransactionId,
  TxCBOR,
} from "@blaze-cardano/core";

const bigIntSchema = z
  .union([z.string(), z.number(), z.bigint()])
  .transform((value: string | number | bigint) => {
    if (typeof value === "bigint") return value;
    if (typeof value === "number") return BigInt(value);
    return BigInt(value);
  })
  .openapi({
    description: "Integer encoded as string or number.",
    example: "1000000",
  });

const resetSchema = z
  .object({
    protocolParams: z.any().optional(),
    slotConfig: z
      .object({
        zeroTime: z.number().optional(),
        zeroSlot: z.number().optional(),
        slotLength: z.number().optional(),
      })
      .optional(),
    treasury: bigIntSchema.optional(),
  })
  .openapi("ResetRequest");

const advanceSchema = z
  .object({
    blocks: z.number().int().positive().optional(),
    epochs: z.number().int().positive().optional(),
    toSlot: z.number().int().nonnegative().optional(),
    toUnix: z.number().int().nonnegative().optional(),
  })
  .refine(
    (input: {
      blocks?: number;
      epochs?: number;
      toSlot?: number;
      toUnix?: number;
    }) =>
      input.blocks ||
      input.epochs ||
      input.toSlot !== undefined ||
      input.toUnix !== undefined,
    {
      message:
        "provide at least one of blocks, epochs, toSlot, or toUnix to advance time",
    },
  )
  .openapi("AdvanceRequest");

const registerSchema = z
  .object({
    label: z.string().min(1, "label is required"),
    lovelace: bigIntSchema.optional(),
  })
  .openapi("WalletRequest");

const transactionPayload = z
  .object({
    cbor: z.string().min(1, "transaction CBOR is required"),
  })
  .openapi("TransactionPayload");

const scriptPayload = z
  .object({
    cbor: z.string().min(1, "script CBOR is required"),
  })
  .openapi("ScriptPayload");

const committeeSchema = z
  .object({
    quorumThreshold: z.object({
      numerator: z.number().int().nonnegative(),
      denominator: z.number().int().positive(),
    }),
    members: z
      .array(
        z.object({
          coldCredentialHash: z.string().min(1),
          epoch: z.number().int().nonnegative(),
        }),
      )
      .default([]),
  })
  .openapi("CommitteeRequest");

const hotCredentialSchema = z
  .object({
    coldCredentialHash: z.string().min(1),
    credentialType: z.enum(["KeyHash", "ScriptHash"]).default("KeyHash"),
    hotCredentialHash: z.string().min(1).nullable().optional(),
  })
  .openapi("CommitteeHotRequest");

const runningResponse = z
  .object({
    running: z.boolean(),
  })
  .openapi("RunningResponse");

const healthResponse = z
  .object({
    status: z.string(),
    version: z.string(),
  })
  .openapi("HealthResponse");

const clockResponse = z
  .object({
    slot: z.number(),
    epoch: z.number(),
    block: z.number(),
    currentUnix: z.number(),
    slotLength: z.number(),
  })
  .openapi("ClockResponse");

const okResponse = z
  .object({
    ok: z.boolean(),
  })
  .openapi("OkResponse");

const txResponse = z
  .object({
    txId: z.string(),
  })
  .openapi("TransactionResponse");

const addressResponse = z
  .object({
    address: z.string(),
  })
  .openapi("AddressResponse");

const walletSummary = z
  .object({
    label: z.string(),
    address: z.string(),
    utxoCount: z.number(),
    lovelace: z.string(),
  })
  .openapi("WalletSummary");

const walletList = z.array(walletSummary).openapi("WalletList");

const utxoArray = z.array(z.string()).openapi("UtxoList");

const committeeResponseSchema = z
  .object({
    members: z.array(
      z.object({
        coldCredentialHash: z.string(),
        epoch: z.number(),
      }),
    ),
    quorumThreshold: z.object({
      numerator: z.number(),
      denominator: z.number(),
    }),
    hotCredentials: z.array(
      z.object({
        coldCredentialHash: z.string(),
        hotCredentialHash: z.string().nullable(),
        credentialType: z.string().nullable(),
      }),
    ),
  })
  .openapi("CommitteeResponse");

const drepsResponse = z
  .array(
    z.object({
      hash: z.string(),
      deposit: z.string(),
      expiryEpoch: z.number().nullable(),
      isRegistered: z.boolean(),
    }),
  )
  .openapi("DRepList");

const parseJson = async <T>(c: Context, schema: z.ZodSchema<T>): Promise<T> =>
  schema.parse(await c.req.json());

const parseQuery = <T>(c: Context, schema: z.ZodSchema<T>): T =>
  schema.parse(c.req.query());

const parseParams = <T>(c: Context, schema: z.ZodSchema<T>): T =>
  schema.parse(c.req.param());

const proposalStatusResponse = z
  .object({
    status: z.string(),
  })
  .openapi("ProposalStatus");

const tallySchema = z
  .object({
    yes: z.string(),
    no: z.string(),
  })
  .openapi("Tally");

const talliesSchema = z
  .object({
    drep: tallySchema,
    spo: tallySchema,
    cc: tallySchema,
  })
  .openapi("Tallies");

const talliesResponseSchema = z
  .object({
    tallies: talliesSchema,
    activeCcMembers: z.string(),
  })
  .openapi("TalliesResponse");

const errorResponse = z
  .object({
    error: z.object({
      message: z.string(),
    }),
  })
  .openapi("ErrorResponse");

const idParamSchema = z
  .object({
    id: z.string().openapi({ example: "abcd1234:0" }),
  })
  .openapi("ActionIdParams");

const labelParamSchema = z
  .object({
    label: z.string(),
  })
  .openapi("LabelParams");

const hashParamSchema = z
  .object({
    hash: z.string(),
  })
  .openapi("ScriptHashParams");

const includeQuerySchema = z
  .object({
    include: z.string().optional(),
  })
  .openapi("StateQuery");

const stateSnapshotSchema = z
  .object({})
  .catchall(z.unknown())
  .openapi("StateSnapshot");

type AppEnv = {
  Variables: Record<string, unknown>;
  Bindings: Record<string, unknown>;
  Validated: {
    json: unknown;
    query: unknown;
    param: unknown;
  };
};

let emulator = new Emulator([]);
const scriptRegistry = new Map<string, Script>();

const app = new OpenAPIHono<AppEnv>();

const toErrorPayload = (error: unknown) => ({
  error:
    error instanceof Error
      ? { message: error.message }
      : { message: "Unexpected error" },
});

const parseIncludeQuery = (input?: string | string[]) => {
  if (!input) return new Set<string>();
  if (Array.isArray(input)) {
    return new Set(
      input.flatMap((value) => value.split(",").map((v) => v.trim())),
    );
  }
  return new Set(
    input
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
};

const parseGovernanceActionId = (value: string) => {
  const [tx, index] = value.split(":");
  if (!tx || index === undefined) {
    throw new Error("governance action id must be txId:index");
  }
  return new GovernanceActionId(TransactionId(tx), BigInt(index));
};

const normaliseHex = (hex: string) =>
  hex.startsWith("0x") ? hex.slice(2) : hex;

const serializeCredentialType = (
  type: CredentialType | null | undefined,
): string | null => {
  if (type === null || type === undefined) return null;
  const label = (CredentialType as unknown as Record<number, string>)[type];
  return label ?? String(type);
};

const serializeCommittee = () => {
  const committee = getGovernanceState(emulator).committee;
  return {
    members: committee.members.map(
      (member: { coldCredentialHash: string | Hash28ByteBase16; epoch: number }) => ({
        coldCredentialHash: member.coldCredentialHash.toString(),
        epoch: member.epoch,
      }),
    ),
    quorumThreshold: committee.quorumThreshold,
    hotCredentials: committee.hotCredentials.map(
      (credential: {
        coldCredentialHash: string | Hash28ByteBase16;
        hotCredentialHash?: Hash28ByteBase16 | null;
        credentialType?: CredentialType | null;
      }) => ({
        coldCredentialHash: credential.coldCredentialHash.toString(),
        hotCredentialHash: credential.hotCredentialHash
          ? credential.hotCredentialHash.toString()
          : null,
        credentialType: serializeCredentialType(credential.credentialType),
      }),
    ),
  };
};

const serializeTallies = (
  result: NonNullable<ReturnType<Emulator["getTallies"]>>,
): { tallies: { drep: { yes: string; no: string }; spo: { yes: string; no: string }; cc: { yes: string; no: string } }; activeCcMembers: string } => {
  const tallyToString = (tally: { yes: bigint; no: bigint }) => ({
    yes: tally.yes.toString(),
    no: tally.no.toString(),
  });
  return {
    tallies: {
      drep: tallyToString(result.tallies.drep),
      spo: tallyToString(result.tallies.spo),
      cc: tallyToString(result.tallies.cc),
    },
    activeCcMembers: result.activeCcMembers.toString(),
  };
};

app.openapi(
  createRoute({
    method: "get",
    path: "/health",
    tags: ["health"],
    responses: {
      200: {
        description: "Health status.",
        content: {
          "application/json": {
            schema: healthResponse,
          },
        },
      },
    },
  }),
  (c: Context) =>
    c.json(
      {
        status: "ok",
        version: emulator.constructor.name,
      },
      200,
    ),
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/event-loop/start",
    tags: ["health"],
    responses: {
      200: {
        description: "Event loop status.",
        content: {
          "application/json": { schema: runningResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    emulator.startEventLoop();
    return c.json({ running: true }, 200);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/event-loop/stop",
    tags: ["health"],
    responses: {
      200: {
        description: "Event loop status.",
        content: {
          "application/json": { schema: runningResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    emulator.stopEventLoop();
    return c.json({ running: false }, 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/time",
    tags: ["health"],
    responses: {
      200: {
        description: "Current emulator clock.",
        content: {
          "application/json": { schema: clockResponse },
        },
      },
    },
  }),
  (c: Context) =>
    c.json(
      {
        slot: emulator.clock.slot,
        epoch: emulator.clock.epoch,
        block: emulator.clock.block,
        currentUnix: emulator.clock.time,
        slotLength: emulator.clock.slotLength,
      },
      200,
    ),
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/reset",
    tags: ["wallets"],
    request: {
      body: {
        content: {
          "application/json": { schema: resetSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Reset completed.",
        content: {
          "application/json": { schema: okResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const body = await parseJson(c, resetSchema);
    const options: EmulatorOptions = {};
    if (body.protocolParams) {
      options.params = body.protocolParams;
    }
    if (body.slotConfig) {
      options.slotConfig = {
        zeroTime: body.slotConfig.zeroTime ?? 0,
        zeroSlot: body.slotConfig.zeroSlot ?? 0,
        slotLength: body.slotConfig.slotLength ?? 1000,
      };
    }
    if (body.treasury !== undefined) {
      options.treasury = BigInt(body.treasury);
    }
    emulator = new Emulator([], options);
    scriptRegistry.clear();
    return c.json({ ok: true }, 200);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/advance",
    tags: ["health"],
    request: {
      body: {
        content: {
          "application/json": { schema: advanceSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Updated clock state.",
        content: {
          "application/json": {
            schema: clockResponse.pick({
              slot: true,
              epoch: true,
              block: true,
            }),
          },
        },
      },
      400: {
        description: "Advance failed.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const body = await parseJson(c, advanceSchema);
    try {
      if (body.toSlot !== undefined) {
        emulator.stepForwardToSlot(body.toSlot);
      } else if (body.toUnix !== undefined) {
        emulator.stepForwardToUnix(body.toUnix);
      } else if (body.epochs) {
        for (let i = 0; i < body.epochs; i += 1) {
          emulator.stepForwardToNextEpoch();
        }
      } else {
        const blocks = body.blocks ?? 1;
        for (let i = 0; i < blocks; i += 1) {
          emulator.stepForwardBlock();
        }
      }
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }

    return c.json(
      {
        slot: emulator.clock.slot,
        epoch: emulator.clock.epoch,
        block: emulator.clock.block,
      },
      200,
    );
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/register",
    tags: ["wallets"],
    request: {
      body: {
        content: {
          "application/json": { schema: registerSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Wallet address.",
        content: {
          "application/json": { schema: addressResponse },
        },
      },
      400: {
        description: "Registration failed.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { label, lovelace } = await parseJson(c, registerSchema);
    try {
      const value = lovelace !== undefined ? makeValue(BigInt(lovelace)) : undefined;
      const address = await emulator.register(label, value);
      return c.json({ address: address.toBech32() }, 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/fund",
    tags: ["wallets"],
    request: {
      body: {
        content: {
          "application/json": { schema: registerSchema },
        },
      },
    },
    responses: {
      200: {
        description: "Wallet funded.",
        content: {
          "application/json": { schema: okResponse },
        },
      },
      400: {
        description: "Funding failed.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { label, lovelace } = await parseJson(c, registerSchema);
    try {
      const value = lovelace !== undefined ? makeValue(BigInt(lovelace)) : undefined;
      await emulator.fund(label, value);
      return c.json({ ok: true }, 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/address/{label}",
    tags: ["wallets"],
    request: {
      params: labelParamSchema,
    },
    responses: {
      200: {
        description: "Wallet address.",
        content: {
          "application/json": { schema: addressResponse },
        },
      },
      404: {
        description: "Wallet not found.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { label } = parseParams(c, labelParamSchema);
    if (!emulator.mockedWallets.has(label)) {
      return c.json({ error: { message: "wallet not found" } }, 404);
    }
    const address = await emulator.addressOf(label);
    return c.json({ address: address.toBech32() }, 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/wallets",
    tags: ["wallets"],
    responses: {
      200: {
        description: "Registered wallets.",
        content: {
          "application/json": { schema: walletList },
        },
      },
    },
  }),
  async (c: Context) => {
    const wallets = await listWallets(emulator);
    return c.json(wallets, 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/wallets/{label}/utxos",
    tags: ["wallets"],
    request: { params: labelParamSchema },
    responses: {
      200: {
        description: "UTxOs owned by the wallet.",
        content: {
          "application/json": { schema: utxoArray },
        },
      },
      404: {
        description: "Wallet not found.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { label } = parseParams(c, labelParamSchema);
    if (!emulator.mockedWallets.has(label)) {
      return c.json({ error: { message: "wallet not found" } }, 404);
    }
    const address = await emulator.addressOf(label);
    const addressBech32 = address.toBech32();
    const utxos = emulator
      .utxos()
      .filter((utxo) => utxo.output().address().toBech32() === addressBech32)
      .map(toUtxoSnapshot);
    return c.json(utxos, 200);
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/utxos",
    tags: ["wallets"],
    responses: {
      200: {
        description: "All ledger UTxOs.",
        content: {
          "application/json": { schema: utxoArray },
        },
      },
    },
  }),
  (c: Context) => c.json(emulator.utxos().map(toUtxoSnapshot), 200),
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/scripts",
    tags: ["scripts"],
    request: {
      body: {
        content: { "application/json": { schema: scriptPayload } },
      },
    },
    responses: {
      200: {
        description: "Script registered.",
        content: {
          "application/json": {
            schema: z
              .object({
                hash: z.string(),
              })
              .openapi("ScriptResponse"),
          },
        },
      },
      400: {
        description: "Invalid script payload.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { cbor } = await parseJson(c, transactionPayload);
    try {
      const script = Script.fromCbor(HexBlob(normaliseHex(cbor)));
      emulator.publishScript(script);
      scriptRegistry.set(script.hash().toString(), script);
      return c.json({ hash: script.hash().toString() }, 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/scripts/{hash}",
    tags: ["scripts"],
    request: { params: hashParamSchema },
    responses: {
      200: {
        description: "Script reference UTxO.",
        content: {
          "application/json": { schema: z.string() },
        },
      },
      400: {
        description: "Lookup failed.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
      404: {
        description: "Script not found.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  (c: Context) => {
    const { hash } = parseParams(c, hashParamSchema);
    const script = scriptRegistry.get(hash);
    if (!script) {
      return c.json({ error: { message: "script not found" } }, 404);
    }
    try {
      const utxo = emulator.lookupScript(script);
      return c.json(toUtxoSnapshot(utxo), 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/transactions",
    tags: ["transactions"],
    request: {
      body: {
        content: { "application/json": { schema: transactionPayload } },
      },
    },
    responses: {
      200: {
        description: "Transaction accepted.",
        content: {
          "application/json": { schema: txResponse },
        },
      },
      400: {
        description: "Submission failed.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { cbor } = await parseJson(c, scriptPayload);
    try {
      const tx = Transaction.fromCbor(TxCBOR(normaliseHex(cbor)));
      const txId = await emulator.submitTransaction(tx);
      return c.json({ txId: txId.toString() }, 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/state",
    tags: ["transactions"],
    request: {
      query: includeQuerySchema,
    },
    responses: {
      200: {
        description: "State snapshot.",
        content: {
          "application/json": { schema: stateSnapshotSchema },
        },
      },
    },
  }),
  async (c: Context) => {
    const { include } = parseQuery(c, includeQuerySchema);
    const includes = parseIncludeQuery(include);
    const snapshot = await serializeState(emulator, {
      includeWallets: includes.has("wallets"),
      includeUtxos: includes.has("utxos"),
      includeGovernance: includes.has("governance"),
    });
    return c.json(snapshot, 200);
  },
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/governance/committee",
    tags: ["governance"],
    request: {
      body: {
        content: { "application/json": { schema: committeeSchema } },
      },
    },
    responses: {
      200: {
        description: "Updated committee state.",
        content: {
          "application/json": { schema: committeeResponseSchema },
        },
      },
      400: {
        description: "Invalid committee payload.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { quorumThreshold, members } = await parseJson(c, committeeSchema);
    try {
      emulator.setCommitteeState({
        quorumThreshold,
        members: (members ?? []).map((member: { coldCredentialHash: string; epoch: number }) => ({
          coldCredential: {
            type: CredentialType.KeyHash,
            hash: Hash28ByteBase16(member.coldCredentialHash),
          },
          epoch: EpochNo(member.epoch),
        })),
      });
      return c.json(serializeCommittee(), 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/governance/committee",
    tags: ["governance"],
    responses: {
      200: {
        description: "Committee state.",
        content: {
          "application/json": { schema: committeeResponseSchema },
        },
      },
    },
  }),
  (c: Context) => c.json(serializeCommittee(), 200),
);

app.openapi(
  createRoute({
    method: "post",
    path: "/emulator/governance/committee/hot",
    tags: ["governance"],
    request: {
      body: {
        content: { "application/json": { schema: hotCredentialSchema } },
      },
    },
    responses: {
      200: {
        description: "Updated committee state.",
        content: {
          "application/json": { schema: committeeResponseSchema },
        },
      },
      400: {
        description: "Invalid credential payload.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  async (c: Context) => {
    const { coldCredentialHash, credentialType, hotCredentialHash } =
      await parseJson(c, hotCredentialSchema);
    try {
      const credential =
        hotCredentialHash == null
          ? undefined
          : ({
              hash: Hash28ByteBase16(hotCredentialHash),
              type:
                credentialType === "ScriptHash"
                  ? CredentialType.ScriptHash
                  : CredentialType.KeyHash,
            } satisfies CredentialCore);
      emulator.setCommitteeHotCredential(
        Hash28ByteBase16(coldCredentialHash),
        credential,
      );
      return c.json(serializeCommittee(), 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/governance/proposal-status/{id}",
    tags: ["governance"],
    request: { params: idParamSchema },
    responses: {
      200: {
        description: "Proposal status.",
        content: {
          "application/json": { schema: proposalStatusResponse },
        },
      },
      400: {
        description: "Malformed action id.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
      404: {
        description: "Unknown action id.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  (c: Context) => {
    const { id } = parseParams(c, idParamSchema);
    try {
      const actionId = parseGovernanceActionId(id);
      const status = emulator.getGovernanceProposalStatus(actionId);
      if (!status) {
        return c.json({ error: { message: "unknown proposal" } }, 404);
      }
      return c.json({ status }, 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/governance/tallies/{id}",
    tags: ["governance"],
    request: { params: idParamSchema },
    responses: {
      200: {
        description: "Vote tallies.",
        content: {
          "application/json": {
            schema: talliesResponseSchema,
          },
        },
      },
      400: {
        description: "Malformed action id.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
      404: {
        description: "Unknown action id.",
        content: {
          "application/json": { schema: errorResponse },
        },
      },
    },
  }),
  (c: Context) => {
    const { id } = parseParams(c, idParamSchema);
    try {
      const actionId = parseGovernanceActionId(id);
      const tallies = emulator.getTallies(actionId);
      if (!tallies) {
        return c.json({ error: { message: "unknown proposal" } }, 404);
      }
      return c.json(serializeTallies(tallies), 200);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.openapi(
  createRoute({
    method: "get",
    path: "/emulator/governance/dreps",
    tags: ["governance"],
    responses: {
      200: {
        description: "Registered DReps.",
        content: {
          "application/json": { schema: drepsResponse },
        },
      },
    },
  }),
  (c: Context) =>
    c.json(
      Object.entries(emulator.dreps).map(([hash, state]) => ({
        hash,
        deposit: state.deposit.toString(),
        expiryEpoch: state.expiryEpoch ?? null,
        isRegistered: state.isRegistered,
      })),
      200,
    ),
);

app.get("/ui", swaggerUI({ url: "/doc" }));

app.doc("/doc", (c: Context) => ({
  openapi: "3.1.0",
  info: {
    title: "Blaze Emulator RPC",
    version: "1.0.0",
    description: "HTTP interface for the Blaze emulator.",
  },
  servers: [
    {
      url: new URL(c.req.url).origin,
      description: "Current environment",
    },
  ],
}));

export default app;
export type AppType = typeof app;
