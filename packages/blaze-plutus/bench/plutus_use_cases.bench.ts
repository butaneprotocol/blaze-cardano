import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { describe, bench } from "vitest";
import { decodeFlatDeBruijn } from "../src/flat";
import { CekMachine } from "../src/cek";

const benchDir = join(__dirname, "plutus_use_cases");
const files = readdirSync(benchDir)
  .filter((f) => f.endsWith(".flat"))
  .sort();

describe("plutus use cases", () => {
  for (const file of files) {
    const bytes = new Uint8Array(readFileSync(join(benchDir, file)));
    const name = file.replace(".flat", "");

    bench(name, () => {
      const program = decodeFlatDeBruijn(bytes);
      const machine = new CekMachine();
      machine.run(program.term);
    });
  }
});
