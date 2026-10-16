// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
import { InputSource, OnChainTx } from '../types/Transaction';

export const isPhase2ValidationErrTx = ({ inputSource }: Pick<OnChainTx, 'inputSource'>): boolean =>
  inputSource === InputSource.collaterals;
