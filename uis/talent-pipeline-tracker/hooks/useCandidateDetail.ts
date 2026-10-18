import { useEffect, useState } from "react";
import type { Candidate } from "@/types/candidate";
import { getRecord } from "@/lib/api/records";

/**
 * ------------Drawer and full page------------
 * One candidate's full details from GET /records/:id.
 * id is null while the drawer is closed: nothing is fetched.
 * (Hooks can't be called conditionally, so the drawer calls this
 * on every render and passes null instead of skipping the call.)
 */
export function useCandidateDetail(id: string | null) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(id !== null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Another candidate opened → forget the old one and show the skeleton.
  // Done during render (not in an effect), so the previous candidate's
  // details never flash under the new one's ID.
  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setCandidate(null);
    setLoading(id !== null);
    setError(null);
  }

  useEffect(() => {
    if (id === null) return; // drawer closed: nothing to load

    // Without ignore, a slow reply for the previous candidate can arrive
    // last and show the wrong person under this candidate's ID.
    let ignore = false; // only the latest request updates the details
    async function load(candidateId: string) {
      try {
        const response = await getRecord(candidateId);
        if (!ignore) {
          setCandidate(response);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load the candidate.",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load(id);
    return () => {
      ignore = true;
    };
  }, [id, reloadKey]);

  const retry = () => {
    setLoading(true); // show the skeleton again
    setError(null);
    setReloadKey((k) => k + 1); // new value → the effect runs again
  };

  return { candidate, loading, error, retry };
}
