import type { Config } from "@docusaurus/types";

const plugins: [string, string[]][] = [
  ["blueprint", ["current"]],
  ["core", ["current"]],
  ["data", ["current"]],
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
  url: "https://docs.butane.dev",
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
          items: plugins.filter(([slug]) => !["sdk", "emulator", "wallet"].includes(slug)).map(([slug, versions]) => ({
            label: `@blaze-cardano/${slug}`,
            to: `/${slug}`,
          })),
        },
        /**
         * Must create a custom dropdown for each package that only shows if we're in that slug path.
         */
        ...(plugins.map(([slug, versions]) => ({
          type: 'custom-VersionDropdown',
          docsPluginId: `blaze-${slug}`,
          routePrefix: `/${slug}`,
          position: 'right',
        }))),
        {
          href: "https://github.com/butaneprotocol/blaze-cardano",
          label: "GitHub",
          position: "right",
        },
      ],
    },
  },
  plugins: plugins.map(([slug, versions]) => [
    "@docusaurus/plugin-content-docs",
    {
      id: `blaze-${slug}`,
      path: `../packages/blaze-${slug}/docs`,
      routeBasePath: slug,
      sidebarPath: require.resolve(`./sidebars/${slug}.sidebar.mjs`),
      lastVersion: "current",
      includeCurrentVersion: true,
      onlyIncludeVersions: versions,
      editUrl: "https://github.com/you/repo/edit/main/packages/ui/docs",
      include: ["**/*.md", "**/*.mdx"],
    },
  ]),
};

export default config;
