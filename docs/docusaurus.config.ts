import type { Config } from "@docusaurus/types";

const config: Config = {
  title: "Blaze Cardano",
  url: "https://docs.butane.dev",
  baseUrl: "/",
  markdown: {
    format: "detect",
  },
  presets: [["classic", { docs: false, blog: false }]],
  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "blaze-blueprint",
        path: "../packages/blaze-blueprint/docs",
        routeBasePath: "blueprint",
        sidebarPath: require.resolve("./sidebars/blueprint.sidebar.mjs"),
        lastVersion: "current",
        onlyIncludeVersions: ["current"],
        editUrl: "https://github.com/you/repo/edit/main/packages/ui/docs",
        include: ["**/*.md", "**/*.mdx"],
      },
    ],
  ],
};

export default config;
