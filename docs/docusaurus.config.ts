import type { Config } from "@docusaurus/types";

const plugins = [
  "blueprint",
  "core",
  "data",
  "emulator",
  "ogmios",
  "query",
  "sdk",
  "tx",
  "uplc",
  "vm",
  "wallet",
];

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
          type: "dropdown",
          label: "Packages",
          items: plugins.map((slug) => ({
            label: `@blaze-cardano/${slug}`,
            to: `/${slug}`,
          })),
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
