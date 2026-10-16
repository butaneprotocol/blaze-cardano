// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import type { HexBlob } from '../../../util';
import type { HandleResolution, Provider } from '../..';

type SerializedTransaction = HexBlob;

export interface SubmitTxArgs {
  signedTransaction: SerializedTransaction;
  context?: { handleResolutions: HandleResolution[] };
}

export interface TxSubmitProvider extends Provider {
  /**
   * @param signedTransaction signed and serialized cbor
   */
  submitTx: (args: SubmitTxArgs) => Promise<void>;
}
