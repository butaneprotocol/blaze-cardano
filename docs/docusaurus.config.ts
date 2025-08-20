import type { Config } from "@docusaurus/types";

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
          docPluginId: "blaze-core", // must match the plugin id
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
  plugins: [
    // One docs instance per package
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "blaze-blueprint",
        path: "../packages/blaze-blueprint/docs",
        routeBasePath: "blueprint",
        sidebarPath: require.resolve("./sidebars/blueprint.sidebar.mjs"),
        lastVersion: "current",
        includeCurrentVersion: true,
        versions: {
          current: {
            label: "Current",
            path: "current",
          },
        },
        editUrl: "https://github.com/you/repo/edit/main/packages/ui/docs",
        include: ["**/*.md", "**/*.mdx"],
      },
    ],
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
        id: "blaze-data",
        path: "../packages/blaze-data/docs",
        routeBasePath: "data",
        sidebarPath: require.resolve("./sidebars/data.sidebar.mjs"),
        lastVersion: "current",
        onlyIncludeVersions: ["current"],
        editUrl: "https://github.com/you/repo/edit/main/packages/ui/docs",
        include: ["**/*.md", "**/*.mdx"],
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "blaze-emulator",
        path: "../packages/blaze-emulator/docs",
        routeBasePath: "emulator",
        sidebarPath: require.resolve("./sidebars/data.sidebar.mjs"),
        lastVersion: "current",
        onlyIncludeVersions: ["current"],
        editUrl: "https://github.com/you/repo/edit/main/packages/ui/docs",
        include: ["**/*.md", "**/*.mdx"],
      },
    ],
  ],
};

export default config;
