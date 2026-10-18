import { Suspense } from "react";

import AppHeader from "@/components/shared/app-header";
import CandidateFullPage from "@/components/candidate-detail/candidate-full-page";
import { toListQuery } from "@/lib/utils/candidate-urls";

// Not async: the page never awaits params itself. They are read inside
// <Suspense>, so the rest of the page can still be prerendered (cacheComponents).
export default function CandidateDetailPage(
  props: PageProps<"/candidates/[id]">,
) {
  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
          {Promise.all([props.params, props.searchParams]).then(
            ([{ id }, searchParams]) => (
              <CandidateFullPage id={id} listQuery={toListQuery(searchParams)} />
            ),
          )}
        </Suspense>
      </main>
    </div>
  );
}
