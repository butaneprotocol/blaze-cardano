/**
 * Type definitions for @cardanosolutions/json-bigint
 * This package doesn't ship with TypeScript declarations, so we provide them here.
 * Required for generating documentation with `emitDeclarationOnly: true`.
 */
declare module "@cardanosolutions/json-bigint" {
  interface JSONBigOptions {
    useNativeBigInt?: boolean;
    strict?: boolean;
    storeAsString?: boolean;
  }

  interface JSONBig {
    parse(text: string, reviver?: (key: any, value: any) => any): any;
    stringify(
      value: any,
      replacer?: (key: string, value: any) => any,
      space?: string | number,
    ): string;
  }

  function JSONBigInt(options?: JSONBigOptions): JSONBig;

  export = JSONBigInt;
}
