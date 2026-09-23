# transversal-project

This project uses TypeScript to automate HealthCore's billing denial tracking, no-show cost estimation, and continuing medical education (CME) compliance monitoring.

See [CONTEXT-healthcore.en.md](CONTEXT-healthcore.en.md) for the requirements and business rules.

**Project structure**

```text
transversal-project/
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
├── CONTEXT-healthcore.en.md
└── src/
    ├── index.html              # Browser testing page
    ├── test.ts                 # Connects the page to utilities
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

The page loads `test.ts` with `<script type="module" src="./test.ts"></script>`. Vite transforms TypeScript into JavaScript for the browser, so opening `index.html` directly or compiling `test.ts` manually is unnecessary.

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

**Current status:** The HTML testing page is scaffolded. The models and utility files are empty, and `test.ts` only contains imports. Implement the functions and connect the test buttons before using the page; type checking will report missing exports until then.
