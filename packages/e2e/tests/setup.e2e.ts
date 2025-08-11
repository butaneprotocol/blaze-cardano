export {};
declare const jest: { retryTimes?: (n: number) => void; setTimeout?: (ms: number) => void } | undefined;
jest?.retryTimes?.(2);
jest?.setTimeout?.(120_000);


