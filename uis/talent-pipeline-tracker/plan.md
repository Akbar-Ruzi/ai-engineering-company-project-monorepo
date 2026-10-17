# Talent Pipeline Tracker — Build Plan

Follow the steps in order. Use `public/ui-ux/` screenshots as visual references.
Before writing Next.js code, read the relevant installed guides in `node_modules/next/dist/docs/`, as required by `AGENTS.md`.

Visual styling is not formally evaluated in the assignment; usability and clearly displayed required information are required. Drawers, expanded form presentations, and screenshot comparisons are additional scope retained in this plan.

## 1. Set up the project structure ✅

Check the existing structure and add any missing folders or starter files. Implement their contents in the related steps below:

```text
app/
  page.tsx                       # Candidate list at /
  candidates/[id]/page.tsx        # Candidate detail at /candidates/[id]
  layout.tsx                     # Root layout, fonts, and global style imports
  globals.css                    # Global styles
components/
  shared/                        # Reused across pages: app header, badges, error/empty states
  candidate-list/                # List page: header, filters, table (tablet/desktop), cards (mobile), pagination, skeleton
  candidate-detail/              # Detail page/drawer: overview, notes
  candidate-form/                # Create/edit candidate form
  future/                        # Draft extras, git-ignored (see Future enhancements)
lib/api/api-fetch.ts             # Shared fetch helper (buildUrl + apiFetch)
lib/api/records.ts               # Typed candidate (records) endpoint functions
lib/api/notes.ts                 # Typed notes endpoint functions
lib/constants.ts                 # Status/stage UI labels and other fixed values
types/                           # Candidate, note, payload, and response types
.env.example                     # Documents NEXT_PUBLIC_API_URL
hooks/useRecordsFilters.ts       # Optional: URL filters and local search
```

Use local `useState`, `useReducer`, or small hooks for view state. Do not introduce Redux, Zustand, Jotai, or similar global state libraries.

- [x] Confirm `app/page.tsx` exists for the candidate list.
- [x] Read the assigned [context-healthcore.md](context-healthcore.md) before writing application code; use its company scenario, labels, and terminology throughout the interface.
- [x] Confirm this app is inside your existing fork of the course monorepo at `uis/talent-pipeline-tracker`, rather than a new standalone repository.
- [x] Create `app/candidates/[id]/page.tsx` for candidate details.
- [x] Confirm `app/layout.tsx` exists for the root layout, fonts, and global style imports.
- [x] Confirm `app/globals.css` exists for global styles.
- [x] Create `components/` for list rows/cards, filters, notes, forms, and loading/error feedback.
- [x] Confirm `lib/api/` exists for the shared fetch helper and endpoint functions.
- [x] Create `types/` for candidate, note, payload, and response types.
- [x] Create `.env.example` to document `NEXT_PUBLIC_API_URL` in step 2.
- [x] Decide whether `hooks/useRecordsFilters.ts` is needed; create it if it helps keep the list page readable.

## 2. Configure the API URL and shared fetch helper ✅

Complete this setup before starting step 3: Show all candidates in a list.

Files: `lib/api/api-fetch.ts`, `.env.example`.

No authentication is required for now.

- [x] Configure `NEXT_PUBLIC_API_URL` and document it in `.env.example`.
- [x] Create `.env.local` in the app directory with `NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1`.
- [x] Treat endpoint paths as relative to `NEXT_PUBLIC_API_URL`, which may already include `/api/v1`; do not append that prefix twice.
- [x] Create a shared fetch helper in `lib/api/api-fetch.ts`. Show a clear error if `NEXT_PUBLIC_API_URL` is missing, normalize trailing slashes, merge headers with `new Headers(init?.headers)`, and handle HTTP errors, invalid JSON, and explicitly permitted empty responses.
- [x] Use `async/await` for API requests, check `response.ok`, and parse JSON only when the endpoint expects a JSON response. Throw useful errors for HTTP failures and malformed responses so each workflow can display them.

## 3. Show all candidates in a list ✅

Goal: name, position, status, and stage are visible immediately.

Files: `app/page.tsx`, candidate list components in `components/candidate-list/`, and `lib/api/records.ts`.

- [x] Check the list response for the exact field names for ID, name, position, status, stage, and email (needed for search). Note missing or nullable values and define the corresponding candidate type.
- [x] Inspect GET `/records`: identify whether the list is an array or inside a wrapper, record the list key, and define its response type.
- [x] Check whether GET `/records` returns all candidates or one page. If paginated, record page/page-size parameters and total-count or next-page response fields.
- [x] GET `/records`: define the candidate list item type and the list response type, including any wrapper and pagination fields.
- [x] Use these types in the list API function and component props without `any`; validate the returned response shape.
- [x] Implement GET `/records` — list candidates — as a typed function in `lib/api/records.ts` using the shared fetch helper.
- [x] Replace the landing page with the app header and real candidate list.
- [x] Load candidates using the GET `/records` function implemented in this step.
- [x] Choose how to load GET `/records`: fetch on mount in a client component with `useEffect`, or use server-component `fetch` with an explicit revalidation/refresh strategy. Follow the installed Next.js documentation and ensure successful mutations refresh the displayed data without a full document reload.
- [x] Show Name, Position, Status, and Stage in a desktop table and mobile cards.
  - Mobile (below 768px, `md:hidden`): `components/candidate-list/candidate-cards.tsx`.
  - Tablet and desktop (768px and up, `hidden md:block`): `components/candidate-list/candidate-table.tsx`.
  - Both receive the same `candidates: Candidate[]` prop; only CSS decides which one is visible.
- [x] Display status/stage using the UI labels in [README.md](README.md#api-and-data), never raw API values.
- [x] Color status badges by meaning (Received blue, In progress amber, Selected green, Discarded rose), matching the screenshots. Keep stage badges neutral grey; stage is a position in the process, not a judgment.
- [x] Add `whitespace-nowrap` to badges and short buttons so labels like "In progress", "Drawer View", and "Edit Candidate" stay on one line. Several screenshots show them wrapping; treat that as an export bug, not the design.
- [x] Show the correct candidate count and page controls if the API uses pagination, so every candidate can be reached.
- [x] Compute the last page as `Math.max(1, Math.ceil(total / limit))`. Show page buttons only from 1 to the last page, and disable Previous on page 1 and Next on the last page. The API returns an empty list, not an error, for a page beyond the last one, so the controls must never offer one.
- [x] Mobile (cards view): no page controls and no Load more button (matches the mockup). Load the next page automatically as the user scrolls. Keep numbered pagination with `?page=` for the tablet/desktop table.
- [x] Build `components/candidate-list/load-more.tsx`: status area below the cards: invisible spacer when idle, spinner with "Loading more candidates…", error with a "Try again" button, and "All N candidates loaded" when `loaded >= total`. Props: `loaded`, `total`, `loading`, `error`, `onRetry`.
- [x] Mobile: keep a growing candidate list in state; write `handleLoadMore` to fetch the next page and append its `data` to the end. Ignore `?page=` for this view.
- [x] Mobile: watch the `LoadMore` area with `IntersectionObserver` (a `ref` on its wrapper, `rootMargin` ~200px) and call `handleLoadMore` when it comes into view. Guard against duplicate calls: skip while loading, when everything is loaded, and after a failure (only "Try again" retries, so scrolling never loops on errors).
- [x] Mobile: show the spinner while the next page loads, an inline error with "Try again" if it fails (keep the already-loaded cards), and stop loading once the list length reaches `total`, showing "All N candidates loaded".
- [x] Mobile and desktop render at the same time (one is hidden by CSS); keep the table's single page and the cards' growing list as separate state, not a JavaScript screen-width check.
- [x] Show a loading spinner or skeleton while fetching candidates, an error message with Retry on failure, and an empty state when the API returns no candidates.
- [x] Build `components/candidate-list/candidate-list-skeleton.tsx`: card placeholders on mobile and table-row placeholders on tablet/desktop (same `md:` switch as the list), with `aria-busy` and a screen-reader "Loading candidates…" message.
- [x] Build `components/shared/error-state.tsx`: reusable `role="alert"` box with `message`, optional `title`, and an optional Retry button shown only when `onRetry` is passed.
- [x] Build `components/shared/empty-state.tsx`: reusable empty message with `title`, optional `description`, and an optional action button (`actionLabel` + `onAction`).
- [x] Wire the states in `app/page.tsx` in this order: `loading` → `CandidateListSkeleton`; `error` → `ErrorState` with Retry; `total === 0` → `EmptyState` ("No candidates yet"); otherwise the cards/table and pagination.
- [x] Make Retry run the request again (for example a `reloadKey` counter in the effect's dependency array) and set `loading` to `true` in the Retry handler, not at the top of the effect.
- [x] Check: HTTP errors and malformed list responses are displayed in the list UI.
- [x] Check: `/` lists real candidates from GET `/records`, with name, position, status, and stage visible immediately.
- [x] Check: list state uses local React state/hooks without external global state libraries; components, types, and API access are separated, and types match the API structures.
- [x] Check: the list header, field labels, and status/stage labels reflect the assigned HealthCore CONTEXT.
- [x] Check: a successful fetch visibly renders the loaded list or empty result, completing the loading/success/error states for list fetching.
- [x] Keep list state near the components that use it; avoid passing state through unrelated intermediate components solely to reach a child (prop drilling).
- [x] Once the mobile auto-load works, move each view's data logic out of `app/page.tsx` into its own hook, so the two views no longer share state:
  - `hooks/useCandidatePage.ts` (tablet/desktop table): `result`, `loading`, `error`, `page`, `setPage`, `retry`.
  - `hooks/useCandidateFeed.ts` (mobile cards): `candidates`, `total`, `loading`, `loadingMore`, `error`, `loadMore`, `retry`. It fetches its own page 1, which removes the `if (page === 1)` link inside the table's effect.
  - `app/page.tsx` only calls the two hooks and renders the components. Accept the extra page-1 request on first load (both views are always mounted).
  - Do this before step 4, so search and filters can be passed to both hooks as input.

## 4. Filter and search without reloading ✅

Goal: filter by status and stage, and search by name or email without reloading the page.

Files: candidate list page and its filter/search components.

- [x] Confirm the allowed status values from the backend documentation and define their TypeScript type.
- [x] Confirm the allowed stage values from the backend documentation and define their TypeScript type.
- [x] Reuse GET `/records` from step 3; add documented query parameters if the API handles filtering or search.
- [x] Add Status and Stage filters using the backend's allowed values.
- [x] Use the [README.md mappings](README.md#api-and-data) for filter options: display UI labels, but use raw API values for filter logic, URL parameters, and API queries.
- [x] Add a search box that matches name or email, ignoring letter case.
- [x] Keep the search string in local `useState`. For client-side search, filter the loaded candidates using case-insensitive `includes` on name and email. If the official API documentation supports a search query parameter, refetch with that parameter instead where appropriate. Typing must update results without a full page reload.
- [x] Make search and both filters work together without a full page reload.
- [x] Store status and stage in the URL so refreshing keeps them; preserve unrelated URL parameters.
- [x] Read status and stage using `useSearchParams`; follow the installed Next.js guidance for any required Suspense boundary.
- [x] On a filter change, copy the current query into `URLSearchParams`, set the changed filter value, or delete its key when empty. Keep unrelated parameters.
- [x] Navigate with `router.push` or `router.replace`, using `usePathname` for the current path. Append `?${params.toString()}` only when parameters remain, so an empty query does not leave a trailing `?`.
- [x] Add Clear filters to reset search, status, and stage.
- [x] Reset pagination to page 1 whenever search, status, or stage changes, and show accurate result counts.
- [x] Mobile: when search, status, or stage changes, clear the loaded cards and start again from page 1. Ignore replies from older requests that arrive late, so old results never mix into the new list.
- [x] Correct out-of-range or invalid pages: if the requested page is beyond the last page while `total > 0` (for example `?page=99`, an old bookmark, or fewer results after a change), jump to the last valid page; treat invalid values such as `?page=abc` or `?page=-3` as page 1. Never show an empty page while matching candidates exist.
- [x] Tell empty results apart using `total`: `total === 0` with no filters shows "No candidates yet"; `total === 0` with filters shows "No matching candidates" with Clear filters; an empty page with `total > 0` is corrected automatically, not shown as empty.
- [x] Search/filter all loaded candidates before client pagination. If the backend paginates, use its documented search/filter support to search beyond the current page; record a blocker if that support is missing.
- [x] Show a “No matching candidates” empty state when search or status/stage filters leave the list empty.
- [x] Reuse `EmptyState` for filtered results: title "No matching candidates", a short hint, and `actionLabel="Clear filters"` with `onAction` resetting search, status, and stage.
- [x] Check: status and stage filters are driven by URL query parameters. Refresh the page and open a copied URL to confirm both restore.
- [x] Check: name and email searches update results without a full page reload.
- [x] Check: on page 5, apply a filter with few results and confirm the list returns to page 1. Open `/?page=99` and `/?page=abc` and confirm both land on a valid page showing candidates.
- [x] Check (mobile): load several pages, change a filter, and confirm the cards reset to the first page of matching results with no leftover candidates.
- [x] Keep filter/search state in the list view or a small hook, without prop drilling through unrelated components.

## 5. Open candidate details and edit the candidate

Goal: open a candidate's full details, update their status or stage, and correct their information from the details page.

Files: `app/candidates/[id]/page.tsx`, `components/candidate-form/`, shared detail/drawer components, and `lib/api/records.ts`.

- [ ] Confirm the full detail response fields, including phone, LinkedIn URL, CV URL, years of experience, and application date. Note missing or nullable values and extend the candidate/response types.
- [ ] Confirm the PUT and PATCH request bodies and responses, reusing status/stage types from step 4.
- [ ] GET `/records/:id`: define the full candidate detail response type, including optional or nullable fields.
- [ ] PUT `/records/:id`: define the full-edit request payload and response type, including all fields required for replacement.
- [ ] PATCH `/records/:id`: define the partial-update request payload and response type for status/stage changes.
- [ ] Use these types in the detail/update API functions and component props without `any`; validate returned response shapes.
- [ ] Implement GET `/records/:id` — get full candidate details — using the shared fetch helper.
- [ ] Implement PATCH `/records/:id` — update status or stage — using the shared fetch helper.
- [ ] Implement PUT `/records/:id` — save edited candidate information — using the shared fetch helper.
- [ ] Make each list candidate open their own details using GET `/records/:id`.
- [ ] Use the route's candidate ID for GET `/records/:id`. Once notes are implemented in step 6, the record and notes requests can run in parallel with `Promise.all`.
- [ ] Show name, email, phone, position, LinkedIn URL, CV URL, years of experience, status, stage, and application date.
- [ ] Keep exact API property names in the detail types and map them to display labels from the assigned HealthCore CONTEXT. Render LinkedIn and CV as usable links when valid URLs are present.
- [ ] Display readable placeholders for missing optional values and loading/error feedback.
- [ ] Reuse `ErrorState` (with Retry) for failed GET `/records/:id` and failed PUT/PATCH saves, and add a detail-shaped loading skeleton.
- [ ] Add status and stage controls and save only the intended changes through PATCH `/records/:id`.
- [ ] Use the [README.md mappings](README.md#api-and-data) in detail controls and labels: send raw API values in PATCH bodies, but show only UI labels in the interface.
- [ ] Send the minimal PATCH body documented by the API. After success, update local candidate state or refetch the record so the changed status/stage appears without a full document reload.
- [ ] Add an Edit action on the candidate details page that opens a form populated with their existing information.
- [ ] Place the edit form on the detail page or a separate edit route reached from that page. Submit PUT `/records/:id` with the full resource or exact replacement shape required by the API.
- [ ] Build a reusable form with Full Name, Email, Phone, Position, LinkedIn URL, CV URL, and Years of Experience. CV is a URL field.
- [ ] Validate required fields and formats against the backend documentation.
- [ ] Save corrected information through PUT `/records/:id`, preserving required data outside the form.
- [ ] Add Cancel and retain entered values after a failed save. Keep form actions reachable on mobile.
- [ ] Prevent duplicate submissions and show saving, success, and failure feedback.
- [ ] Show inline or banner success feedback after a successful edit submission and error feedback after a failed attempt.
- [ ] Update the detail and list labels after successful changes.
- [ ] After a successful PUT edit, update local candidate state or refetch the record and synchronize the list so corrected information appears without a full document reload.
- [ ] Support a detail drawer with Close and Expand, and a full page at `/candidates/[id]`, sharing the same content.
- [ ] Preserve list filters, pagination, scroll position, and unsaved changes when switching views.
- [ ] Mobile: after opening a candidate and going back, restore every loaded page and the scroll position, so the user does not jump back to the top.
- [ ] Support mobile drawers, keyboard focus containment, Escape to close, and focus returning to the opener.
- [ ] Check: `/candidates/[id]` loads the correct record and shows every required field, including when opened directly.
- [ ] Check: navigation uses Next.js App Router `Link` and dynamic segments.
- [ ] Check: status and stage updates send PATCH requests from the detail view and persist after refresh.
- [ ] Check: the edit form validates required fields, sends PUT, and shows saving, success, and error feedback.
- [ ] Check: loading/error feedback is visible for detail requests, and terminology matches HealthCore CONTEXT.
- [ ] Check: HTTP errors and malformed responses from GET, PUT, and PATCH are displayed in the detail/edit UI.
- [ ] Check: successful detail fetching displays the correct loaded record, completing the loading/success/error states.
- [ ] Keep detail and edit state scoped to their shared view/components; avoid prop drilling through unrelated components.

## 6. Add and remove internal notes

Goal: add notes after calls or interviews and remove notes when they are no longer relevant.

Files: candidate detail Notes tab, shared note components, and `lib/api/notes.ts`.

- [ ] Confirm note fields, the list response structure, the add-note payload, and the delete response.
- [ ] GET `/records/:id/notes`: define the note type and notes list response type, including any wrapper.
- [ ] POST `/records/:id/notes`: define the add-note request payload and response type.
- [ ] DELETE `/records/:id/notes/:note_id`: define the documented delete response type, using `void` if no content is returned.
- [ ] Use these types in the note API functions and component props without `any`; validate returned response shapes.
- [ ] Implement GET `/records/:id/notes` — list notes — using the shared fetch helper.
- [ ] Implement POST `/records/:id/notes` — add a note — using the shared fetch helper.
- [ ] Implement DELETE `/records/:id/notes/:note_id` — delete a note — using the shared fetch helper.
- [ ] Add Overview and Notes tabs and load notes through GET `/records/:id/notes`.
- [ ] Show notes only within the candidate detail view, in both drawer and expanded presentations.
- [ ] Use the same candidate ID for record and notes requests. Optionally load GET `/records/:id` and GET `/records/:id/notes` in parallel with `Promise.all`, while making request failures visible.
- [ ] Show notes, their actual count, and an empty state. Show dates/authors only when supplied by the API.
- [ ] Reuse `EmptyState` for "No notes yet" (with an Add Note action) and `ErrorState` for failed note requests, with Retry for GET `/records/:id/notes`.
- [ ] Pick one note card layout before building it and use it in both drawer and expanded views. The screenshots show three versions (text with date and trash; author with relative time and no trash; author with date and trash); choose based on which fields the notes API returns, and keep a delete action on every card.
- [ ] Make Add Note open an inline text box with Cancel and Save Note.
- [ ] Reject blank notes and save through POST `/records/:id/notes` using the documented payload.
- [ ] Add inline Cancel and Delete Note confirmation before deletion.
- [ ] Delete through DELETE `/records/:id/notes/:note_id` and remove the note only after success.
- [ ] After a successful note POST, add the returned note to local state or refetch notes. After a successful DELETE using the selected note's ID, remove that note from state or refetch notes. Both operations must update the UI without a full document reload.
- [ ] Prevent duplicate requests and show saving/deleting, success, and failure feedback.
- [ ] Retain note text after a failed save and retain the existing note after a failed delete.
- [ ] Keep note counts synchronized and preserve the selected tab and unsaved note text between drawer and expanded views.
- [ ] Check: notes load with GET, save with POST, and delete with DELETE; the list and count update without a full page reload.
- [ ] Check: note requests show loading or pending feedback, successful mutations show success feedback, and failures show errors.
- [ ] Check: note labels match HealthCore CONTEXT and note types match the API structures.
- [ ] Check: HTTP errors and malformed responses from note requests are displayed in the Notes UI.
- [ ] Check: successful notes fetching displays the notes or empty result, completing the loading/success/error states.
- [ ] Keep note and composer state within the detail/notes components or a small shared hook; avoid prop drilling through unrelated components.

## 7. Create a new candidate

Goal: create a candidate who comes through a referral.

Files: `components/candidate-form/`, candidate list/create views, and `lib/api/records.ts`.

- [ ] Confirm the required creation fields and POST response.
- [ ] POST `/records`: define the create-candidate request payload and response type, marking required and optional fields according to the backend documentation. Reuse existing candidate types where appropriate.
- [ ] Use these types in the creation API function and component props without `any`; validate the returned response shape.
- [ ] Implement POST `/records` — create a candidate — using the shared fetch helper.
- [ ] Add an Add Candidate action to the list.
- [ ] Open the new-candidate form on the list page, in a modal/drawer, or on a dedicated create route. Validate required fields before submitting POST `/records`.
- [ ] Reuse the candidate form from step 5 with empty fields for a new candidate.
- [ ] Include every field required by the API in the registration form.
- [ ] Validate required fields and formats against the backend documentation.
- [ ] Open an empty form for a referred candidate and save through POST `/records`. Add referral metadata only if supported by the documented API.
- [ ] Support drawer and expanded form views while preserving entered values.
- [ ] Add Cancel and saving/success/error feedback; prevent duplicate submissions and retain input after a failed save.
- [ ] Show inline or banner success feedback after a successful creation submission and error feedback after a failed attempt.
- [ ] Show the new candidate in the list after saving and keep form actions reachable on mobile.
- [ ] After a successful POST creation, update local list state or refetch candidates so the new candidate appears without a full document reload.
- [ ] Check: the creation form validates required fields, sends POST, and shows saving, success, and error feedback.
- [ ] Check: creation field labels match HealthCore CONTEXT, and request/response types match the API structures.
- [ ] Check: HTTP errors and malformed creation responses are displayed in the create form UI.
- [ ] Keep creation form state in the form or its owning view; avoid prop drilling through unrelated components.

## Final check

- [ ] Exercise the five workflows above in order using a disposable candidate.
- [ ] Check loading, empty, and failed request states, including failed saves.
- [ ] Compare all supplied screenshots with their desktop, tablet, and mobile views; also check a 375px-wide screen.
- [ ] Check HealthCore labels, keyboard navigation, visible focus, and drawer behavior.
- [ ] Run `npm run lint`, `npx tsc --noEmit`, and `npm run build`; fix failures.
- [ ] Update `README.md` with setup, API configuration, and remaining limitations.
- [ ] Verify `.env.local` is ignored by Git and is not included in the commit; include `.env.example` documenting the required environment variable.
- [ ] Commit and push the finished changes to your existing course monorepo fork on GitHub.
- [ ] Submit the repository link using your instructor's delivery instructions.

## Future enhancements (after the five workflows are submitted)

Optional extras beyond the assignment. Do not start these until every step above is done.

Mockup: `public/ui-ux/future/pipeline-summary.png`. Draft components already exist in `components/future/`: `pipeline-stats.tsx` and `stage-pipeline.tsx` (not rendered yet; each keeps its own temporary mock numbers inside the file).

### Pipeline summary: stat cards and stage bar

- [ ] Decide what the counts include. Recommended: count every candidate, discarded included, so the stage segments add up to the total and clicking a stage gives a list with the same number of rows. Rename the title to "Pipeline by stage" and drop the "discarded not shown" caption.
- [ ] Load stage counts with one GET `/records?stage=<stage>&limit=1` per stage, reading `total`; run them in parallel with `Promise.all`.
- [ ] Load stat card numbers the same way (by status, and personal + technical interview for "In interviews"). Only keep the cards if they stay cheap to compute.
- [ ] Show the summary only after the counts load; if a count request fails, hide it or show a short error. The candidate list must keep working without it.
- [ ] Clicking a stage segment sets the Stage filter in the URL (same as the Stage dropdown); clicking the selected stage again clears it. Outline the selected segment and mark it with `aria-pressed`.
- [ ] Refresh the counts after a successful status/stage change, candidate creation, or edit.
- [ ] Phone layout: one row per stage (label + bar sized by count), since five labels do not fit under one bar at 375px.
- [ ] Replace the in-file mock values (`MOCK_SUMMARY`, `MOCK_STAGE_COUNTS`, `MOCK_DISCARDED`) with real values, then delete them.
- [ ] Check: the segment counts match the list count after clicking each stage, and the numbers update after a status/stage change without a full page reload.

### Render only the visible list view (`useIsMobile`)

Today both views are mounted and CSS hides one (step 3), so first load sends two page-1 requests. Optional alternative: decide the view in JavaScript and mount only one.

- [ ] Add `hooks/useIsMobile.ts`: `useSyncExternalStore` with `window.matchMedia("(max-width: 767px)")`, listening to `change`. Return `null` on the server (`getServerSnapshot`), since the server cannot know the screen size.
- [ ] Move each view out of `app/page.tsx` into its own component, which calls its own hook: `mobile-candidate-list.tsx` (`useCandidateFeed`, cards, LoadMore) and `desktop-candidate-list.tsx` (`useCandidatePage`, table, Pagination). Hooks cannot be chosen with a condition, so choose the component instead.
- [ ] In `app/page.tsx`, render `CandidateListSkeleton` while `useIsMobile()` is `null`, then only `MobileCandidateList` or `DesktopCandidateList`.
- [ ] Keep the 767px query in sync with Tailwind's `md:` breakpoint (768px).
- [ ] Accept that crossing 768px (window resize, tablet rotation) remounts the view: the table returns to page 1 and the mobile feed reloads from page 1. Filters stay, because they live in the URL (step 4).
- [ ] Update the step 3 notes that describe the current approach (both views mounted, one hidden by CSS; extra page-1 request).
- [ ] Check: DevTools Network shows one GET `/records` on first load at mobile and at desktop width; resizing across 768px switches views and loads the right data.
