import { STAGE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { CandidateStage, CandidateStatus } from "@/types/candidate";

const BADGE_BASE =
  "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-0.5 text-sm";

// Status is a judgment, so it is colored by meaning.
const STATUS_STYLES: Record<CandidateStatus, string> = {
  received: "border-blue-200 bg-blue-50 text-blue-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  selected: "border-emerald-200 bg-emerald-50 text-emerald-700",
  discarded: "border-rose-200 bg-rose-50 text-rose-700",
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <span className={`${BADGE_BASE} ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// Stage is only a position in the process, so it stays neutral grey.
export function StageBadge({ stage }: { stage: CandidateStage }) {
  return (
    <span className={`${BADGE_BASE} border-slate-200 bg-slate-100 text-slate-700`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}
