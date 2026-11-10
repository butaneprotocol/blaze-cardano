// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
export const BigIntMath = {
  abs(x: bigint): bigint {
    return x < 0n ? -x : x;
  },
  max(arr: bigint[]): bigint | null {
    if (arr.length === 0) return null;
    let max = arr[0];
    for (const num of arr.slice(1)) {
      if (num > max) max = num;
    }
    return max;
  },
  subtract(arr: bigint[]): bigint {
    if (arr.length === 0) return 0n;
    return arr.reduce((result, num) => result - num);
  },
  sum(arr: bigint[]): bigint {
    return arr.reduce((result, num) => result + num, 0n);
  }
};
