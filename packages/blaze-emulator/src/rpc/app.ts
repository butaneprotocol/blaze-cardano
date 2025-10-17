import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { type EmulatorOptions, Emulator } from '../emulator';
import { makeValue } from '@blaze-cardano/sdk';
import {
  serializeState,
  toUtxoSnapshot,
  listWallets,
  getGovernanceState,
} from './adapters/state';
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
} from '@blaze-cardano/core';

const bigIntSchema = z
  .union([z.string(), z.number(), z.bigint()])
  .transform((value) => {
    if (typeof value === 'bigint') return value;
    if (typeof value === 'number') return BigInt(value);
    return BigInt(value);
  });

const resetSchema = z.object({
  protocolParams: z.any().optional(),
  slotConfig: z
    .object({
      zeroTime: z.number().optional(),
      zeroSlot: z.number().optional(),
      slotLength: z.number().optional(),
    })
    .optional(),
  treasury: bigIntSchema.optional(),
});

const advanceSchema = z
  .object({
    blocks: z.number().int().positive().optional(),
    epochs: z.number().int().positive().optional(),
    toSlot: z.number().int().nonnegative().optional(),
    toUnix: z.number().int().nonnegative().optional(),
  })
  .refine(
    (input) =>
      input.blocks ||
      input.epochs ||
      input.toSlot !== undefined ||
      input.toUnix !== undefined,
    {
      message:
        'provide at least one of blocks, epochs, toSlot, or toUnix to advance time',
    },
  );

const registerSchema = z.object({
  label: z.string().min(1, 'label is required'),
  lovelace: bigIntSchema.optional(),
});

const fundSchema = registerSchema;

const submitSchema = z.object({
  cbor: z.string().min(1, 'transaction CBOR is required'),
});

const scriptSchema = z.object({
  cbor: z.string().min(1, 'script CBOR is required'),
});

const committeeSchema = z.object({
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
});

const hotCredentialSchema = z.object({
  coldCredentialHash: z.string().min(1),
  credentialType: z.enum(['KeyHash', 'ScriptHash']).default('KeyHash'),
  hotCredentialHash: z.string().min(1).nullable().optional(),
});

let emulator = new Emulator([]);
const scriptRegistry = new Map<string, Script>();

const app = new Hono();

const toErrorPayload = (error: unknown) => ({
  error:
    error instanceof Error
      ? { message: error.message }
      : { message: 'Unexpected error' },
});

const parseIncludeQuery = (input?: string | string[]) => {
  if (!input) return new Set<string>();
  if (Array.isArray(input)) {
    return new Set(input.flatMap((value) => value.split(',').map((v) => v.trim())));
  }
  return new Set(
    input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  );
};

const parseGovernanceActionId = (value: string) => {
  const [tx, index] = value.split(':');
  if (!tx || index === undefined) {
    throw new Error('governance action id must be txId:index');
  }
  return new GovernanceActionId(TransactionId(tx), BigInt(index));
};

const normaliseHex = (hex: string) =>
  hex.startsWith('0x') ? hex.slice(2) : hex;

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    version: emulator.constructor.name,
  }),
);

app.post('/emulator/event-loop/start', (c) => {
  emulator.startEventLoop();
  return c.json({ running: true });
});

app.post('/emulator/event-loop/stop', (c) => {
  emulator.stopEventLoop();
  return c.json({ running: false });
});

app.get('/emulator/time', (c) =>
  c.json({
    slot: emulator.clock.slot,
    epoch: emulator.clock.epoch,
    block: emulator.clock.block,
    currentUnix: emulator.clock.time,
    slotLength: emulator.clock.slotLength,
  }),
);

app.post(
  '/emulator/reset',
  zValidator('json', resetSchema),
  async (c) => {
    const body = c.req.valid('json');
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
      options.treasury = body.treasury;
    }
    emulator = new Emulator([], options);
    scriptRegistry.clear();
    return c.json({ ok: true });
  },
);

app.post(
  '/emulator/advance',
  zValidator('json', advanceSchema),
  async (c) => {
    const body = c.req.valid('json');
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

    return c.json({
      slot: emulator.clock.slot,
      epoch: emulator.clock.epoch,
      block: emulator.clock.block,
    });
  },
);

app.post(
  '/emulator/register',
  zValidator('json', registerSchema),
  async (c) => {
    const { label, lovelace } = c.req.valid('json');
    try {
      const value = lovelace !== undefined ? makeValue(lovelace) : undefined;
      const address = await emulator.register(label, value);
      return c.json({ address: address.toBech32() });
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.post(
  '/emulator/fund',
  zValidator('json', fundSchema),
  async (c) => {
    const { label, lovelace } = c.req.valid('json');
    try {
      const value = lovelace !== undefined ? makeValue(lovelace) : undefined;
      await emulator.fund(label, value);
      return c.json({ ok: true });
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.get('/emulator/address/:label', async (c) => {
  const { label } = c.req.param();
  if (!emulator.mockedWallets.has(label)) {
    return c.json({ error: { message: 'wallet not found' } }, 404);
  }
  const address = await emulator.addressOf(label);
  return c.json({ address: address.toBech32() });
});

app.get('/emulator/wallets', async (c) => {
  const wallets = await listWallets(emulator);
  return c.json(wallets);
});

app.get('/emulator/wallets/:label/utxos', async (c) => {
  const { label } = c.req.param();
  if (!emulator.mockedWallets.has(label)) {
    return c.json({ error: { message: 'wallet not found' } }, 404);
  }
  const address = await emulator.addressOf(label);
  const addressBech32 = address.toBech32();
  const utxos = emulator
    .utxos()
    .filter((utxo) => utxo.output().address().toBech32() === addressBech32)
    .map(toUtxoSnapshot);
  return c.json(utxos);
});

app.get('/emulator/utxos', (c) => {
  const utxos = emulator.utxos().map(toUtxoSnapshot);
  return c.json(utxos);
});

app.post(
  '/emulator/scripts',
  zValidator('json', scriptSchema),
  async (c) => {
    const { cbor } = c.req.valid('json');
    try {
      const script = Script.fromCbor(HexBlob(normaliseHex(cbor)));
      emulator.publishScript(script);
      scriptRegistry.set(script.hash().toString(), script);
      return c.json({ hash: script.hash().toString() });
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.get('/emulator/scripts/:hash', (c) => {
  const { hash } = c.req.param();
  const script = scriptRegistry.get(hash);
  if (!script) {
    return c.json({ error: { message: 'script not found' } }, 404);
  }
  try {
    const utxo = emulator.lookupScript(script);
    return c.json(toUtxoSnapshot(utxo));
  } catch (error) {
    return c.json(toErrorPayload(error), 400);
  }
});

app.get('/emulator/governance/committee', (c) =>
  c.json(getGovernanceState(emulator).committee),
);

app.post(
  '/emulator/governance/committee',
  zValidator('json', committeeSchema),
  (c) => {
    const { quorumThreshold, members } = c.req.valid('json');
    try {
      emulator.setCommitteeState(
        {
          quorumThreshold,
          members: members.map((member) => ({
            coldCredential: {
              type: CredentialType.KeyHash,
              hash: Hash28ByteBase16(member.coldCredentialHash),
            },
            epoch: EpochNo(member.epoch),
          })),
        },
      );
      return c.json(getGovernanceState(emulator).committee);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.post(
  '/emulator/governance/committee/hot',
  zValidator('json', hotCredentialSchema),
  (c) => {
    const { coldCredentialHash, credentialType, hotCredentialHash } =
      c.req.valid('json');
    try {
      const credential =
        hotCredentialHash == null
          ? undefined
          : ({
              hash: Hash28ByteBase16(hotCredentialHash),
              type:
                credentialType === 'ScriptHash'
                  ? CredentialType.ScriptHash
                  : CredentialType.KeyHash,
            } satisfies CredentialCore);
      emulator.setCommitteeHotCredential(
        Hash28ByteBase16(coldCredentialHash),
        credential,
      );
      return c.json(getGovernanceState(emulator).committee);
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.get('/emulator/governance/proposal-status/:id', (c) => {
  const { id } = c.req.param();
  try {
    const actionId = parseGovernanceActionId(id);
    const status = emulator.getGovernanceProposalStatus(actionId);
    if (!status) {
      return c.json({ error: { message: 'unknown proposal' } }, 404);
    }
    return c.json({ status });
  } catch (error) {
    return c.json(toErrorPayload(error), 400);
  }
});

app.get('/emulator/governance/tallies/:id', (c) => {
  const { id } = c.req.param();
  try {
    const actionId = parseGovernanceActionId(id);
    const tallies = emulator.getTallies(actionId);
    if (!tallies) {
      return c.json({ error: { message: 'unknown proposal' } }, 404);
    }
    return c.json(tallies);
  } catch (error) {
    return c.json(toErrorPayload(error), 400);
  }
});

app.get('/emulator/governance/dreps', (c) =>
  c.json(
    Object.entries(emulator.dreps).map(([hash, state]) => ({
      hash,
      deposit: state.deposit.toString(),
      expiryEpoch: state.expiryEpoch ?? null,
      isRegistered: state.isRegistered,
    })),
  ),
);

app.post(
  '/emulator/transactions',
  zValidator('json', submitSchema),
  async (c) => {
    const { cbor } = c.req.valid('json');
    try {
      const tx = Transaction.fromCbor(TxCBOR(normaliseHex(cbor)));
      const txId = await emulator.submitTransaction(tx);
      return c.json({ txId: txId.toString() });
    } catch (error) {
      return c.json(toErrorPayload(error), 400);
    }
  },
);

app.get('/emulator/state', async (c) => {
  const includes = parseIncludeQuery(c.req.query('include'));
  const snapshot = await serializeState(emulator, {
    includeWallets: includes.has('wallets'),
    includeUtxos: includes.has('utxos'),
    includeGovernance: includes.has('governance'),
  });
  return c.json(snapshot);
});

export default app;
export type AppType = typeof app;
