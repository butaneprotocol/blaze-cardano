import { generateBlueprint } from "./index";
import * as path from "path";

function isValidFilePath(filePath: string | undefined): boolean {
  if (!filePath) return false;
  try {
    path.parse(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function parseArguments(args: string[]): {
  infile: string | undefined;
  outfile: string | undefined;
} {
  let infile: string | undefined;
  let outfile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-o") {
      if (i + 1 < args.length) {
        outfile = args[i + 1];
        i++; // Skip the next argument as it's the outfile path
      } else {
        console.error("Error: Output file path is missing after -o option");
        process.exit(1);
      }
    } else if (infile === undefined) {
      infile = args[i];
    } else {
      console.error("Error: Unexpected argument:", args[i]);
      process.exit(1);
    }
  }

  return { infile, outfile };
}

function validateFilePaths(
  infile: string | undefined,
  outfile: string | undefined,
): void {
  if (!isValidFilePath(infile)) {
    console.error("Error: Invalid input file path");
    process.exit(1);
  }

  if (!isValidFilePath(outfile)) {
    console.error("Error: Invalid output file path");
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const { infile, outfile } = parseArguments(args);
  validateFilePaths(infile, outfile);

  generateBlueprint({ infile, outfile });
}

main();
