import * as fs from "fs";
import { parse } from "../src/parse";
import { nameToDeBruijn } from "../src/convert";
import { CekMachine } from "../src/cek";
import { prettyPrint } from "../src/pretty";
import { unlimitedBudget } from "../src/types";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: bun run scripts/eval.ts <file.uplc>");
  process.exit(1);
}

const source = fs.readFileSync(filePath, "utf-8");
const program = parse(source);
const dProgram = nameToDeBruijn(program);

const initialBudget = unlimitedBudget();
const machine = new CekMachine(initialBudget);
const result = machine.run(dProgram.term);

const remaining = machine.remainingBudget;
const output = {
  result: prettyPrint(result),
  cpu: (initialBudget.cpu - remaining.cpu).toString(),
  mem: (initialBudget.mem - remaining.mem).toString(),
};

console.log(JSON.stringify(output, null, 2));
