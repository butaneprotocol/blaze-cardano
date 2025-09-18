import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import DocsVersionDropdownNavbarItem from '@theme-original/NavbarItem/DocsVersionDropdownNavbarItem';

type Props = {
  position?: 'left' | 'right';
  className?: string;
  docsPluginId: string;
  routePrefix: string;
  dropdownItemsBefore?: unknown;
  dropdownItemsAfter?: unknown;
  versions?: unknown;
};

export default function VersionDropdown(props: Props) {
  const {pathname} = useLocation();
  const absPrefix = useBaseUrl(props.routePrefix); // includes baseUrl
  const active = pathname === absPrefix || pathname.startsWith(absPrefix + '/');
  if (!active) return null;

  const before = Array.isArray(props.dropdownItemsBefore) ? props.dropdownItemsBefore : [];
  const after  = Array.isArray(props.dropdownItemsAfter)  ? props.dropdownItemsAfter  : [];
  const vers   = Array.isArray(props.versions)            ? props.versions            : undefined;

  return (
    <DocsVersionDropdownNavbarItem
      position={props.position}
      className={props.className}
      docsPluginId={props.docsPluginId}
      dropdownItemsBefore={before}
      dropdownItemsAfter={after}
      versions={vers}
    />
  );
}
