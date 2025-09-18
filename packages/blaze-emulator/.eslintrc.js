/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["@blaze-cardano/eslint-config"],
  parser: "@typescript-eslint/parser",
  ignorePatterns: ["**/docs/**"],
  parserOptions: {
    project: true,
  },
};
