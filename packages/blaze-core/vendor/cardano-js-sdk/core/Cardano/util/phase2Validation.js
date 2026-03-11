import { InputSource } from '../types/Transaction.js';
export const isPhase2ValidationErrTx = ({ inputSource }) => inputSource === InputSource.collaterals;
