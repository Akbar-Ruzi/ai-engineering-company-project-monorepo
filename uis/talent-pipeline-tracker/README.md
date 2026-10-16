# Talent Pipeline Tracker

Frontend for HealthCore's recruitment pipeline, built with Next.js, React, TypeScript, and Tailwind CSS. Currently includes a basic landing page.

## Planned features

- Show all candidates in a list with name, position, status, and stage visible immediately.
- Filter by status and stage, and search by name or email without reloading the page.
- Open a candidate's full details and update their status or stage from there.
- Add internal notes after each call or interview, and remove them when they are no longer relevant.
- Register candidates who come through referrals and correct their information from the candidate details page.

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

Install Node.js and npm, then run these commands from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Main files

- `app/page.tsx` - Home page.
- `app/layout.tsx` - Shared layout and metadata.
- `app/globals.css` - Global styles.
