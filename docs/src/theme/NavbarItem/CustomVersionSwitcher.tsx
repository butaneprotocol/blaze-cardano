import React from "react";
import { useLocation } from "@docusaurus/router";
import NavbarItem from "@theme/NavbarItem";

type Props = {
  position?: "left" | "right";
  className?: string;
  /** Must match your docs plugin id (e.g. "blaze-core") */
  docsPluginId: string;
  /** Show only when URL starts with this path (e.g. "/core") */
  routePrefix: string;
};

export default function CustomVersionSwitcher({
  routePrefix,
  docsPluginId,
  ...rest
}: Props) {
  const { pathname } = useLocation();
  const active =
    pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);

  if (!active) return null;

  // Render the official version dropdown via the dispatcher
  return (
    <NavbarItem
      type="docsVersionDropdown"
      docsPluginId={docsPluginId}
      {...rest}
    />
  );
}
