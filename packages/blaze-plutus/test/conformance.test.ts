import * as fs from "fs";
import * as path from "path";
import { parse, ParseError } from "../src/parse";
import { nameToDeBruijn } from "../src/convert";
import { CekMachine } from "../src/cek";
import { prettyPrint } from "../src/pretty";
import { unlimitedBudget } from "../src/types";

const CONFORMANCE_DIR = path.resolve(__dirname, "../conformance/tests");

interface TestCase {
  name: string;
  uplcPath: string;
  expectedPath: string;
  budgetPath: string;
}

function discoverTests(dir: string): TestCase[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const tests: TestCase[] = [];

  function walk(currentDir: string): void {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (
        entry.isFile() &&
        entry.name.endsWith(".uplc") &&
        !entry.name.endsWith(".expected")
      ) {
        const uplcPath = fullPath;
        const expectedPath = fullPath + ".expected";
        const budgetPath = fullPath + ".budget.expected";

        // Test name is the leaf folder name
        const testName = path.basename(currentDir);

        tests.push({ name: testName, uplcPath, expectedPath, budgetPath });
      }
    }
  }

  walk(dir);
  return tests;
}

function runTest(tc: TestCase): void {
  const source = fs.readFileSync(tc.uplcPath, "utf-8");
  const expected = fs.readFileSync(tc.expectedPath, "utf-8");
  const budgetExpected = fs.readFileSync(tc.budgetPath, "utf-8");

  const expectParseError = expected.startsWith("parse error");
  const expectEvalFailure = expected.startsWith("evaluation failure");

  // Step 1: Parse
  let program;
  try {
    program = parse(source);
  } catch (err) {
    if (expectParseError) {
      return; // PASS — expected parse error
    }
    throw err;
  }

  if (expectParseError) {
    throw new Error(
      `Expected parse error but parsing succeeded: ${tc.uplcPath}`,
    );
  }

  // Step 2: Convert name→DeBruijn
  let dProgram;
  try {
    dProgram = nameToDeBruijn(program);
  } catch (err) {
    if (err instanceof ParseError) {
      throw err;
    }
    if (expectEvalFailure) {
      return; // PASS — conversion failure counts as eval failure
    }
    throw err;
  }

  // Step 3: Evaluate
  const initialBudget = unlimitedBudget();
  const machine = new CekMachine(initialBudget);
  let result;
  try {
    result = machine.run(dProgram.term);
  } catch (err) {
    if (expectEvalFailure) {
      return; // PASS — expected evaluation failure
    }
    throw err;
  }

  if (expectEvalFailure) {
    throw new Error(
      `Expected evaluation failure but succeeded: ${tc.uplcPath}`,
    );
  }

  // Step 4: Parse and convert expected output
  const expectedProgram = parse(expected);
  const dExpected = nameToDeBruijn(expectedProgram);

  // Step 5: Compare via pretty printing
  const prettyResult = prettyPrint(result);
  const prettyExpectedTerm = prettyPrint(dExpected.term);

  expect(prettyResult).toBe(prettyExpectedTerm);

  // Step 6: Compare budget
  const remaining = machine.remainingBudget;
  const consumed = {
    cpu: initialBudget.cpu - remaining.cpu,
    mem: initialBudget.mem - remaining.mem,
  };
  const actualBudget = `({cpu: ${consumed.cpu}\n| mem: ${consumed.mem}})`;
  const trimmedExpectedBudget = budgetExpected.trim();

  expect(actualBudget).toBe(trimmedExpectedBudget);
}

const testCases = discoverTests(CONFORMANCE_DIR);

if (testCases.length === 0) {
  describe("Conformance", () => {
    it("skipped — no conformance tests found. Run `bun run download:conformance` first.", () => {
      console.warn(
        "Conformance tests not found. Run `bun run download:conformance` in packages/nash-plutus to download them.",
      );
    });
  });
} else {
  describe("Conformance", () => {
    for (const tc of testCases) {
      test(tc.name, () => {
        runTest(tc);
      });
    }
  });
}
