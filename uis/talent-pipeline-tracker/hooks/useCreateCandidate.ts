import { useCandidateUpdates } from "@/context/candidate-updates";
import { createRecord } from "@/lib/api/records";
import type { Candidate, CreateCandidatePayload } from "@/types/candidate";

/**
 * ------------Create form (drawer and full page)------------
 * POST /records, then tells the list to refetch so the new candidate appears.
 * Throws on failure, so the form can show the error and keep the values.
 */
export function useCreateCandidate() {
  const { notifyCandidateSaved } = useCandidateUpdates();

  const createCandidate = async (
    payload: CreateCandidatePayload,
  ): Promise<Candidate> => {
    const created = await createRecord(payload);
    notifyCandidateSaved();
    return created;
  };

  return { createCandidate };
}
