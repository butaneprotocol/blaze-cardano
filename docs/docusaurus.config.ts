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
    // One docs instance per package
    // [
    //   '@docusaurus/plugin-content-docs',
    //   {
    //     id: 'core',
    //     path: '../packages/core/docs',           // <-- reads guides/examples + generated api MD
    //     routeBasePath: 'core',
    //     sidebarPath: require.resolve('./sidebars/core.sidebar.js'),
    //     lastVersion: 'current',
    //     // Once you start versioning, list versions you want visible:
    //     // onlyIncludeVersions: ['current', '3.2.0', '3.1.0'],
    //     editUrl: 'https://github.com/you/repo/edit/main/packages/core/docs',
    //   },
    // ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "blaze-core",
        path: "../packages/blaze-core/docs",
        routeBasePath: "core",
        sidebarPath: require.resolve("./sidebars/core.sidebar.mjs"),
        lastVersion: "current",
        onlyIncludeVersions: ["current"],
        editUrl: "https://github.com/you/repo/edit/main/packages/ui/docs",
        include: ["**/*.md", "**/*.mdx"],
      },
    ],
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
