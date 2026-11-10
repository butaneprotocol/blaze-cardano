// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
/* eslint-disable @typescript-eslint/no-explicit-any */

const connectionErrorCodes = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ENOTFOUND',
  'ENETUNREACH',
  'EAI_AGAIN'
]);

const connectionErrorNames = new Set(['WebSocketClosed', 'ServerNotReady']);

export const isConnectionError = (error: any): boolean => {
  if (!error || typeof error !== 'object') return false;
  if ((error?.name && connectionErrorNames.has(error.name)) || (error?.code && connectionErrorCodes.has(error.code))) {
    return true;
  }
  return isConnectionError(error.innerError);
};
