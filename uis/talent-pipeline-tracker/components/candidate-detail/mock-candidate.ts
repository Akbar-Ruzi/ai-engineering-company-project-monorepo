import type { Candidate } from "@/types/candidate";

// Placeholder until GET /records/:id is wired up. Delete this file then.
export const MOCK_CANDIDATE: Candidate = {
  id: "mock",
  full_name: "Emily Chen",
  email: "emily.chen@example.com",
  phone: "+1 555 0192",
  position: "Software Engineer",
  linkedin_url: "https://linkedin.com/in/emilychen",
  cv_url: "https://example.com/files/emily_chen_cv.pdf",
  status: "in_progress",
  stage: "technical_interview",
  experience_years: 6,
  applied_at: "2024-10-12T09:30:00.000Z",
  updated_at: "2026-10-16T16:15:00.000Z",
  notes_count: 2,
};
