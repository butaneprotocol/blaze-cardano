import type { Emulator } from "../../emulator";
import type {
  TransactionUnspentOutput,
  CredentialCore,
} from "@blaze-cardano/core";

const formatBigInt = (value: bigint) => value.toString();

export const toUtxoSnapshot = (utxo: TransactionUnspentOutput) => {
  return utxo.toCbor();
};

export const listWallets = async (emulator: Emulator) => {
  const labels = Array.from(emulator.mockedWallets.keys());
  const utxos = emulator.utxos();
  const entries = await Promise.all(
    labels.map(async (label) => {
      const address = await emulator.addressOf(label);
      const addressBech32 = address.toBech32();
      const walletUtxos = utxos.filter(
        (utxo) => utxo.output().address().toBech32() === addressBech32,
      );
      const total = walletUtxos.reduce<bigint>((acc, utxo) => {
        return acc + BigInt(utxo.output().amount().coin().toString());
      }, 0n);
      return {
        label,
        address: addressBech32,
        utxoCount: walletUtxos.length,
        lovelace: formatBigInt(total),
      };
    }),
  );

  return entries;
};

export const getGovernanceState = (emulator: Emulator) => {
  const internal = emulator as unknown as {
    ccHotCredentials: Record<string, CredentialCore | undefined>;
    lastEnactedActionByKind: Record<number, string>;
  };

  return {
    committee: {
      members: emulator.cc.members.map((member) => ({
        coldCredentialHash: member.coldCredential.hash,
        epoch: Number(member.epoch),
      })),
      quorumThreshold: emulator.cc.quorumThreshold,
      hotCredentials: Object.entries(internal.ccHotCredentials).map(
        ([coldHash, credential]) => ({
          coldCredentialHash: coldHash,
          hotCredentialHash: credential?.hash ?? null,
          credentialType: credential?.type ?? null,
        }),
      ),
    },
    constitutionalCommitteeMinSize:
      emulator.params.constitutionalCommitteeMinSize ?? null,
    governanceActionLifetime: emulator.params.governanceActionLifetime ?? null,
    lastEnactedActionByKind: internal.lastEnactedActionByKind ?? {},
    constitution: {
      anchor: emulator.constitution.anchor,
      scriptHash: emulator.constitution.scriptHash,
    },
  };
};

export interface SerializeStateOptions {
  includeWallets?: boolean;
  includeUtxos?: boolean;
  includeGovernance?: boolean;
}

export const serializeState = async (
  emulator: Emulator,
  options: SerializeStateOptions = {},
) => {
  const snapshot: Record<string, unknown> = {
    slot: emulator.clock.slot,
    epoch: emulator.clock.epoch,
    block: emulator.clock.block,
    treasury: formatBigInt(emulator.treasury),
    depositPot: formatBigInt(emulator.depositPot),
    feePot: formatBigInt(emulator.feePot),
    utxoCount: emulator.utxos().length,
    eventLoopRunning: Boolean(emulator.eventLoop),
  };

  if (options.includeWallets) {
    snapshot["wallets"] = await listWallets(emulator);
  }

  if (options.includeUtxos) {
    snapshot["utxos"] = emulator.utxos().map(toUtxoSnapshot);
  }

  if (options.includeGovernance) {
    snapshot["governance"] = getGovernanceState(emulator);
  }

  return snapshot;
};
