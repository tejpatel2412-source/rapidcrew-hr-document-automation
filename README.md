# Rapidcrew HR Document Automation

Local-first HR document generation for Vercel with one shared server-side access password. There are no user accounts, registration, email login, profiles, roles, or shared HR database. After the access password is accepted, company data, employees, templates, document history, signatures, and stamps remain stored in that browser with IndexedDB (Dexie).

## Current access model

The HR application is protected by a single password stored only in the server environment variable:

```text
RAPIDCREW_ACCESS_PASSWORD
```

The password is submitted to `/api/access` over HTTPS. The server compares it with the environment variable and sets an HttpOnly access cookie containing a derived token, not the raw password. Protected application routes redirect to `/access` until that cookie is valid. The **LOCK** button clears the cookie and returns to the access screen.

The password is **not** stored in localStorage, IndexedDB, a `NEXT_PUBLIC_*` variable, or a client React component.

## Salary Slip format

Salary Slip uses the compact traditional payroll format requested for Rapidcrew:

- Company logo area on the left.
- Centered company name.
- Dynamic `Pay Slip for the Month <Month> <Year>` title.
- Four-column employee information table.
- Combined Earnings / Amount INR / Deductions / Amount INR table.
- Gross Earnings and Total Deductions.
- Net Pay Amount and amount in words.
- Exact system-generated footer: `This is a System Generated Pay Slip and does not require any Signature`.
- Salary Slip does not require the company signature or stamp.
- Offer, Appointment, Experience, and Relieving letters keep their existing signature/stamp flow.
- Preview, selectable-text PDF, editable DOCX, and print use the same salary-slip data model.

## Other features retained

- RAPIDCREW dark-red branding and responsive dashboard/sidebar.
- Company setup with logo, signature, final company stamp, legal/contact fields, default currency/date/font.
- Browser-local employee directory with auto-fill and JSON/CSV export.
- Offer Letter, Appointment Letter, Experience Letter, and Relieving Letter generators unchanged.
- Live A4 preview with professional alignment and print-only official document output.
- Reusable placeholder templates and TipTap rich-text controls.
- Decimal-safe salary math using integer minor units, net pay, and INR amount-in-words.
- Selectable-text PDF export with `@react-pdf/renderer`.
- Real editable `.docx` export with the `docx` library.
- Browser-local document history and backup/import tools.

## Local development

Requirements: Node.js 20.19+ or Node.js 22.12+ recommended, npm 10+.

1. Copy the environment example:

```powershell
Copy-Item .env.example .env.local
```

2. Open `.env.local` and set:

```text
RAPIDCREW_ACCESS_PASSWORD=Buzzinga@0
```

3. Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The browser should first open `/access`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

For browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

The Playwright web server receives a test password through its server-process environment. Production still requires the Vercel environment variable.

## Vercel deployment

1. Push this project folder to GitHub.
2. In Vercel choose **Add New → Project** and import the repository.
3. Framework preset should resolve to **Next.js** automatically.
4. Open **Project → Settings → Environment Variables**.
5. Add:

```text
Name: RAPIDCREW_ACCESS_PASSWORD
Value: Buzzinga@0
```

6. Enable the variable for Production and Preview as needed.
7. Build command: `npm run build`.
8. Use the normal Next.js output settings; do not configure a static export.
9. Deploy.
10. Opening the deployment URL should redirect to `/access`. Enter the configured password to open the HR dashboard.

If you change the password in Vercel, redeploy so middleware and server routes use the updated environment configuration. Existing access cookies derived from the old password will no longer pass validation.

## Privacy model

The access password protects entry to the application, but it does not move HR records to a server. HR data remains in IndexedDB scoped to the site origin and browser profile. Different browsers/devices do not share that IndexedDB data. Clearing browser/site storage removes it, so use **Settings → Export All Data** before clearing storage or changing devices.

No PostgreSQL, Supabase, Firebase, shared Prisma database, filesystem session store, or SQLite server database is used.

## Image security

Logo, signature, and stamp uploads accept PNG, JPEG, and WEBP only, with a 2 MB per-file limit. SVG upload remains disabled by default.

## Project structure

- `app/access/` – shared-password access screen.
- `app/api/access/` – server-side password validation and HttpOnly cookie creation.
- `app/api/lock/` – access-cookie clearing endpoint.
- `middleware.ts` – protects application routes and redirects unauthenticated visitors.
- `components/DocumentPreview.tsx` – browser/print preview, including the salary-slip table layout.
- `lib/salary-slip.ts` – shared salary-slip view model used by preview/PDF/DOCX.
- `lib/access.ts` – derived access-cookie token helpers.
- `lib/exporters.tsx` – selectable-text PDF and real DOCX generation.
- `lib/db.ts` – versioned Dexie/IndexedDB schema.
- `lib/validation.ts` – pre-export checks; signature/stamp remain mandatory for non-salary documents.
- `tests/` – salary, access, validation, and Playwright tests.
