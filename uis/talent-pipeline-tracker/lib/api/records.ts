import { apiFetch } from "./api-fetch";
import type {
  Candidate,
  CandidateListResponse,
  GetRecordsParams,
  UpdateCandidatePayload,
  UpdateCandidateStatusPayload,
} from "@/types/candidate";
import {
  isCandidate,
  isCandidateListResponse,
} from "./validators/candidate-guards";

// GET /records: one page of candidates, optionally filtered
export async function getRecords(
  params: GetRecordsParams = {},
): Promise<CandidateListResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.stage) query.set("stage", params.stage);
  if (params.search?.trim()) query.set("search", params.search.trim());

  const qs = query.toString();
  const data = await apiFetch<unknown>(qs ? `/records?${qs}` : "/records");

  if (!isCandidateListResponse(data)) {
    throw new Error("The candidate list came back in an unexpected format.");
  }
  return data;
}

// GET /records/:id: one candidate's full details
export async function getRecord(id: string): Promise<Candidate> {
  const data = await apiFetch<unknown>(`/records/${encodeURIComponent(id)}`);
  if (!isCandidate(data)) {
    throw new Error("The candidate details came back in an unexpected format.");
  }
  return data;
}

// PATCH /records/:id: change status and/or stage only
export async function updateRecordStatus({
  id,
  payload,
}: {
  id: string;
  payload: UpdateCandidateStatusPayload;
}): Promise<Candidate> {
  const data = await apiFetch<unknown>(`/records/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  if (!isCandidate(data)) {
    throw new Error("The updated candidate came back in an unexpected format.");
  }
  return data;
}

// PUT /records/:id: replace the candidate's general information
export async function updateRecord({
  id,
  payload,
}: {
  id: string;
  payload: UpdateCandidatePayload;
}): Promise<Candidate> {
  const data = await apiFetch<unknown>(`/records/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!isCandidate(data)) {
    throw new Error("The updated candidate came back in an unexpected format.");
  }
  return data;
}
