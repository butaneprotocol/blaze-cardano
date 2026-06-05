import { generateBlueprint } from "../../src";

generateBlueprint({
  infile: "./plutus.json",
  tracedBlueprint: "./plutus.trace.json",
});
