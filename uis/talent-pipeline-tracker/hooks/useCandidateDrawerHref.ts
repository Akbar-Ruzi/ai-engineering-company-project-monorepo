"use client";

import { useSearchParams } from "next/navigation";

import { drawerHref, toListQuery } from "@/lib/utils/candidate-urls";

// Builds the drawer link for a candidate: the current list URL plus
// ?candidate=<id>, so search, filters, and page are kept.
export function useCandidateDrawerHref() {
  const listQuery = toListQuery(useSearchParams());

  return (id: string) => drawerHref(listQuery, id);
}
