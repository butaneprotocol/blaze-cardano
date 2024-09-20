#!/usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import * as path from "path";

import { generateBlueprint } from "./index";
import * as packageJson from "../package.json";

const command = new Command();

command
  .version(packageJson.version)
  .argument("<blueprint>", "plutus.json file")
  .requiredOption("-o, --outfile <file>", "output file")
  .option(
    "-s, --use-sdk",
    "use @blaze-cardano/sdk instead of @blaze-cardano/core & @blaze-cardano/uplc",
  )
  .action(async (infile, { outfile, useSdk }) => {
    validateFilePaths(infile, outfile);

    await generateBlueprint({ infile, outfile, useSdk });

    console.log(`Blueprint generated at ${outfile}`);
  });

function isValidFilePath(filePath: string | undefined): boolean {
  if (!filePath) return false;

  try {
    path.parse(filePath);
    return true;
  } catch {
    return false;
  }
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

command.parse();
