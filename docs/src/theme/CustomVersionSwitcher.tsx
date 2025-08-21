import React from "react";
import { useLocation } from "@docusaurus/router";
import DocsVersionDropdownNavbarItem from "@theme/NavbarItem/DocsVersionDropdownNavbarItem";

// Props that come from the config item
type Props = {
  position?: "left" | "right";
  className?: string;
  docPluginId: string; // the docs plugin id (e.g. "blaze-core")
  routePrefix: string; // the section path prefix (e.g. "/core")
};

// Render the built-in docsVersionDropdown only on matching routes
export default function ConditionalVersionDropdown(props: Props) {
  const { pathname } = useLocation();
  const isActiveSection =
    pathname === props.routePrefix ||
    pathname.startsWith(props.routePrefix + "/");

  if (!isActiveSection) return null;

  return (
    <DocsVersionDropdownNavbarItem
      // pass through navbar positioning/classes
      position={props.position}
      className={props.className}
      // and tell it which docs plugin to control
      docPluginId={props.docPluginId}
    />
  );
}
