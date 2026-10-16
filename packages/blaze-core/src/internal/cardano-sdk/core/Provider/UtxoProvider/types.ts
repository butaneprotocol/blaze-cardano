// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import * as Cardano from '../../Cardano';
import type { Provider } from '../..';

export interface UtxoByAddressesArgs {
  addresses: Cardano.PaymentAddress[];
}

export interface UtxoProvider extends Provider {
  /**
   * @returns an array of utxo corresponding to the given addresses
   */
  utxoByAddresses: (args: UtxoByAddressesArgs) => Promise<Cardano.Utxo[]>;
}
