import { performance } from "node:perf_hooks";
import { appendFileSync } from "node:fs";
import { QueryCache, providerCacheKey } from "../src";

const readIterations = 100_000;
const writeIterations = 2_000;
const minimumOpsPerSecond = {
  "cache-key": 1_000_000,
  "cache-hit": 5_000_000,
  "cache-set": 25_000,
} as const;
const params = [
  {
    address:
      "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
    assets: ["lovelace", "ff".repeat(28)],
  },
];

const measure = (label: string, iterations: number, fn: () => void) => {
  const start = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    fn();
  }
  const durationMs = performance.now() - start;
  const opsPerSecond = Math.round((iterations / durationMs) * 1_000);
  return { label, iterations, durationMs, opsPerSecond };
};

const cache = new QueryCache<string, unknown>({
  ttlMs: 60_000,
  maxEntries: writeIterations,
});

const key = providerCacheKey("getUnspentOutputsWithAsset", params);
cache.set(key, []);

const results = [
  measure("cache-key", readIterations, () => {
    providerCacheKey("getUnspentOutputsWithAsset", params);
  }),
  measure("cache-hit", readIterations, () => {
    cache.read(key);
  }),
  measure("cache-set", writeIterations, () => {
    cache.set(`${key}:${cache.size}`, []);
  }),
];

const rows = results.map((result) => ({
  operation: result.label,
  iterations: result.iterations,
  "duration ms": Number(result.durationMs.toFixed(2)),
  "ops/sec": result.opsPerSecond,
  "minimum ops/sec":
    minimumOpsPerSecond[result.label as keyof typeof minimumOpsPerSecond],
  status:
    result.opsPerSecond >=
    minimumOpsPerSecond[result.label as keyof typeof minimumOpsPerSecond]
      ? "pass"
      : "fail",
}));

console.table(rows);

const stepSummary = process.env["GITHUB_STEP_SUMMARY"];

if (stepSummary) {
  appendFileSync(
    stepSummary,
    [
      "### Query cache benchmark",
      "",
      "| Operation | Iterations | Duration ms | Ops/sec | Minimum ops/sec | Status |",
      "| --- | ---: | ---: | ---: | ---: | --- |",
      ...rows.map(
        (row) =>
          `| ${row.operation} | ${row.iterations} | ${row["duration ms"]} | ${row["ops/sec"]} | ${row["minimum ops/sec"]} | ${row.status} |`,
      ),
      "",
    ].join("\n"),
  );
}

const failures = results.filter(
  (result) =>
    result.opsPerSecond <
    minimumOpsPerSecond[result.label as keyof typeof minimumOpsPerSecond],
);

if (failures.length > 0) {
  throw new Error(
    `Query cache benchmark failed: ${failures
      .map((result) => result.label)
      .join(", ")}`,
  );
}
