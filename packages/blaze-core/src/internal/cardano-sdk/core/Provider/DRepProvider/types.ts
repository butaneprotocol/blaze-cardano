// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import { Cardano, Provider } from '../..';

export interface GetDRepInfoArgs {
  id: Cardano.DRepID;
}

export interface GetDRepsInfoArgs {
  ids: Cardano.DRepID[];
}

export interface DRepInfo {
  id: Cardano.DRepID;
  amount: Cardano.Lovelace;
  active: boolean;
  activeEpoch?: Cardano.EpochNo;
  hasScript: boolean;
}

export interface DRepProvider extends Provider {
  getDRepInfo: (args: GetDRepInfoArgs) => Promise<DRepInfo>;
  getDRepsInfo: (args: GetDRepsInfoArgs) => Promise<DRepInfo[]>;
}
