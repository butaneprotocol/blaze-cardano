/** @type { import("nextra").Nextra } */
const nextra = require("nextra");

const withNextra = nextra({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

module.exports = withNextra({
  images: { unoptimized: true },
  output: "export",
});
