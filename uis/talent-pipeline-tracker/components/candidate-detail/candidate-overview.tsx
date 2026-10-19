import GeneralInformationCard from "@/components/candidate-detail/general-information-card";
import RecruitmentProgressCard from "@/components/candidate-detail/recruitment-progress-card";
import type { Candidate } from "@/types/candidate";

// Overview tab body, shared by the drawer and the full page.
// "drawer" is the narrow side panel; "page" is the wide expanded view.
export default function CandidateOverview({
  candidate,
  layout,
  onCandidateChange,
}: {
  candidate: Candidate;
  layout: "drawer" | "page";
  onCandidateChange: (updated: Candidate) => void; // after a successful save
}) {
  return (
    <div className="space-y-5">
      <RecruitmentProgressCard
        candidate={candidate}
        layout={layout}
        onSaved={onCandidateChange}
      />
      <GeneralInformationCard
        candidate={candidate}
        layout={layout}
        onSaved={onCandidateChange}
      />
    </div>
  );
}
