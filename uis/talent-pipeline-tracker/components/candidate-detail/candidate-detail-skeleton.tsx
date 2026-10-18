// Placeholders shown while GET /records/:id loads, in the drawer and the full page.
// Same shapes as the real header and Overview, so the layout does not jump
// when the data arrives (like CandidateListSkeleton for the list).

import type { ReactNode } from "react";

const BAR = "block animate-pulse rounded-full bg-slate-200";

// A grey bar. A <span>, so it can also sit inside a heading.
export function SkeletonBar({ className }: { className: string }) {
  return <span aria-hidden="true" className={`${BAR} ${className}`} />;
}

// Avatar circle placeholder; size matches each view's real avatar
export function AvatarSkeleton({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`shrink-0 animate-pulse rounded-full bg-slate-200 ${className}`}
    />
  );
}

// Status/stage badges and the Overview/Notes tabs
export function CandidateHeaderSkeleton({
  tabsClassName,
}: {
  tabsClassName: string;
}) {
  return (
    <div aria-hidden="true">
      <div className="mt-3 flex gap-2">
        <SkeletonBar className="h-6 w-24" />
        <SkeletonBar className="h-6 w-32" />
      </div>
      <div className={`flex gap-8 pb-3 ${tabsClassName}`}>
        <SkeletonBar className="h-5 w-20" />
        <SkeletonBar className="h-5 w-16" />
      </div>
    </div>
  );
}

// Recruitment progress and General information cards.
// "drawer": 2-column fields + a Last Updated footer row.
// "page": 3-column fields, with Last Updated as one more field.
export function CandidateOverviewSkeleton({
  layout,
}: {
  layout: "drawer" | "page";
}) {
  const isPage = layout === "page";
  const fieldCount = isPage ? 9 : 8;

  return (
    <div aria-busy="true" className="space-y-5">
      <span className="sr-only" role="status">
        Loading candidate…
      </span>

      <CardSkeleton>
        <div className={isPage ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
          {[1, 2].map((select) => (
            <div key={select}>
              <SkeletonBar className="h-4 w-32" />
              <SkeletonBar className="mt-3 h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </CardSkeleton>

      <CardSkeleton action>
        <div
          className={`grid grid-cols-1 gap-x-6 gap-y-5 ${
            isPage ? "md:grid-cols-3" : "sm:grid-cols-2"
          }`}
        >
          {Array.from({ length: fieldCount }, (_, field) => (
            <div key={field}>
              <SkeletonBar className="h-3 w-24" />
              <SkeletonBar className="mt-2 h-4 w-40 max-w-full" />
            </div>
          ))}
        </div>

        {!isPage && (
          <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <SkeletonBar className="h-4 w-24" />
            <SkeletonBar className="h-4 w-36" />
          </div>
        )}
      </CardSkeleton>
    </div>
  );
}

// Same box as Overview's Card: title bar, optional action (Edit) bar, content
function CardSkeleton({
  action = false,
  children,
}: {
  action?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      aria-hidden="true"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <SkeletonBar className="h-4 w-40" />
        {action && <SkeletonBar className="h-6 w-14" />}
      </div>
      {children}
    </section>
  );
}
