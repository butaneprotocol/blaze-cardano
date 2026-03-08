// Hand-written lexer for UPLC text format.

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

export type TokenType =
  | "lparen"
  | "rparen"
  | "lbracket"
  | "rbracket"
  | "dot"
  | "comma"
  | "number"
  | "string"
  | "bytestring"
  | "point"
  | "unit"
  | "true"
  | "false"
  | "identifier"
  | "lam"
  | "delay"
  | "force"
  | "builtin"
  | "con"
  | "error"
  | "program"
  | "constr"
  | "case"
  | "I"
  | "B"
  | "List"
  | "Map"
  | "Constr"
  | "list"
  | "pair"
  | "array"
  | "eof";

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

const KEYWORDS: Record<string, TokenType> = {
  lam: "lam",
  delay: "delay",
  force: "force",
  builtin: "builtin",
  con: "con",
  error: "error",
  program: "program",
  constr: "constr",
  case: "case",
  True: "true",
  False: "false",
  I: "I",
  B: "B",
  List: "List",
  Map: "Map",
  Constr: "Constr",
  list: "list",
  pair: "pair",
  array: "array",
};

const NAMED_ESCAPES: Record<string, number> = {
  NUL: 0x00,
  SOH: 0x01,
  STX: 0x02,
  ETX: 0x03,
  EOT: 0x04,
  ENQ: 0x05,
  ACK: 0x06,
  BEL: 0x07,
  BS: 0x08,
  HT: 0x09,
  LF: 0x0a,
  VT: 0x0b,
  FF: 0x0c,
  CR: 0x0d,
  SO: 0x0e,
  SI: 0x0f,
  DLE: 0x10,
  DC1: 0x11,
  DC2: 0x12,
  DC3: 0x13,
  DC4: 0x14,
  NAK: 0x15,
  SYN: 0x16,
  ETB: 0x17,
  CAN: 0x18,
  EM: 0x19,
  SUB: 0x1a,
  ESC: 0x1b,
  FS: 0x1c,
  GS: 0x1d,
  RS: 0x1e,
  US: 0x1f,
  SP: 0x20,
  DEL: 0x7f,
};

const SIMPLE_ESCAPES: Record<string, string> = {
  a: "\x07",
  b: "\x08",
  f: "\x0c",
  n: "\n",
  r: "\r",
  t: "\t",
  v: "\x0b",
  '"': '"',
  "\\": "\\",
};

function isDigit(c: string): boolean {
  return c >= "0" && c <= "9";
}

function isHexDigit(c: string): boolean {
  return (
    (c >= "0" && c <= "9") ||
    (c >= "a" && c <= "f") ||
    (c >= "A" && c <= "F")
  );
}

function isAlpha(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
}

function isLetter(c: string): boolean {
  return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
}

function isAlphaNumeric(c: string): boolean {
  return isAlpha(c) || isDigit(c);
}

function isWhitespace(c: string): boolean {
  return c === " " || c === "\t" || c === "\n" || c === "\r";
}

function isOctalDigit(c: string): boolean {
  return c >= "0" && c <= "7";
}

export class Lexer {
  private source: string;
  private pos: number;

  constructor(source: string) {
    this.source = source;
    this.pos = 0;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.pos]!;
  }

  private peekNext(): string {
    if (this.pos + 1 >= this.source.length) return "\0";
    return this.source[this.pos + 1]!;
  }

  private advance(): string {
    const c = this.source[this.pos]!;
    this.pos++;
    return c;
  }

  private skipWhitespaceAndComments(): void {
    while (!this.isAtEnd()) {
      const c = this.peek();
      if (isWhitespace(c)) {
        this.advance();
      } else if (c === "-" && this.peekNext() === "-") {
        while (!this.isAtEnd() && this.peek() !== "\n") {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  nextToken(): Token {
    this.skipWhitespaceAndComments();

    const position = this.pos;

    if (this.isAtEnd()) {
      return { type: "eof", value: "", position };
    }

    const c = this.advance();

    switch (c) {
      case "(":
        if (this.peek() === ")") {
          this.advance();
          return { type: "unit", value: "()", position };
        }
        return { type: "lparen", value: "(", position };
      case ")":
        return { type: "rparen", value: ")", position };
      case "[":
        return { type: "lbracket", value: "[", position };
      case "]":
        return { type: "rbracket", value: "]", position };
      case ".":
        return { type: "dot", value: ".", position };
      case ",":
        return { type: "comma", value: ",", position };
      case "#":
        return this.readByteString(position);
      case '"':
        return this.readString(position);
      case "0":
        if (this.peek() === "x") {
          this.advance();
          return this.readHexLiteral(position, "point");
        }
        return this.readNumber(position, c);
      default:
        if (c === "-" || c === "+") {
          if (!this.isAtEnd() && isDigit(this.peek())) {
            return this.readNumber(position, c);
          }
          return this.readIdentifier(position, c);
        }
        if (isDigit(c)) {
          return this.readNumber(position, c);
        }
        if (isAlpha(c) || c === "'") {
          return this.readIdentifier(position, c);
        }
        throw new ParseError(
          `unexpected character '${c}' at position ${position}`,
        );
    }
  }

  private readNumber(position: number, first: string): Token {
    let literal = first;
    while (!this.isAtEnd() && isDigit(this.peek())) {
      literal += this.advance();
    }
    return { type: "number", value: literal, position };
  }

  private readIdentifier(position: number, first: string): Token {
    let literal = first;
    while (
      !this.isAtEnd() &&
      (isAlphaNumeric(this.peek()) ||
        this.peek() === "_" ||
        this.peek() === "'" ||
        this.peek() === "-")
    ) {
      literal += this.advance();
    }
    const kwType = KEYWORDS[literal];
    return { type: kwType ?? "identifier", value: literal, position };
  }

  private readByteString(position: number): Token {
    let hex = "";
    while (
      !this.isAtEnd() &&
      !isWhitespace(this.peek()) &&
      this.peek() !== ")" &&
      this.peek() !== "]" &&
      this.peek() !== ","
    ) {
      const ch = this.peek();
      if (!isHexDigit(ch)) {
        throw new ParseError(
          `invalid bytestring character '${ch}' at position ${this.pos}`,
        );
      }
      hex += this.advance();
    }
    if (hex.length % 2 !== 0) {
      throw new ParseError(
        `bytestring #${hex} has odd length at position ${position}`,
      );
    }
    return { type: "bytestring", value: hex, position };
  }

  private readHexLiteral(
    position: number,
    type: "point" | "bytestring",
  ): Token {
    let hex = "";
    while (
      !this.isAtEnd() &&
      !isWhitespace(this.peek()) &&
      this.peek() !== ")" &&
      this.peek() !== "]" &&
      this.peek() !== ","
    ) {
      const ch = this.peek();
      if (!isHexDigit(ch)) {
        throw new ParseError(
          `invalid hex character '${ch}' at position ${this.pos}`,
        );
      }
      hex += this.advance();
    }
    if (type === "bytestring" && hex.length % 2 !== 0) {
      throw new ParseError(
        `bytestring has odd length at position ${position}`,
      );
    }
    return { type, value: hex, position };
  }

  private readString(position: number): Token {
    let result = "";
    while (!this.isAtEnd() && this.peek() !== '"') {
      if (this.peek() === "\\") {
        this.advance();
        if (this.isAtEnd()) {
          throw new ParseError(
            `unterminated string escape at position ${this.pos}`,
          );
        }
        const escChar = this.advance();

        const simple = SIMPLE_ESCAPES[escChar];
        if (simple !== undefined) {
          result += simple;
          continue;
        }

        if (escChar === "u") {
          let hexStr = "";
          while (
            !this.isAtEnd() &&
            hexStr.length < 4 &&
            isHexDigit(this.peek())
          ) {
            hexStr += this.advance();
          }
          if (hexStr.length === 0) {
            throw new ParseError(
              `invalid unicode escape sequence at position ${position}`,
            );
          }
          const codepoint = parseInt(hexStr, 16);
          result += String.fromCodePoint(codepoint);
          continue;
        }

        if (escChar === "x") {
          let hexStr = "";
          while (
            !this.isAtEnd() &&
            hexStr.length < 2 &&
            isHexDigit(this.peek())
          ) {
            hexStr += this.advance();
          }
          if (hexStr.length === 0) {
            throw new ParseError(
              `invalid hex escape sequence at position ${position}`,
            );
          }
          const byte = parseInt(hexStr, 16);
          result += String.fromCharCode(byte);
          continue;
        }

        if (escChar === "o") {
          let octalStr = "";
          while (
            !this.isAtEnd() &&
            octalStr.length < 3 &&
            isOctalDigit(this.peek())
          ) {
            octalStr += this.advance();
          }
          if (octalStr.length === 0) {
            throw new ParseError(
              `invalid octal escape sequence at position ${position}`,
            );
          }
          const value = parseInt(octalStr, 8);
          result += String.fromCodePoint(value);
          continue;
        }

        // Named escape (\DEL, \NUL, etc.) or unknown letter sequence
        if (isLetter(escChar)) {
          let name = escChar;
          while (!this.isAtEnd() && isLetter(this.peek())) {
            name += this.advance();
          }
          const namedCode = NAMED_ESCAPES[name];
          if (namedCode !== undefined) {
            result += String.fromCharCode(namedCode);
            continue;
          }
          result += "\\" + name;
          continue;
        }

        // Decimal escape: \NNN...
        if (isDigit(escChar)) {
          let decStr = escChar;
          while (!this.isAtEnd() && isDigit(this.peek())) {
            decStr += this.advance();
          }
          const codepoint = parseInt(decStr, 10);
          result += String.fromCodePoint(codepoint);
          continue;
        }

        // Unknown escape — output literally
        result += "\\" + escChar;
      } else {
        result += this.advance();
      }
    }

    if (this.isAtEnd()) {
      throw new ParseError(`unterminated string at position ${position}`);
    }

    this.advance(); // consume closing quote
    return { type: "string", value: result, position };
  }
}
