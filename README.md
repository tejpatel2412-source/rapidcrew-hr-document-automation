# Rapidcrew HR Document Automation

Local-first HR document generation for Vercel with one shared server-side access password. There are no user accounts, registration, email login, profiles, roles, or shared HR database. Company data, employees, templates, document history, signatures, and the official company stamp remain in the browser with IndexedDB (Dexie).

## Access password

The application keeps the existing single-password gate. Set the server-only environment variable:

```text
RAPIDCREW_ACCESS_PASSWORD
```

The password is submitted to `/api/access` over HTTPS. The server compares it with the environment variable and sets an HttpOnly access cookie containing a derived token, not the raw password. Protected application routes redirect to `/access` until the cookie is valid. The **LOCK** button clears the cookie.

The password is not stored in localStorage, IndexedDB, `NEXT_PUBLIC_*`, or a client React component.

## First-run company defaults

On a fresh browser database the app automatically creates an editable company profile with:

- Company Name: `RapidCrew Solutions Private Limited`
- Currency: `INR`
- Paper Size: `A4`
- Date Format: `DD/MM/YYYY`
- Font: `Arial`
- Stamp alignment: `Right`
- Stamp enabled by default

No fake GSTIN, CIN, PAN, address, phone, email, or other legal/company details are invented.

Existing browser data is preserved. IndexedDB schema version 2 migrates old company/template/history records in place and does not clear employees or document history. Existing company details remain unchanged; the Rapidcrew default company is created only when no company record exists.

## Shared company stamp

Upload the **Official Company Stamp** once in **Company Setup**. The same browser-local company asset is used by:

- Salary Slip
- Offer Letter
- Appointment Letter
- Experience Letter
- Relieving Letter

All Rapidcrew defaults include the company stamp. Each document has an **Include Company Stamp** checkbox, checked by default. Turning it off affects only that document. Company Setup also has a global Company Stamp Enabled control.

The authorization block is shared across browser preview/print and uses the same authorization view model in PDF/DOCX export. Signature and stamp images preserve aspect ratio, respect configured alignment/width as practical, and the closing block is kept together on page breaks where the output format supports it.

If a stamp has not been uploaded, the app shows a non-blocking **Company stamp not configured** warning with an **Upload Stamp** link. Documents still preview/export without crashing.

## Salary Slip

Salary Slip uses the compact traditional payroll format:

- Company logo area
- Centered `RapidCrew Solutions Private Limited` / configured company name
- Dynamic `Pay Slip for the Month <Month> <Year>`
- Four-column employee details table
- Earnings / Amount INR / Deductions / Amount INR table
- Gross Earnings and Total Deductions
- Net Pay Amount and amount in words
- Shared authorization/stamp area
- Small `This is a system-generated payslip.` note

The normal Salary Slip form shows only month/year, working days, days present, LOP days, default earnings, default deductions, and optional expandable additional components. Employee identity/payroll fields are auto-filled from the saved employee record, including bank account number when available.

Salary calculations continue to use integer minor units rather than floating-point money arithmetic.

## Simplified document creation

The Create Document screen now keeps common input minimal:

- **Salary Slip:** employee, month/year, working days, days present, LOP days, earnings, deductions.
- **Experience Letter:** employee, letter date, last working date, optional remarks.
- **Relieving Letter:** employee, relieving date, last working date, optional resignation date/reference number.
- **Offer Letter:** employee/candidate, offer date, optional valid-until date, probation. Candidate details are auto-filled from the selected saved record.
- **Appointment Letter:** employee, appointment date, probation, notice period. Employment details are auto-filled from the selected employee.

Template selection is handled automatically by the default template. Letter wording remains editable under an optional collapsed editor.

## Output formats

- **PDF:** generated with `@react-pdf/renderer`; text remains selectable and tables/borders are rendered as document elements rather than screenshots.
- **DOCX:** generated with `docx`; salary tables are real editable Word tables and company authorization images are embedded.
- **Print:** prints only the official A4 document; navigation/forms/buttons are hidden.

## Local development

Recommended: Node.js 20.19+ or Node.js 22.12+.

```powershell
Copy-Item .env.example .env.local
```

Set:

```text
RAPIDCREW_ACCESS_PASSWORD=Buzzinga@0
```

Then run:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run dev
```

Open `http://localhost:3000`. You should first be sent to `/access`.

For browser tests:

```bash
npx playwright install chromium
npm run test:e2e
```

## Vercel deployment

1. Push the project to GitHub.
2. Import the repository into Vercel as a Next.js project.
3. Go to **Project → Settings → Environment Variables**.
4. Add `RAPIDCREW_ACCESS_PASSWORD` with the production password.
5. Enable it for Production/Preview as required.
6. Deploy with the standard Next.js build command: `npm run build`.

Do not configure a static export. The password API routes and middleware require normal Next.js/Vercel runtime behavior.

## Privacy model

The access password protects entry to the app but does not move HR data to a server. Company data, employees, templates, history, logo, signature, and stamp remain in IndexedDB scoped to the browser/site origin. Different browsers/devices do not share that data.

Use **Settings → Export All Data** before clearing browser storage or changing devices.

## Image security

Logo, signature, and stamp uploads accept PNG, JPEG, and WEBP only, with the existing 2 MB limit. SVG remains disabled.

## Important project files

- `lib/db.ts` — versioned IndexedDB schema and safe v2 migration.
- `lib/defaults.ts` — official RapidCrew Solutions first-run company details and Rapidcrew templates.
- `lib/authorization.ts` — shared authorization/stamp view model.
- `components/DocumentAuthorizationBlock.tsx` — shared preview/print authorization block.
- `components/CreateDocument.tsx` — simplified document-specific input workflow.
- `components/CompanySetup.tsx` — simplified company/stamp/signature setup.
- `components/DocumentPreview.tsx` — A4 preview/print renderer.
- `lib/salary-slip.ts` — shared salary-slip table view model.
- `lib/exporters.tsx` — selectable-text PDF and editable DOCX generation.
- `tests/` — unit and Playwright regression tests for defaults, migration, stamp behavior, salary calculations, access, PDF/DOCX, and print.

## Official Rapidcrew Letterhead (September 2026 update)

The project now applies the owner-approved Rapidcrew letterhead automatically to all five document types: Salary Slip, Offer Letter, Appointment Letter, Experience Letter, and Relieving Letter.

The same letterhead is included in live preview/print, selectable-text PDF exports, and editable DOCX exports. It includes the Rapidcrew wordmark at the top-left, the large faded Rapidcrew R-arrow watermark, and the footer with `www.rapidcrewsolutions.com`, `RapidCrew Solutions Private Limited`, `+91 (972) 525-7676`, and the Zion Z One / Sindhu Bhavan office address.

IndexedDB schema version 3 safely upgrades the old first-run `Rapidcrew PVT LTD` defaults to the official company identity while preserving custom company records, employees, templates, history, signature, and stamp data.
