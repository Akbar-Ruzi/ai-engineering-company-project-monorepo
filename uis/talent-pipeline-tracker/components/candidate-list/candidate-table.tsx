"use client";

import Link from "next/link";
import { StageBadge, StatusBadge } from "@/components/shared/candidate-badges";
import { useCandidateDrawerHref } from "@/hooks/useCandidateDrawerHref";

import type { Candidate } from "@/types/candidate";

// Tablet and desktop view (md and up). Mobile uses CandidateCards.
export default function CandidateTable({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const getCandidateDrawerHref = useCandidateDrawerHref();

  return (
    <table className="w-full text-left">
      <thead className="border-b border-slate-200">
        <tr className="whitespace-nowrap text-xs font-semibold uppercase tracking-wider text-slate-500 lg:text-sm">
          <th scope="col" className="px-6 py-5 lg:px-8">
            Name
          </th>
          <th scope="col" className="px-6 py-5 lg:px-8">
            Position
          </th>
          <th scope="col" className="px-6 py-5 lg:px-8">
            Current status
          </th>
          <th scope="col" className="px-6 py-5 lg:px-8">
            Current stage
          </th>
          <th scope="col" className="px-6 py-5 lg:px-8">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {candidates.map((candidate) => (
          <tr key={candidate.id} className="relative hover:bg-slate-50">
            <td className="px-6 py-5 lg:px-8">
              {/* The ::after overlay makes the whole row clickable */}
              <Link
                href={getCandidateDrawerHref(candidate.id)}
                scroll={false}
                className="text-slate-900 after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-blue-500"
              >
                {candidate.full_name}
              </Link>
            </td>
            <td className="px-6 py-5 text-slate-600 lg:px-8">
              {candidate.position}
            </td>
            <td className="px-6 py-5 lg:px-8">
              <StatusBadge status={candidate.status} />
            </td>
            <td className="px-6 py-5 lg:px-8">
              <StageBadge stage={candidate.stage} />
            </td>
            {/* Visual cue only; the row overlay link above handles the click */}
            <td className="px-6 py-5 text-right lg:px-8" aria-hidden="true">
              <span className="whitespace-nowrap text-sm font-medium text-blue-600">
                View details
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
