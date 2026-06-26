# 🎓 NMCT EduTrack — Student Tracking Portal

> **Native Medicare Charitable Trust** — A secure, role-based field officer portal for tracking the full educational lifecycle of tribal and non-tribal students in the Nilgiris District, with government welfare scheme (DBT) management, attendance monitoring, and dropout risk analytics.

---

## 📋 Table of Contents

1. [About the Project](#about-the-project)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [All Pages — Detailed Breakdown](#all-pages--detailed-breakdown)
5. [Icons and Why They Are Used](#icons-and-why-they-are-used)
6. [UI Components](#ui-components)
7. [Database Models](#database-models)
8. [Authentication System](#authentication-system)
9. [Environment Variables](#environment-variables)
10. [Running the Project](#running-the-project)

---

## About the Project

NMCT EduTrack is an internal web application used by **field officers** and **administrators** of the Native Medicare Charitable Trust to:

- Register and track tribal and non-tribal students
- Log school and tuition attendance with risk flags
- Manage Direct Benefit Transfer (DBT) scholarship applications
- Monitor dropout risk scores for vulnerable students
- Audit field officer activity and manage officer invitations
- Export attendance reports as PDF files

The system is **online** — it uses a **Supabase (PostgreSQL)** cloud database, so data is accessible from any device with internet access.

---

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 15 (App Router) | Full-stack React framework — pages, routing, server actions |
| **React** | 18 | UI component rendering |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Tailwind CSS** | 3.4 | Utility-first styling — all layouts and colours |
| **Prisma ORM** | 7 | Database queries and schema management |
| **PostgreSQL (Supabase)** | — | Cloud database (Project: idcavdzswyhrbzadyxcw) |
| **Clerk (currently mocked)** | 7 | Authentication system — sign in, roles, session |
| **jsPDF + jspdf-autotable** | — | Client-side PDF export for attendance reports |
| **Lucide React** | — | SVG icon library |
| **Google Fonts** | — | Inter (body), Fraunces (headings), JetBrains Mono (code) |

---

## Project Structure

```
NMCT/
├── prisma/
│   └── supabase.prisma         ← Database schema (all 13 models)
├── prisma.config.ts            ← Points Prisma CLI to supabase.prisma
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← Root HTML shell + ClerkProvider wrapper
│   │   ├── globals.css         ← Global Tailwind styles
│   │   ├── page.tsx            ← Public landing page (/)
│   │   ├── actions.ts          ← All server-side data mutations (Server Actions)
│   │   ├── dashboard/          ← /dashboard  - main portal home
│   │   ├── students/
│   │   │   ├── tribal/         ← /students/tribal
│   │   │   ├── non-tribal/     ← /students/non-tribal
│   │   │   └── [id]/           ← /students/:id  - individual profile
│   │   ├── attendance/
│   │   │   ├── page.tsx        ← /attendance
│   │   │   ├── AttendanceDashboard.tsx  ← Card + Bulk views + PDF export
│   │   │   ├── LogAttendanceForm.tsx
│   │   │   └── tuition/        ← /attendance/tuition
│   │   ├── dbt/                ← /dbt - scholarship management
│   │   ├── admin/              ← /admin - officer and audit management
│   │   ├── sign-in/[[...sign-in]]/   ← /sign-in
│   │   └── sign-up/[[...sign-up]]/   ← /sign-up
│   ├── components/
│   │   ├── Sidebar.tsx         ← Left navigation bar
│   │   ├── Topbar.tsx          ← Top header bar
│   │   ├── AddStudentButton.tsx ← Modal trigger for adding/importing students
│   │   ├── ImportStudentsModal.tsx ← CSV bulk import modal
│   │   ├── StudentsRegistry.tsx ← Paginated student list table
│   │   └── InviteOfficerForm.tsx ← Admin officer invitation form
│   ├── lib/
│   │   ├── db.ts               ← Prisma client (PostgreSQL adapter)
│   │   ├── clerkMockClient.tsx ← Mock Clerk frontend components
│   │   ├── clerkMockServer.ts  ← Mock Clerk server-side auth functions
│   │   └── utils.ts            ← cn() utility function
│   └── middleware.ts           ← Auth route protection
├── next.config.mjs             ← Webpack aliases (mock Clerk toggle)
├── .env                        ← Environment secrets
└── package.json
```

---

## All Pages — Detailed Breakdown

### Landing Page — /
**File:** src/app/page.tsx

The public-facing homepage seen before logging in.

- Sticky navigation bar with Sign In and Sign Up buttons
- Hero section with portal tagline and Get Started call-to-action
- Feature highlights (cloud sync, role-based access, live data)
- A "How It Works" section explaining the 3-step officer workflow
- Footer with contact details and trust branding

---

### Dashboard — /dashboard
**File:** src/app/dashboard/page.tsx

The main portal home after logging in. Shows a live overview of the officer's students and welfare metrics.

**Contents:**
- Welcome header with the officer's name
- My Students Registry table — Name, Tribe, School, Class, Village, Status
- 4 Stat Cards: Total Students / Active Enrolled / At Dropout Risk / DBT Disbursed
- Students by Education Level — bar chart (Primary / Middle / Secondary / Higher)
- Dropout Risk Distribution — legend (Low 85% / Medium 10% / High 5%)
- Add Student button

**Server Logic:**
- Fetches the logged-in user by email
- On first login via invitation, upgrades placeholder inv_ clerkUserId to the real Clerk ID
- If the user has no DB record, auto-creates them as FIELD_OFFICER

---

### Tribal Students — /students/tribal
**File:** src/app/students/tribal/page.tsx

All tribal students (isTribal = true) assigned to the officer.

- Searchable, sortable data table
- Import from Excel/CSV button (bulk register via CSV)
- Add Student button (single student form)
- Click any row to go to the student's profile

---

### Non-Tribal Students — /students/non-tribal
**File:** src/app/students/non-tribal/page.tsx

Same layout as Tribal Students but filters for isTribal = false.

---

### Student Profile — /students/[id]
**File:** src/app/students/[id]/page.tsx

Full individual lifecycle profile for a single student.

Sections:
- Profile Header — avatar, name, status badge, tribe, school, class, village, district
- Guardian Info — guardian name and phone
- Aadhaar Last 4 — masked identity number
- Attendance History — month-by-month with percentage
- Marks Records — academic term/subject/score
- DBT Records — scholarship status cards
- Documents — uploaded file references
- Achievements — awards and event recognitions
- Migration History — records of district changes
- Risk Score — dropout risk level with factors

---

### Attendance — /attendance
**File:** src/app/attendance/page.tsx + AttendanceDashboard.tsx

Manages school attendance records for the officer's assigned students.

**Two view modes:**

1. Card Grid View — one card per student showing:
   - Average attendance % badge (green >= 75%, amber >= 50%, red < 50%)
   - Recent records (Month, Year, Days Present/Total, %)
   - Log Attendance button opens a modal

2. Bulk School Sheet — spreadsheet-style:
   - Select Month, Year, Total School Days
   - Enter Days Present per student inline
   - Live % preview with GOOD or AT RISK indicator
   - Save All in one click

**Export PDF Button (red button, top-right):**
- A4 Landscape PDF with navy header
- Summary table — all students with Avg %, total days, status
- Per-student detail tables — every month/year record
- Colour-coded Remarks (Good / At Risk / Critical)
- Page numbers in footer
- Saved as: NMCT_Attendance_Report_YYYY-MM.pdf

---

### Tuition Attendance — /attendance/tuition
**File:** src/app/attendance/tuition/page.tsx

Tracks daily tuition (after-school coaching) attendance for students with goesToTuition = true.

- Date picker
- Present / Absent toggle per student
- Enforces unique record per student per date

---

### DBT Scholarships — /dbt
**File:** src/app/dbt/page.tsx

Manages the full lifecycle of Direct Benefit Transfer scholarship applications.

Stat Cards: Total Disbursed / Pending Verification / Eligible Count

DBT Pipeline statuses:
1. ELIGIBLE — student qualifies
2. DOCUMENTS_PENDING — waiting for docs
3. VERIFIED — documents confirmed
4. DISBURSED — money transferred
5. CONFIRMED — officer confirmed receipt
6. REJECTED — application declined

---

### Officers and Audit — /admin
**File:** src/app/admin/page.tsx

Admin-only page (FIELD_OFFICER role is redirected to /dashboard).

- List of all active Field Officers
- Invite Officer button — sends invitation and creates DB record
- Recent Activity Log — every system action with timestamp and metadata
- Officer deactivation controls

---

### Sign In — /sign-in
**File:** src/app/sign-in/[[...sign-in]]/page.tsx

Login page using Clerk SignIn component (currently mocked).

Mock behaviour: email containing "admin" = ADMIN role, everything else = FIELD_OFFICER.
Sets cookies: mock-session-email, mock-session-role, mock-session-name.
Redirects to /dashboard.

---

### Sign Up — /sign-up
**File:** src/app/sign-up/[[...sign-up]]/page.tsx

Registration page using Clerk SignUp component (currently mocked). Always registers as FIELD_OFFICER.

---

## Icons and Why They Are Used

| Icon | Location | Reason |
|---|---|---|
| 🎓 | Sidebar logo, empty state | Represents education — the core mission of NMCT |
| 📊 | Sidebar Dashboard link | Bar chart = data overview and statistics |
| 👥 | Sidebar Students link, stat card | Two people = group of students |
| 🏹 | Sidebar Tribal Students | Bow/arrow — traditional tribal cultural symbol |
| 🌍 | Sidebar Non-Tribal Students | Globe — represents the wider general community |
| 📅 | Sidebar Attendance | Calendar = daily attendance tracking |
| 📖 | Sidebar Tuition Attendance | Open book = study / tuition sessions |
| 🏦 | Sidebar DBT Scholarships, stat card | Bank building = financial disbursement |
| 🛡️ | Sidebar Officers and Audit | Shield = admin / authority / security |
| ☰ | Topbar (mobile only) | Hamburger = universal mobile nav toggle |
| 🔍 | Topbar search bar | Magnifying glass = search functionality |
| 🔔 | Topbar notification bell | Bell = system alerts and notifications |
| 🔴 | Notification — Critical | Red dot = critical danger alert |
| 🟡 | Notification — Warning | Yellow dot = moderate warning |
| 🟢 | Notification — Success | Green dot = positive/successful event |
| 📈 | Active Enrolled stat card | Upward trend = growing active enrollment |
| ⚠️ | Dropout Risk stat card | Warning triangle = students needing urgent attention |
| 📇 | Attendance Card Grid toggle | Index card = card layout view |
| 📝 | Attendance Bulk Sheet toggle | Notepad = bulk data entry / spreadsheet |
| 📁 | Import Students modal | Folder = file upload / selection |
| ✅ | Success messages | Green tick = operation completed successfully |
| ✕ | Modal close buttons | X = universal close / dismiss |
| 🚪 | User menu Sign Out | Door = exit / leave session |
| 🔑 | User button when not logged in | Key = authentication / access |
| ↓ (SVG download arrow) | Export PDF button | Download = save file to device |

---

## UI Components

### Sidebar.tsx
Fixed 260px left navigation panel. On mobile it is hidden off-screen and slides in when the hamburger is clicked (CSS peer-checked pattern — no JavaScript needed for the toggle).

Contains: NMCT logo, navigation links, officer name/district avatar, Sign In/Sign Up/UserButton in footer.

### Topbar.tsx
Sticky 64px top header on every portal page. Contains:
- Hamburger button (mobile) to toggle the Sidebar
- Global search input
- Notification bell — dropdown with system alerts (critical/warning/success)
- UserButton (Clerk) — profile circle with initial, opens Sign Out menu

### AddStudentButton.tsx
Opens the Add Student modal with a form for all required student fields.

### ImportStudentsModal.tsx
Full-screen modal for bulk CSV import:
- Click to select .csv files only
- Parses CSV in the browser (no server upload needed)
- Validates every row against required columns and data formats
- Colour-coded preview table (check mark = valid, warning = invalid)
- On confirm, inserts valid rows via the importStudents() server action

### StudentsRegistry.tsx
Reusable paginated student list table with live search, column sorting, status badge colouring, and click-to-profile navigation.

### InviteOfficerForm.tsx
Used on the Admin page to invite a new field officer. Accepts Name, Email, District. Creates a User record with a temporary inv_ placeholder Clerk ID that gets upgraded on the officer's first login.

---

## Database Models

All models are defined in prisma/supabase.prisma and synced to Supabase PostgreSQL.

| Model | Purpose |
|---|---|
| User | Field officers and admins. Linked to Clerk via clerkUserId. |
| Student | Core student record — personal details, school, tribe, status, assigned officer. |
| AttendanceRecord | Monthly school attendance (days present / total / percentage). |
| TuitionAttendance | Daily tuition attendance (PRESENT/ABSENT). Unique per student+date. |
| MarksRecord | Academic marks by term, subject, academic year. |
| DBTRecord | Scholarship application lifecycle from ELIGIBLE to CONFIRMED. |
| MigrationRecord | Tracks student district changes. |
| Document | Uploaded file references (Aadhaar, bank passbook, caste certificate, etc.). |
| DropoutRiskScore | Risk level (LOW/MEDIUM/HIGH/CRITICAL) with factor JSON. |
| ActivityLog | Audit trail of every user action. |
| Notification | Messages sent via SMS / WhatsApp / Email / In-App. |
| Achievement | Student awards and event recognitions. |
| TuitionAttendance | Daily tuition session attendance tracking. |

---

## Authentication System

### Current Mode: Mock Authentication (Offline-Friendly)

Controlled by a single flag in next.config.mjs:

```js
const isClerkPlaceholder = true; // true = mock, false = real Clerk
```

When true, Webpack replaces all @clerk/nextjs imports with local mock files.

Mock login sets three browser cookies:
- mock-session-email
- mock-session-role
- mock-session-name

Email containing "admin" → ADMIN role. Everything else → FIELD_OFFICER.

### Switching to Real Clerk

1. Go to dashboard.clerk.com and create an application
2. Copy your API keys
3. Add to .env:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   ```
4. In next.config.mjs set: const isClerkPlaceholder = false
5. Delete .next folder and restart: npm run dev

---

## Environment Variables

All secrets are stored in the .env file at the project root. Never commit this file to Git.

```
DATABASE_URL="postgresql://postgres.idcavdzswyhrbzadyxcw:..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
PRISMA_SCHEMA_PATH=./prisma/supabase.prisma
```

---

## Running the Project

### Prerequisites
- Node.js 20.9.0 or higher
- npm 9+

### Install Dependencies
```
npm install
```

### Run in Development Mode
```
npm run dev
```
Open http://localhost:3000 in your browser.

### Database Commands
```
npx prisma db push          # Push schema changes to Supabase
npx prisma studio           # Open visual database browser
npx prisma generate         # Regenerate Prisma Client after schema changes
```

### Build for Production
```
npm run build
npm start
```

---

## Role-Based Access Control

| Page | FIELD_OFFICER | ADMIN |
|---|---|---|
| /dashboard | Own students only | All data |
| /students/tribal | Own students | All students |
| /students/non-tribal | Own students | All students |
| /attendance | Own students | All students |
| /attendance/tuition | Own students | All students |
| /dbt | Own records | All records |
| /admin | Blocked — redirected | Full access |

Route protection is enforced in src/middleware.ts.

---

## Export Features

| Page | Format | What is Exported |
|---|---|---|
| Attendance (/attendance) | PDF | Full report — summary table + per-student monthly breakdown |
| Students Import | CSV (upload) | Accepts .csv files for bulk student registration |

---

*Built with love for the Native Medicare Charitable Trust, Nilgiris District, Tamil Nadu.*
