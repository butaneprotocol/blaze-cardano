import { PlutusData, PlutusDataKind } from "./types";
import { toHex } from "./util";

export type Prettier = PlutusData | string | number | boolean | null;

type PrettierFunction = (data: Prettier, indent: string) => string;

const ansiColors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",

  fg: {
    black: "\x1b[38;5;240m",
    red: "\x1b[38;5;203m",
    green: "\x1b[38;5;114m",
    yellow: "\x1b[38;5;180m",
    blue: "\x1b[38;5;67m",
    magenta: "\x1b[38;5;139m",
    cyan: "\x1b[38;5;73m",
    white: "\x1b[38;5;252m",
    gray: "\x1b[38;5;245m",
  },
};

function prettify_plutusData(data: PlutusData, indent: string): string {
  if (data.getKind() === PlutusDataKind.Bytes) {
    const hexValue = toHex(data.asBoundedBytes()!);
    const textValue = Buffer.from(data.asBoundedBytes()!)
      .toString("utf-8")
      .replace(/\r\n|\r|\n/g, "\\n");
    return `${ansiColors.fg.gray}"${textValue}"${ansiColors.reset}\n${indent}${ansiColors.fg.cyan}${hexValue}${ansiColors.reset}`;
  } else if (data.getKind() === PlutusDataKind.ConstrPlutusData) {
    const innerData = prettify(
      PlutusData.newList(data.asConstrPlutusData()!.getData()),
      indent + "  ",
    );
    return `${ansiColors.fg.magenta}Constr ${ansiColors.fg.yellow}${data
      .asConstrPlutusData()!
      .getAlternative()}${ansiColors.reset} ${innerData}`;
  } else if (data.getKind() === PlutusDataKind.List) {
    const items: PlutusData[] = [];
    for (let i = 0; i < data.asList()!.getLength(); i++) {
      items.push(data.asList()!.get(i)!);
    }
    const innerIndent = indent + "  ";
    if (items.length === 0) {
      return `${ansiColors.fg.blue}[]${ansiColors.reset}`;
    }
    const itemsStr = items
      .map((item) => innerIndent + prettify(item, innerIndent))
      .join(",\n");
    return `${ansiColors.fg.blue}[\n${itemsStr}\n${indent}${ansiColors.fg.blue}]${ansiColors.reset}`;
  } else if (data.getKind() === PlutusDataKind.Map) {
    let pretty = `${ansiColors.fg.blue}{\n`;
    const list = data.asMap()!.getKeys();
    const innerIndent = indent + "  ";
    for (let i = 0; i < list.getLength(); i++) {
      const key = prettify(list.get(i)!, innerIndent);
      const value = prettify(data.asMap()!.get(list.get(i)!)!, innerIndent);
      pretty += `${innerIndent}${ansiColors.fg.gray}[${key}${ansiColors.fg.gray}]${ansiColors.reset}: ${value}`;
      if (i < list.getLength() - 1) {
        pretty += ",\n";
      }
    }
    return `${pretty}\n${indent}${ansiColors.fg.blue}}${ansiColors.reset}`;
  } else {
    return `${ansiColors.fg.yellow}${data.asInteger()!.toString()}${
      ansiColors.reset
    }`;
  }
}

const prettierFunctions: PrettierFunction[] = [
  (data, _indent) => {
    if (typeof data === "string")
      return `${ansiColors.fg.green}"${data}"${ansiColors.reset}`;
    if (typeof data === "number")
      return `${ansiColors.fg.yellow}${data.toString()}${ansiColors.reset}`;
    if (typeof data === "boolean")
      return `${ansiColors.fg.magenta}${data.toString()}${ansiColors.reset}`;
    if (data === null) return `${ansiColors.fg.red}null${ansiColors.reset}`;
    return "";
  },
  (data, indent) => {
    if (data instanceof PlutusData) {
      return prettify_plutusData(data, indent);
    }
    return "";
  },
];

export function prettify(data: Prettier, indent: string = ""): string {
  for (const func of prettierFunctions) {
    const result = func(data, indent);
    if (result !== "") return result;
  }
  throw new Error(`Could not prettify unknown type ${typeof data}`);
}
