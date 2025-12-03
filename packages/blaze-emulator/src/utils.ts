import {
  PoolId,
  CertificateType,
  TransactionId,
  TransactionInput,
} from "@blaze-cardano/core";
import type { Ed25519KeyHashHex } from "@blaze-cardano/core";
import type {
  CertificateCore,
  Cardano,
  GovernanceActionId,
} from "@blaze-cardano/core";
import { type SerialisedGovId, type SerialisedInput } from "./types";

type LegacyStakeCertificate = Extract<
  CertificateCore,
  {
    __typename:
      | typeof CertificateType.StakeRegistration
      | typeof CertificateType.StakeDeregistration;
  }
>;

export const serialiseInput = (input: TransactionInput): SerialisedInput =>
  `${input.transactionId()}:${input.index()}`;

export const deserialiseInput = (input: SerialisedInput): TransactionInput => {
  const [txId, index] = input.split(":");
  return new TransactionInput(TransactionId(txId!), BigInt(index!));
};

export const serialiseGovId = (
  id: GovernanceActionId | ReturnType<GovernanceActionId["toCore"]>,
): SerialisedGovId => {
  if ("toCore" in id) {
    id = id.toCore();
  }
  return `${id.id}:${BigInt(id.actionIndex)}`;
};

// Certificates that carry a deposit field (e.g. stake registrations)
export type CertificateWithDeposit = CertificateCore & {
  deposit?: number | bigint;
};

export const hasDeposit = (
  core: CertificateCore,
): core is CertificateWithDeposit => "deposit" in core;

export const certificateDeposit = (core: CertificateCore): bigint =>
  hasDeposit(core) ? BigInt(core.deposit ?? 0) : 0n;

export const isLegacyStakeCertificate = (
  cert: CertificateCore,
): cert is LegacyStakeCertificate => {
  return (
    cert.__typename === CertificateType.StakeRegistration ||
    cert.__typename === CertificateType.StakeDeregistration
  );
};

export const fractionMax = (...fractions: Cardano.Fraction[]) => {
  return fractions.reduce(
    (max, fraction) => {
      return fraction.numerator / fraction.denominator >
        max.numerator / max.denominator
        ? fraction
        : max;
    },
    { numerator: 0, denominator: 1 },
  );
};

export const toPoolIdKey = (hash: Ed25519KeyHashHex): PoolId | null => {
  try {
    return PoolId.fromKeyHash(hash);
  } catch {
    return null;
  }
};

export const fractionAtLeast = (
  yes: bigint,
  no: bigint,
  thresh?: Cardano.Fraction,
): boolean => {
  if (!thresh) return true;
  const total = yes + no;
  if (total === 0n) return BigInt(thresh.numerator) === 0n;
  const num = BigInt(thresh.numerator);
  const den = BigInt(thresh.denominator);
  return yes * den >= num * total;
};
