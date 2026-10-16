// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import type { Cardano } from '..';
import type { Logger } from 'ts-log';
import type { Percent } from '../../util/index';

export type HealthCheckResponse = {
  ok: boolean;
  localNode?: {
    ledgerTip?: Cardano.Tip;
    networkSync?: Percent;
  };
  projectedTip?: Cardano.Tip;
  reason?: string;
};

export interface ProviderDependencies {
  logger: Logger;
}

export interface Provider {
  /**
   * @throws ProviderError
   */
  healthCheck(): Promise<HealthCheckResponse>;
}

export type HttpProviderConfigPaths<T extends Provider> = { [methodName in keyof T]: string };
