"use client";

import Link from "next/link";
import { StageBadge, StatusBadge } from "@/components/shared/candidate-badges";
import { useSearchParams } from "next/navigation";
import { fullPageHref, toListQuery } from "@/lib/utils/candidate-urls";
import type { Candidate } from "@/types/candidate";

// Mobile view (below md). Tablet and desktop use CandidateTable.
// Cards open the full page directly (no drawer on mobile), carrying the
// list query so Back to Candidates returns to the same list.
export default function CandidateCards({
  candidates,
  onOpen,
}: {
  candidates: Candidate[];
  onOpen: () => void; // remembers the scroll position before leaving the list
}) {
  const listQuery = toListQuery(useSearchParams());

  return (
    <ul className="space-y-4">
      {candidates.map((candidate) => (
        <li key={candidate.id}>
          <Link
            href={fullPageHref(listQuery, candidate.id)}
            onClick={onOpen}
            className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold text-slate-900">
                  {candidate.full_name}
                </p>
                <p className="truncate text-slate-600">{candidate.position}</p>
              </div>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mt-1 size-5 shrink-0 text-slate-400"
              >
                <path d="m8 5 5 5-5 5" />
              </svg>
            </div>

            <dl className="mt-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  <StatusBadge status={candidate.status} />
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Current stage</dt>
                <dd>
                  <StageBadge stage={candidate.stage} />
                </dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  );
}
