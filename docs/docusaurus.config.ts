import type { Config } from "@docusaurus/types";

const plugins: [string, string[]][] = [
  ["blueprint", ["current"]],
  ["core", ["current"]],
  ["data", ["current"]],
  ["deploy", ["current"]],
  ["emulator", ["current", "0.3.30"]],
  ["ogmios", ["current"]],
  ["query", ["current"]],
  ["sdk", ["current", "0.2.38"]],
  ["tx", ["current", "0.13.0"]],
  ["uplc", ["current", "0.3.6"]],
  ["vm", ["current"]],
  ["wallet", ["current", "0.4.9"]],
];

const config: Config = {
  title: "Blaze Cardano",
  url: "https://blaze.butane.dev",
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
          sidebarPath: false,
        },
        blog: false,
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Blaze Cardano",
      logo: {
        alt: "Blaze Logo",
        src: "/logo.svg", // optional
      },
      items: [
        {
          label: "SDK",
          to: "/sdk",
        },
        {
          label: "Catalyst",
          to: "/catalyst",
        },
        {
          label: "Emulator",
          to: "/emulator",
        },
        {
          label: "Wallet",
          to: "/wallet",
        },
        {
          type: "dropdown",
          label: "More Packages",
          items: plugins
            .filter(([slug]) => !["sdk", "emulator", "wallet"].includes(slug))
            .map(([slug]) => ({
              label: `@blaze-cardano/${slug}`,
              to: `/${slug}`,
            })),
        },
        /**
         * Must create a custom dropdown for each package that only shows if we're in that slug path.
         */
        ...plugins.map(([slug]) => ({
          type: "custom-VersionDropdown",
          docsPluginId: `blaze-${slug}`,
          routePrefix: `/${slug}`,
          position: "right",
        })),
        {
          href: "https://github.com/butaneprotocol/blaze-cardano",
          label: "GitHub",
          position: "right",
        },
      ],
    },
  },
  plugins: [
    [
      "@docusaurus/plugin-content-docs",
      {
        id: "catalyst",
        path: "./catalyst",
        routeBasePath: "catalyst",
        sidebarPath: require.resolve("./sidebars/catalyst.sidebar.mjs"),
        editUrl:
          "https://github.com/butaneprotocol/blaze-cardano/edit/main/docs",
        include: ["**/*.md", "**/*.mdx"],
      },
    ],
    ...plugins.map(([slug, versions]) => [
      "@docusaurus/plugin-content-docs",
      {
        id: `blaze-${slug}`,
        path: `../packages/blaze-${slug}/docs`,
        routeBasePath: slug,
        sidebarPath: require.resolve(`./sidebars/${slug}.sidebar.mjs`),
        lastVersion: "current",
        includeCurrentVersion: true,
        onlyIncludeVersions: versions,
        editUrl: `https://github.com/butaneprotocol/blaze-cardano/edit/main/packages/blaze-${slug}/docs`,
        include: ["**/*.md", "**/*.mdx"],
      },
    ]),
  ],
};

export default config;
