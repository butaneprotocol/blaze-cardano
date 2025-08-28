import { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const config: SidebarsConfig = {
  docs: [
    {
      type: "doc",
      id: "index", // matches the frontmatter `id: index` or path relative to docs/
      label: "Overview", // optional, overrides title in frontmatter
    },
    {
      type: "category",
      label: "Guides",
      items: [
        {type: 'link', label: 'Example Guide', href: '/core/guides/introduction'}
      ],
    },
    {
      type: "category",
      label: "API",
      collapsed: false,
      items: [
        {type: 'link', label: '@blaze-cardano/blueprint', href: '/blueprint/api/blueprint'},
        {type: 'link', label: '@blaze-cardano/core', href: '/core/api/core'},
        {type: 'link', label: '@blaze-cardano/data', href: '/data/api/data'},
        {type: 'link', label: '@blaze-cardano/emulator', href: '/emulator/api/emulator'},
        {type: 'link', label: '@blaze-cardano/ogmios', href: '/ogmios/api/ogmios'},
        {type: 'link', label: '@blaze-cardano/query', href: '/query/api/query'},
        {type: 'link', label: '@blaze-cardano/sdk', href: '/sdk/api/sdk'},
        {type: 'link', label: '@blaze-cardano/tx', href: '/tx/api/tx'},
        {type: 'link', label: '@blaze-cardano/uplc', href: '/uplc/api/uplc'},
        {type: 'link', label: '@blaze-cardano/vm', href: '/vm/api/vm'},
        {type: 'link', label: '@blaze-cardano/wallet', href: '/wallet/api/wallet'}
      ],
    },
  ],
};

export default config;