# Talent Pipeline Tracker

Frontend for HealthCore's recruitment pipeline, built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. It replaces the shared spreadsheet the People team used for the Executive Assistant search at the Austin headquarters.

## Features

- **Candidate list:** name, position, status, and stage for every candidate. A table with numbered pages on tablet and desktop; cards that load more as you scroll on mobile.
- **Filter and search:** filter by status and stage, and search by name or email, without reloading the page. Filters live in the URL, so they survive a refresh and can be shared.
- **Candidate details:** open a candidate in a drawer over the list, or expand it to a full page (`/candidates/<id>`). Update status and stage, and correct their general information.
- **Internal notes:** add a note after a call or interview, and delete it (with confirmation) when it is no longer relevant. The note count updates right away.
- **Create a candidate:** register a referred candidate with **Add candidate**, in a drawer or on a full page (`/candidates/new`). After saving, the new candidate's details open.
- **Feedback everywhere:** every request shows loading, success, and error states; failed saves keep what the user typed and offer Retry.
- **Unsaved work survives switching views:** form edits, a half-typed note, an open delete confirmation, and the selected tab are kept between the drawer and the full page.

## Context of the active search

| Field | Value |
| --- | --- |
| Position | Executive Assistant |
| Company | HealthCore |
| Location | Austin headquarters |
| Profile | Executive support experience, calendar and travel management, professional English, discretion in handling sensitive information |

## API and data

The mock API is centrally deployed and shared across all company contexts in the course. Fields, values, and structure are defined in the backend technical specification. No adaptation is required.

### `status` values

| API value | UI label |
| --- | --- |
| `received` | Received |
| `in_progress` | In progress |
| `selected` | Selected |
| `discarded` | Discarded |

### `stage` values

| API value | UI label |
| --- | --- |
| `pending` | Pending review |
| `review` | Under review |
| `personal_interview` | Personal interview |
| `technical_interview` | Technical interview |
| `offer_presented` | Offer presented |

Raw API values such as `in_progress` and `personal_interview` must never appear in the interface. Always display the UI labels from these tables.

## Implementation plan

See [plan.md](plan.md) for the ordered implementation steps and requirement checks.

## Run locally

Install Node.js and npm, then run these commands from this directory.

1. Install the dependencies:

   ```bash
   npm install
   ```

2. Configure the API. Copy `.env.example` to `.env.local` and set the backend's base URL:

   ```bash
   NEXT_PUBLIC_API_URL=https://<your-api-host>/api/v1
   ```

   Every request goes to this URL plus the endpoint path (for example `${NEXT_PUBLIC_API_URL}/records`). If it is missing, the app shows "API URL not configured" instead of loading candidates. `.env.local` is ignored by Git, so the real URL is never committed.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Restart `npm run dev` after changing `.env.local`: it is only read at startup. `NEXT_PUBLIC_` variables are built into the browser code, so don't put secrets in them.

### API endpoints used

| Method | Endpoint | Used for |
| --- | --- | --- |
| GET | `/records` | Candidate list (`page`, `limit`, `status`, `stage`, `search`) |
| GET | `/records/:id` | Candidate details |
| POST | `/records` | Create a candidate |
| PUT | `/records/:id` | Correct general information |
| PATCH | `/records/:id` | Change status and/or stage |
| GET | `/records/:id/notes` | List notes |
| POST | `/records/:id/notes` | Add a note |
| DELETE | `/records/:id/notes/:note_id` | Delete a note |

Every response body is checked at runtime against its TypeScript type, so a malformed response shows an error instead of breaking the page.

### Test on your phone

The dev server is reachable from other devices on your network, so you can open it on a real phone while you develop.

1. Connect the phone to the same Wi-Fi as your computer.
2. Find your computer's local IP address: run `ipconfig` on Windows (the Wi-Fi adapter's IPv4 address) or `ipconfig getifaddr en0` on macOS. It usually looks like `192.168.x.x`.
3. Add it to `.env.local` (see `.env.example`):

   ```bash
   DEV_ORIGIN=192.168.x.x
   ```

   Next.js blocks dev-only files for any address other than `localhost`. Without this setting, the page opens on the phone but React never loads, so the candidate list stays on its loading state.
4. Restart `npm run dev` (`.env.local` and `next.config.ts` are read only at startup).
5. On the phone, open `http://<your-ip>:3000`. `npm run dev` also prints this address as "Network".

If the page does not load, allow Node.js through your firewall for private networks. If your router gives your computer a new IP, update `DEV_ORIGIN`.

Hydration warnings in the terminal that mention attributes such as `__gcruniqueid` come from the phone browser's autofill or extensions, not from the app. A private tab does not show them.

To use DevTools on an Android phone (for example Network → Offline), connect it by USB with USB debugging on, then open `chrome://inspect` in Chrome on your computer.

## Commands

- `npm run dev` - Start the development server.
- `npm run build` - Build for production.
- `npm start` - Run the production build (after building).
- `npm run lint` - Check code with ESLint.
- `npx tsc --noEmit` - Type-check without building.

## Project structure

- `app/` - Routes: `page.tsx` (candidate list and drawer), `candidates/[id]/page.tsx` (full page for a candidate, and the create form at `/candidates/new`), `layout.tsx` (shared providers and metadata).
- `components/candidate-list/` - List header with Add candidate, filters, table, mobile cards, pagination.
- `components/candidate-detail/` - Drawer, full page, header, tabs, overview cards, notes.
- `components/candidate-form/` - The candidate form shared by edit and create, and the create form.
- `components/shared/` - App header, badges, and the empty, error, and success states.
- `hooks/` - Data hooks that own every API call (`useCandidateTable`, `useCandidateFeed`, `useCandidateDetail`, `useCandidateNotes`, `useCreateCandidate`).
- `context/` - `candidate-drafts` (unsaved work across views) and `candidate-updates` (tells the list to refetch after a save).
- `lib/api/` - One typed function per endpoint, the shared fetch helper, and runtime response validators.
- `lib/utils/` - Formatting, form conversion and validation, URL helpers.
- `types/` - Candidate and note types matching the API.
- `public/ui-ux/` - Design screenshots used as visual references.

## Known limitations

- **No authentication.** Anyone with the URL can view and change candidates; the course API has none.
- **Shared mock API.** The backend is shared by every company context in the course, so other students' changes (and test candidates) appear in the list.
- **No candidate deletion or note editing.** The app can create and edit candidates and add and delete notes, but not delete a candidate or edit a note.
- **Notes have no author.** The API stores only the text and date, so cards show those.
- **New candidates may not be on the current page.** After a create, the list refetches; where the new row lands depends on the API's sort order and the active filters (new candidates are always Received / Pending review).
- **Unsaved work lives in memory.** Drafts survive switching between drawer and full page, but not a page reload or closing the tab.
- **Client-side rules stricter than the API.** Phone numbers must have 7–15 digits and Years of Experience must be 0–60; the API itself accepts any value.
- **Both list views load on first visit.** The table and the mobile cards are both rendered (one hidden by CSS), so the first page of candidates is requested twice. See "Future enhancements" in [plan.md](plan.md).
- **Not built yet:** the pipeline summary (stat cards and stage bar) in `components/future/`.
