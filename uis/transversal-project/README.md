# transversal-project

This project uses TypeScript to automate HealthCore's billing denial tracking, no-show cost estimation, and continuing medical education (CME) compliance monitoring.

The main focus is implementing the TypeScript utility functions correctly. `src/index.html` and `src/test.ts` are simple browser testing helpers for checking those functions, rather than the main project deliverable. Keep these helpers minimal as the core functionality develops.

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
    ├── test.ts                 # Connects the page to utilities
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

The page loads `test.ts` with `<script type="module" src="./test.ts"></script>`. Vite transforms TypeScript into JavaScript for the browser, so opening `index.html` directly or compiling `test.ts` manually is unnecessary.

**Test claim filtering in the browser**

1. Under **Collection Operations → filterClaims**, choose a city, status, payer, service type, or any combination.
2. Leave a dropdown set to **All** to omit that filter. Leaving all four unchanged returns all sample claims.
3. Click **Filter Claims**. Matching claims must satisfy every selected filter. The count and records appear in **Test Output** beneath the subsection; an empty result shows a no-matches message.
4. Click **Reset Filters** to set every dropdown back to **All** and clear the results. **Clear** only clears the output.

City options use the corresponding location IDs when filtering. For example, **Austin + denied** returns `CLM-000004`.

The output panel moves beneath the section you interact with and clears the previous section's result. The remaining collection buttons are grouped under **Other Collection Operations**. Buttons for unfinished functions display a message that the test is not connected yet.

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
- `filterClaims` is implemented and connected to the browser controls. Its empty-string filter handling still needs review: it currently treats an empty string as an omitted filter.
- Appointment filtering, sorting, grouping, searches, calculations, and validations remain to be implemented.
- Testing currently uses the browser page. `npm test` is still a placeholder and exits with an error; no automated test suite is configured.
