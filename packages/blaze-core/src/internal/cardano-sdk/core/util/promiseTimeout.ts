// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
/* eslint-disable promise/param-names */

import { TimeoutError } from '../errors';

export const promiseTimeout = <T>(promise: Promise<T>, timeout: number) => {
  let timeoutId: NodeJS.Timeout;

  return Promise.race([
    promise,
    new Promise<T>(
      (_, reject) =>
        (timeoutId = setTimeout(() => reject(new TimeoutError('Failed to resolve the promise in time')), timeout))
    )
  ]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
};
