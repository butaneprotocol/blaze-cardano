import type { Config } from "@docusaurus/types";

const plugins = ["blueprint", "core", "data", "emulator"];

const config: Config = {
  title: "Blaze Cardano",
  url: "https://docs.butane.dev",
  themeConfig: {
    navbar: {
      title: "Blaze Cardano",
      logo: {
        alt: "Blaze Logo",
        src: "/logo.svg", // optional
      },
      items: [
        {
          type: "docsVersionDropdown",
          position: "right",
          docPluginId: "blaze-blueprint",
          versions: ["current"],
          dropdownItemsAfter: [{ to: "/versions", label: "All versions" }],
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          docPluginId: "blaze-core",
          versions: ["current"],
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          docPluginId: "blaze-data",
          versions: ["current"],
        },
        {
          type: "docsVersionDropdown",
          position: "right",
          docPluginId: "blaze-emulator",
          versions: ["current"],
        },
        {
          label: "Blueprint",
          to: "/blueprint", // matches `routeBasePath`
          position: "left",
        },
        {
          label: "Core",
          to: "/core",
          position: "left",
        },
        {
          label: "Data",
          to: "/data",
          position: "left",
        },
        {
          label: "Emulator",
          to: "/emulator",
          position: "left",
        },
        {
          href: "https://github.com/your-org/your-repo",
          label: "GitHub",
          position: "right",
        },
      ],
    },
  },
  baseUrl: "/",
  markdown: {
    format: "detect",
  },
  staticDirectories: ["./static"],
  presets: [
    [
      "classic",
      {
        docs: {
          path: "./src",
          routeBasePath: "/",
        },
        blog: false,
      },
    ],
  ],
  plugins: plugins.map((plugin) => [
    "@docusaurus/plugin-content-docs",
    {
      id: `blaze-${plugin}`,
      path: `../packages/blaze-${plugin}/docs`,
      routeBasePath: plugin,
      sidebarPath: require.resolve(`./sidebars/${plugin}.sidebar.mjs`),
      lastVersion: "current",
      includeCurrentVersion: true,
      editUrl: "https://github.com/you/repo/edit/main/packages/ui/docs",
      include: ["**/*.md", "**/*.mdx"],
    },
  ]),
};

export default config;
