// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
export interface RelayByAddress {
  __typename: 'RelayByAddress';
  ipv4?: string;
  ipv6?: string;
  port?: number;
}
export interface RelayByName {
  __typename: 'RelayByName';
  hostname: string;
  port?: number;
}

export interface RelayByNameMultihost {
  __typename: 'RelayByNameMultihost';
  dnsName: string;
}

export type Relay = RelayByAddress | RelayByName | RelayByNameMultihost;
