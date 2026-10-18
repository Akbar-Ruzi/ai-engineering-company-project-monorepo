import { Suspense } from "react";

import AppHeader from "@/components/shared/app-header";
import CandidatesHeader from "@/components/candidate-list/candidates-header";
import CandidateList from "@/components/candidate-list/candidate-list";
import CandidateListSkeleton from "@/components/candidate-list/candidate-list-skeleton";
import CandidateDrawer from "@/components/candidate-detail/candidate-drawer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-slate-50 text-slate-900">
      <AppHeader />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <CandidatesHeader />

        {/* Reads the URL (useSearchParams), so it must be inside Suspense */}
        <Suspense fallback={<CandidateListSkeleton />}>
          <CandidateList />
        </Suspense>
      </main>

      {/* Opens when the URL has ?candidate=<id>; also reads the URL */}
      <Suspense fallback={null}>
        <CandidateDrawer />
      </Suspense>
    </div>
  );
}
