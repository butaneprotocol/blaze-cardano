import type {
  Constant,
  ConstantType,
  DeBruijn,
  PlutusData,
  Term,
} from "./types";

export function prettyPrint(term: Term<DeBruijn>): string {
  switch (term.tag) {
    case "var":
      return `i${term.name.index}`;
    case "lambda":
      return `(lam i${term.parameter.index} ${prettyPrint(term.body)})`;
    case "apply":
      return `[${prettyPrint(term.function)} ${prettyPrint(term.argument)}]`;
    case "delay":
      return `(delay ${prettyPrint(term.term)})`;
    case "force":
      return `(force ${prettyPrint(term.term)})`;
    case "constr": {
      const fields = term.fields.map((f) => ` ${prettyPrint(f)}`).join("");
      return `(constr ${term.index}${fields})`;
    }
    case "case": {
      const branches = term.branches.map((b) => ` ${prettyPrint(b)}`).join("");
      return `(case ${prettyPrint(term.constr)}${branches})`;
    }
    case "constant":
      return `(con ${printConstant(term.value)})`;
    case "builtin":
      return `(builtin ${term.function})`;
    case "error":
      return "(error)";
  }
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = "";
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

function escapeString(s: string): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    switch (c) {
      case 0x5c: // backslash
        out += "\\\\";
        break;
      case 0x22: // double quote
        out += '\\"';
        break;
      case 0x0a: // newline
        out += "\\n";
        break;
      case 0x09: // tab
        out += "\\t";
        break;
      case 0x0d: // carriage return
        out += "\\r";
        break;
      case 0x07: // bell
        out += "\\a";
        break;
      case 0x08: // backspace
        out += "\\b";
        break;
      case 0x0c: // form feed
        out += "\\f";
        break;
      case 0x0b: // vertical tab
        out += "\\v";
        break;
      case 0x7f: // DEL
        out += "\\DEL";
        break;
      default:
        if (c < 0x20) {
          out += "\\x" + c.toString(16).padStart(2, "0");
        } else {
          out += s[i]!;
        }
        break;
    }
  }
  return out;
}

function printType(t: ConstantType): string {
  switch (t.tag) {
    case "integer":
      return "integer";
    case "bytestring":
      return "bytestring";
    case "string":
      return "string";
    case "bool":
      return "bool";
    case "unit":
      return "unit";
    case "data":
      return "data";
    case "bls12_381_G1_element":
      return "bls12_381_G1_element";
    case "bls12_381_G2_element":
      return "bls12_381_G2_element";
    case "bls12_381_ml_result":
      return "bls12_381_mlresult";
    case "value":
      return "value";
    case "list":
      return `(list ${printType(t.element)})`;
    case "array":
      return `(array ${printType(t.element)})`;
    case "pair":
      return `(pair ${printType(t.first)} ${printType(t.second)})`;
  }
}

function printConstant(constant: Constant): string {
  switch (constant.type) {
    case "integer":
      return `integer ${constant.value}`;
    case "bytestring":
      return `bytestring #${bytesToHex(constant.value)}`;
    case "string":
      return `string "${escapeString(constant.value)}"`;
    case "bool":
      return `bool ${constant.value ? "True" : "False"}`;
    case "unit":
      return "unit ()";
    case "data":
      return `data (${printPlutusData(constant.value)})`;
    case "list": {
      const elemType = printType(constant.itemType);
      const items = constant.values
        .map((v) => printConstantInner(v))
        .join(", ");
      return `(list ${elemType}) [${items}]`;
    }
    case "array": {
      const elemType = printType(constant.itemType);
      const items = constant.values
        .map((v) => printConstantInner(v))
        .join(",");
      return `(array ${elemType}) [${items}]`;
    }
    case "pair": {
      const fstType = printType(constant.fstType);
      const sndType = printType(constant.sndType);
      return `(pair ${fstType} ${sndType}) (${printConstantInner(constant.first)}, ${printConstantInner(constant.second)})`;
    }
    case "bls12_381_g1_element":
      return `bls12_381_G1_element 0x${bytesToHex(constant.value)}`;
    case "bls12_381_g2_element":
      return `bls12_381_G2_element 0x${bytesToHex(constant.value)}`;
    case "bls12_381_ml_result":
      return "bls12_381_mlresult ...";
    case "value": {
      const entries = constant.value.entries
        .map((entry) => {
          const tokens = entry.tokens
            .map((token) => `(#${bytesToHex(token.name)}, ${token.quantity})`)
            .join(", ");
          return `(#${bytesToHex(entry.currency)}, [${tokens}])`;
        })
        .join(", ");
      return `value [${entries}]`;
    }
  }
}

function printConstantInner(constant: Constant): string {
  if (constant.type === "data") {
    return printPlutusData(constant.value);
  }
  return printConstant(constant);
}

function printPlutusData(data: PlutusData): string {
  switch (data.tag) {
    case "integer":
      return `I ${data.value}`;
    case "bytestring":
      return `B #${bytesToHex(data.value)}`;
    case "list": {
      const items = data.values.map((item) => printPlutusData(item)).join(", ");
      return `List [${items}]`;
    }
    case "map": {
      const pairs = data.entries
        .map(([k, v]) => `(${printPlutusData(k)}, ${printPlutusData(v)})`)
        .join(", ");
      return `Map [${pairs}]`;
    }
    case "constr": {
      const fields = data.fields
        .map((field) => printPlutusData(field))
        .join(", ");
      return `Constr ${data.index} [${fields}]`;
    }
  }
}
