// Derived from cardano-js-sdk at 48019e49; modified for Blaze packaging.
// @ts-nocheck -- pinned upstream source is covered by Blaze golden tests.
/** Pagination arguments */
export interface PaginationArgs {
  /** Start at */
  startAt: number;
  /** Page size */
  limit: number;
}

/** Base interface to model a query as paginated */
export interface Paginated<TQueryResult> {
  /** Result list per page */
  pageResults: TQueryResult[];
  /** Total result count */
  totalResultCount: number;
}
