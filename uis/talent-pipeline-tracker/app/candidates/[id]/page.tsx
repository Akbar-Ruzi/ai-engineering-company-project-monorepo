import Link from "next/link";
import { Suspense } from "react";

// Not async: the page never awaits params itself. The ID is read inside
// <Suspense>, so the rest of the page can still be prerendered (cacheComponents).
export default function CandidateDetailPage(
  props: PageProps<"/candidates/[id]">,
) {
  return (
    <main className="flex flex-1 w-full max-w-3xl flex-col gap-4 py-16 px-6 mx-auto">
      <Link href="/" className="text-sm text-zinc-600 hover:underline">
        ← Back to Candidates
      </Link>
      <h1 className="text-2xl font-semibold">Candidate details</h1>
      <Suspense fallback={<p className="text-zinc-600">Loading…</p>}>
        {props.params.then(({ id }) => (
          <CandidateId id={id} />
        ))}
      </Suspense>
    </main>
  );
}

function CandidateId({ id }: { id: string }) {
  return <p className="text-zinc-600">Candidate ID: {id}</p>;
}
