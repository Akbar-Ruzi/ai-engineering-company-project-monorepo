export type CandidateStatus =
  "received" | "in_progress" | "selected" | "discarded";

export type CandidateStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

// One candidate, as returned by GET /records and GET /records/:id
// (backend schema RecordOut; also the response of PUT and PATCH /records/:id)
export type Candidate = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null; // 38 of 101 are null
  cv_url: string | null;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  applied_at: string; // ISO date, e.g. "2026-02-28T20:04:32.114Z"
  updated_at: string;
  notes_count: number;
};

// The wrapper around one page of candidates
export type CandidateListResponse = {
  total: number; // all matching candidates, e.g. 101
  page: number; // current page, starts at 1
  limit: number; // page size, default 20
  data: Candidate[];
};

// Query options for GET /records
export type GetRecordsParams = {
  page?: number;
  limit?: number;
  status?: CandidateStatus;
  stage?: CandidateStage;
  search?: string;
};

// Filters shared by the table and the mobile feed
export type ListFilters = Pick<GetRecordsParams, "status" | "stage" | "search">;

// Body for PUT /records/:id (backend schema RecordCreate, same as POST /records).
// Replaces the candidate's general information from the Edit form.
// Response: the updated Candidate.
export type UpdateCandidatePayload = Omit<
  Candidate,
  "id" | "status" | "stage" | "applied_at" | "updated_at" | "notes_count"
>;

// Body for PATCH /records/:id (backend schema RecordPatch).
// Changes status and/or stage only; send just the field that changed.
// Response: the updated Candidate.
export type UpdateCandidateStatusPayload = Partial<
  Pick<Candidate, "status" | "stage">
>;

// Edit form (PUT) and create form (POST, step 7)
// What the form's inputs hold while the user types. Every value is a string,
// because that's what <input> gives back (even type="number").
// They are turned into the API payload (numbers, null for empty URLs) on save.
export type CandidateFormValues = {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string;
  cv_url: string;
  experience_years: string;
};
