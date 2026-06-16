/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
export default {
  docs: [
    {
      type: "doc",
      id: "index",
      label: "Overview",
    },
    {
      type: "category",
      label: "1200041: SDK maintenance and assurances",
      items: [
        "1200041/m1/index",
        "1200041/m2/index",
        "1200041/m3/index",
        "1200041/m4/index",
        "1200041/m5/index",
        "1200041/closeout/index",
      ],
    },
    {
      type: "category",
      label: "1200042: Script deployment tools",
      items: [
        "1200042/m1/index",
        "1200042/m2/index",
        "1200042/m3/index",
        "1200042/closeout/index",
      ],
    },
    {
      type: "category",
      label: "1200040: Emulator research",
      items: ["1200040/m1/index"],
    },
  ],
};
