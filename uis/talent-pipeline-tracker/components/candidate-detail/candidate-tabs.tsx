import type { KeyboardEvent } from "react";

import type { CandidateTab } from "@/types/candidate";

const TABS: CandidateTab[] = ["overview", "notes"];

type Layout = "drawer" | "page";

// ids that link each tab to its panel (aria-controls / aria-labelledby).
// The layout keeps them unique if a drawer and a full page ever share a page.
export function tabId(layout: Layout, tab: CandidateTab) {
  return `candidate-${layout}-${tab}-tab`;
}
export function tabPanelId(layout: Layout, tab: CandidateTab) {
  return `candidate-${layout}-${tab}-panel`;
}

// Overview / Notes tabs, shared by the drawer and the full page.
// The parent owns the active tab and shows the matching panel.
// Keyboard (ARIA tabs pattern): only the active tab is a Tab stop;
// Left/Right arrows move between tabs and select them.
export default function CandidateTabs({
  notesCount,
  layout,
  activeTab,
  onTabChange,
}: {
  notesCount: number;
  layout: Layout;
  activeTab: CandidateTab;
  onTabChange: (tab: CandidateTab) => void;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    const index = TABS.indexOf(activeTab);
    const next = TABS[(index + step + TABS.length) % TABS.length];
    onTabChange(next);
    // Move focus with the selection, so the next arrow press continues from it
    event.currentTarget
      .querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)
      ?.focus();
  }

  function tabClass(tab: CandidateTab) {
    return `flex items-center gap-2 border-b-2 pb-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
      activeTab === tab
        ? "border-blue-600 font-medium text-blue-600"
        : "border-transparent text-slate-500 hover:text-slate-800"
    }`;
  }

  return (
    <div
      role="tablist"
      aria-label="Candidate sections"
      onKeyDown={handleKeyDown}
      // The full page's header card separates the tabs with a line
      className={`mt-5 flex gap-8 ${
        layout === "page" ? "border-t border-slate-100 pt-3" : ""
      }`}
    >
      <button
        type="button"
        role="tab"
        id={tabId(layout, "overview")}
        data-tab="overview"
        aria-selected={activeTab === "overview"}
        // Only the active panel is rendered, so only its tab points at it
        aria-controls={
          activeTab === "overview" ? tabPanelId(layout, "overview") : undefined
        }
        tabIndex={activeTab === "overview" ? 0 : -1}
        onClick={() => onTabChange("overview")}
        className={tabClass("overview")}
      >
        Overview
      </button>
      <button
        type="button"
        role="tab"
        id={tabId(layout, "notes")}
        data-tab="notes"
        aria-selected={activeTab === "notes"}
        aria-controls={
          activeTab === "notes" ? tabPanelId(layout, "notes") : undefined
        }
        tabIndex={activeTab === "notes" ? 0 : -1}
        onClick={() => onTabChange("notes")}
        className={tabClass("notes")}
      >
        Notes
        <span className="rounded-full bg-slate-100 px-2 text-sm">
          {notesCount}
        </span>
      </button>
    </div>
  );
}
