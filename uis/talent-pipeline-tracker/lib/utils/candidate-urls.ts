// URLs for the candidate list, drawer, and full page.
// A "list query" is the list's search, filters, and page (e.g. "status=received&page=2"),
// never including ?candidate. It is carried between views so the user returns to the same list.

import { DRAWER_PARAM } from "@/lib/constants";

type SearchParamsRecord = Record<string, string | string[] | undefined>;

// URLSearchParams (client, useSearchParams) or a plain object (server, page searchParams)
// → list query string without ?candidate
export function toListQuery(
  searchParams: URLSearchParams | SearchParamsRecord,
): string {
  const params = new URLSearchParams();

  const entries =
    searchParams instanceof URLSearchParams
      ? searchParams.entries()
      : Object.entries(searchParams);

  for (const [key, value] of entries) {
    if (key !== DRAWER_PARAM && typeof value === "string") {
      params.set(key, value);
    }
  }
  return params.toString();
}

// "/path?query", or just "/path" when the query is empty (no trailing "?")
function withQuery(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}

// "/?status=received"
export function listHref(listQuery: string): string {
  return withQuery("/", listQuery);
}

// "/?status=received&candidate=12"
export function drawerHref(listQuery: string, id: string): string {
  const params = new URLSearchParams(listQuery);
  params.set(DRAWER_PARAM, id);
  return withQuery("/", params.toString());
}

// "/candidates/12?status=received"
export function fullPageHref(listQuery: string, id: string): string {
  return withQuery(`/candidates/${id}`, listQuery);
}

// The candidate ID the drawer should show, or null when it is closed
export function getDrawerCandidateId(searchParams: URLSearchParams): string | null {
  return searchParams.get(DRAWER_PARAM);
}
