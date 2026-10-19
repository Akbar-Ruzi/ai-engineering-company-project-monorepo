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
// Small dots show how far along it is (step 1 to 5), so stages differ a
// little without adding colors that compete with the status.
const STAGE_STEP: Record<CandidateStage, number> = {
  pending: 1,
  review: 2,
  personal_interview: 3,
  technical_interview: 4,
  offer_presented: 5,
};
const STAGE_COUNT = Object.keys(STAGE_STEP).length;

export function StageBadge({ stage }: { stage: CandidateStage }) {
  const step = STAGE_STEP[stage];
  return (
    <span
      className={`${BADGE_BASE} gap-2 border-slate-200 bg-slate-100 text-slate-700`}
    >
      {/* Decorative: screen readers get "step N of 5" from the text below */}
      <span aria-hidden="true" className="flex gap-0.5">
        {Array.from({ length: STAGE_COUNT }, (_, index) => (
          <span
            key={index}
            className={`size-1.5 rounded-full ${
              index < step ? "bg-slate-600" : "bg-slate-300"
            }`}
          />
        ))}
      </span>
      {STAGE_LABELS[stage]}
      <span className="sr-only">
        {" "}
        (step {step} of {STAGE_COUNT})
      </span>
    </span>
  );
}
