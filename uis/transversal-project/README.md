# transversal-project

This project uses TypeScript to automate HealthCore's billing denial tracking, no-show cost estimation, and continuing medical education (CME) compliance monitoring.

The main focus is implementing the TypeScript utility functions correctly. `src/index.html` and the files in `src/test/` are simple browser testing helpers for checking those functions, rather than the main project deliverable. Keep these helpers minimal as the core functionality develops.

See [CONTEXT-healthcore.en.md](CONTEXT-healthcore.en.md) for the requirements and business rules.

Progress is tracked in [plan.md](plan.md).

**Project structure**

```text
transversal-project/
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── CONTEXT-healthcore.en.md
├── plan.md                    # Implementation checklist
└── src/
    ├── index.html              # Browser testing page
    ├── test/                  # Browser testing helpers
    │   ├── test.ts            # Initializes the feature helpers
    │   ├── claims.ts          # Claim filtering, sorting, and reset controls
    │   ├── appointments.ts    # Appointment filtering, date sorting, and reset controls
    │   ├── output.ts          # Shared output panel and Clear behavior
    │   └── partialHtmls.ts    # Loads HTML sections before connecting controls
    ├── partialHtmls/           # Separate HTML sections
    │   ├── collections.html
    │   ├── search.html
    │   ├── transformations.html
    │   ├── validations.html
    │   └── output.html
    ├── data/
    │   └── sampleData.ts       # Provided locations, claims, appointments, and clinicians
    ├── types/
    │   └── models.ts           # Data types and interfaces
    └── utils/
        ├── collections.ts     # Filtering, sorting, and grouping
        ├── search.ts          # Record lookup
        ├── transformations.ts # Denial, no-show, and CME calculations
        └── validations.ts     # Data validation
```

**Run locally**

Install Node.js 22.12+ and npm, then run from the project folder:

```bash
cd transversal-project
npm install
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:5173/`). Keep the terminal running while editing; Vite updates the page when you save changes.

If PowerShell blocks `npm`, use `npm.cmd` instead (for example, `npm.cmd run dev`).

The page loads `src/test/test.ts` with `<script type="module" src="./test/test.ts"></script>`. Vite transforms TypeScript into JavaScript for the browser, so opening `index.html` directly or compiling `test.ts` manually is unnecessary.

**How the HTML sections load**

As `index.html` grew, its operation sections and output panel were split into smaller HTML files in `src/partialHtmls/`. Edit those files to change individual sections; `index.html` keeps the main page layout.

The TypeScript helpers live in `src/test/`; the HTML fragments remain in `src/partialHtmls/`.

The loading dependency is `index.html` → `test/test.ts` → `test/partialHtmls.ts`:

1. `index.html` loads `test.ts` as a module.
2. `test.ts` uses `import "./partialHtmls";` to run `partialHtmls.ts` before its own setup code.
3. `partialHtmls.ts` imports the HTML files as text and inserts them into `<main>`.
4. `test.ts` initializes the shared output handling and the claim and appointment helpers, which connect the controls to the utility functions.

This order ensures the HTML controls exist before the test code tries to use them. The import needs no function call or named export: it runs the code in `partialHtmls.ts` directly.

**Test claim filtering in the browser**

1. Under **Collection Operations → Filter Claims**, choose a city, status, payer, service type, or any combination.
2. Leave a dropdown set to **All** to omit that filter. Leaving all four unchanged returns all sample claims.
3. Click **Filter Claims**. Matching claims must satisfy every selected filter. The count and records appear in **Test Output** beneath the subsection; an empty result shows a no-matches message.
4. Click **Reset Filters** to set the claim filter dropdowns back to **All** and clear the results. **Clear** empties the output and resets all claim filters, the appointment status dropdown, and both sets of sort arrow selections.

City options use the corresponding location IDs when filtering. For example, **Austin + denied** returns `CLM-000004`.

**Test appointment filtering and sorting in the browser**

- Under **Filter Appointments By Status**, select a status to display matching sample appointments immediately. The browser control selects one status at a time; `filterAppointmentsByStatus` accepts an array and matches any supplied status.
- Under **Sort Claims By ID**, click **↑** for ascending or **↓** for descending order. Sorted sample claims appear immediately, and the selected arrow is highlighted. `sortClaimsById` compares IDs with `localeCompare()` and sorts a copy, leaving the original array unchanged.
- Under **Sort Appointments By Date**, click **↑** for earliest first or **↓** for latest first. Sorted sample appointments appear immediately, and the selected arrow is highlighted. `sortAppointmentsByDate` compares `scheduledDate` timestamps and sorts a copy, leaving the original array unchanged.
- All three sections appear in one row on wider screens and stack on smaller screens. Their results appear below the entire group.

The output panel moves beneath the section or section group you interact with and clears the previous section's result. The remaining collection buttons are grouped under **Other Collection Operations**. Buttons for unfinished functions display a message that the test is not connected yet.

**Type checking**

The root `tsconfig.json` is configured for Vite and browser APIs, with strict type checking and `noEmit` enabled. Run this after meaningful changes and before committing:

```bash
npm run typecheck
```

For automatic checking whenever you save, run this in a second terminal:

```bash
npm run typecheck -- --watch
```

Errors appear in that terminal. Keep `npm run dev` running for browser updates; Vite does not check types. Press **Ctrl+C** to stop either command.

**Git**

The `.gitignore` excludes dependencies, build output, local environment files, and logs. Commit `package-lock.json` so dependency versions stay consistent.

**Current status**

- Models and sample data are defined and exported, including `CMEReport` and `CMEStatus`. The extra `Clinic` interface is retained.
- `filterClaims` is implemented and connected to the browser controls. It matches all provided criteria and ignores omitted filters, while treating empty strings as supplied values.
- `filterAppointmentsByStatus` is implemented and connected to immediate status selection in the browser.
- `sortClaimsById` is implemented and connected to ascending/descending arrow controls. Checks passed for both directions, preserving the original array, returning a new array, empty input, and duplicate IDs.
- `sortAppointmentsByDate` is implemented and connected to earliest/latest arrow controls. Checks passed for both directions, year boundaries, equal dates, preserving the original array, returning a new array, empty input, and single-item input.
- Grouping, searches, calculations, and validations remain to be implemented.
- Testing currently uses the browser page. `npm test` is still a placeholder and exits with an error; no automated test suite is configured.
