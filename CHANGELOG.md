# Netra Graphics — Job List / Changelog

A running record of all completed fixes, improvements, and features.

---

## Session 3 — 2026-06-26 (Client Portal Polish & Notification Fixes)

### ✅ JOB-011 — Remove WhatsNew Bulb from Client Portal
- **File**: `src/pages/client-vault/layout.jsx`
- Removed the `WhatsNewBulb` import and its JSX from the client portal mobile header.
- The bulb (💡 Idea Spark) now only appears for **admin users**.

### ✅ JOB-012 — Fix Micro-Job Invoice Real-Time Notifications in Client Portal
- **File**: `src/pages/client-vault/layout.jsx`
- **Root bug**: `invoicesChannel` only matched `client_id` — CMS invoices use `client_link`, so subscription never fired.
- **Fix**: Condition now checks both `client_id` OR `client_link`.
- Added new 🔧 orange notification type `micro_job_invoice` (distinct from 🧾 rose `final_invoice`).
- Clicking notification navigates to Invoice Detail page.

### ✅ JOB-013 — Micro-Job Invoice Activity in Client Dashboard (Option A)
- **File**: `src/supabase/database/clientVault.js`
- `fetchClientDashboardSummary` synthesizes CMS invoice activity from `invoices` table via `client_link`.
- Merged with project activity logs, sorted by date, trimmed to 10 items. No schema change needed.

### ✅ JOB-014 — Grey Out Progress & Milestones for 'General Support & Chat' Projects
- **Files**: `src/pages/client-vault/project-detail.jsx`, `dashboard.jsx`, `projects.jsx`
- Project Detail: Progress card + Milestones card replaced with dimmed disabled messages.
- Dashboard + Projects grid: Progress bar replaced with 'Chat only — no project tracking' badge.
- Normal projects: completely unaffected.

---

## Session 2 — 2026-06-25 (Invoice Logic & Client Portal Invoices)

### ✅ JOB-007 — Saved Invoice Grand Total Column Fix
### ✅ JOB-008 — Micro-Job Invoice Totals & Discount Alignment
### ✅ JOB-009 — Disable Edit for Micro-Job Invoices (Vault + Preview)
### ✅ JOB-010 — Client Portal Micro-Job Invoice Visibility (Pending + Settled)

---

## Session 1 — 2026-06-24 (Core Bug Fixes)

### ✅ JOB-001 — Cashbook Search Crash Fix (Financials)
### ✅ JOB-002 — Custom Invoice Date & Number Parsing
### ✅ JOB-003 — Disable Edit on Paid Custom Invoice Preview
### ✅ JOB-004 — Inquiry Ignition Safeguard
### ✅ JOB-005 — Client Portal Responsiveness (Mobile Header + Scrollable Sheets)
### ✅ JOB-006 — Case-Insensitive Invoice Number Matching

---

## Verification Checklist (Session 3 — Before Git Push)

| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Client portal header | No 💡 lightbulb icon visible |
| 2 | Admin panel sidebar/topbar | 💡 lightbulb still present |
| 3 | Create micro-job invoice from admin | Client portal shows 🔧 orange toast |
| 4 | Client portal dashboard Recent Activity | CMS invoice entry appears |
| 5 | General Support project → Project Detail | Progress + Milestones greyed out |
| 6 | Normal project → Project Detail | Progress + milestones render normally |
| 7 | Dashboard Active Projects | General Support shows 'Chat only' badge |
| 8 | Projects page grid | General Support card shows 'Chat only' badge |
