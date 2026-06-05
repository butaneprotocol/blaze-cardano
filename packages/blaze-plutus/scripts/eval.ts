import * as fs from "fs";
import { parse } from "../src/parse";
import { nameToDeBruijn } from "../src/convert";
import { decodeFlatDeBruijn } from "../src/flat";
import { CekMachine } from "../src/cek";
import { prettyPrint } from "../src/pretty";
import { unlimitedBudget } from "../src/types";

function readStdin(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks)));
    process.stdin.on("error", reject);
  });
}

const args = process.argv.slice(2);
const flat = args.includes("--flat");
const pathIndex = args.indexOf("-p");
const filePath = pathIndex !== -1 ? args[pathIndex + 1] : undefined;

if (pathIndex !== -1 && !filePath) {
  console.error("Error: -p requires a file path argument");
  process.exit(1);
}

async function main() {
  let dProgram;

  if (flat) {
    const bytes = filePath
      ? new Uint8Array(fs.readFileSync(filePath))
      : new Uint8Array(await readStdin());
    dProgram = decodeFlatDeBruijn(bytes);
  } else {
    const source = filePath
      ? fs.readFileSync(filePath, "utf-8")
      : (await readStdin()).toString("utf-8");
    const program = parse(source);
    dProgram = nameToDeBruijn(program);
  }

  const initialBudget = unlimitedBudget();
  const machine = new CekMachine(initialBudget);
  const result = machine.run(dProgram.term);

  const remaining = machine.remainingBudget;
  const output = {
    result: prettyPrint(result),
    cpu: Number(initialBudget.cpu - remaining.cpu),
    mem: Number(initialBudget.mem - remaining.mem),
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
