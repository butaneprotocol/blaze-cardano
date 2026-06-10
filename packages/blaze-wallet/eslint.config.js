import baseConfig from "@blaze-cardano/eslint-config";
import tseslint from "typescript-eslint";

export default tseslint.config(...baseConfig, {
  languageOptions: {
    parserOptions: {
      project: true,
    },
  },
});
