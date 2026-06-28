# Netra Graphics — Job List / Changelog

A running record of all completed fixes, improvements, and features across all development sessions.

---

## Session 4 — 2026-06-28 (Magic Link / Token Auto-Login)

### ✅ JOB-015 — Secure Magic Link Auto-Login
- **Files**: `src/App.jsx`, `src/pages/clients.tsx`, `src/supabase/database/clients.js`
- Clients can now log in automatically using a secure, token-based link sent directly to them via WhatsApp.
- Replaced the standard login URL redirect in the WhatsApp text message with `https://netragraphics.com/autologin?token=[TOKEN]`.
- Implemented 30-day session preservation using persistent browser cookies so clients remain logged in on mobile devices.
- Created `supabase_add_magic_link_columns.sql` to add `magic_token` and `token_expiry` columns.

---

## Session 3 — 2026-06-26 (Client Portal Polish & Notification Fixes)

### ✅ JOB-011 — Remove WhatsNew Bulb from Client Portal
- **File**: `src/pages/client-vault/layout.jsx`
- Removed the `WhatsNewBulb` import and its JSX wrapper from the client portal mobile header.
- The 💡 Idea Spark bulb now appears for **admin users only**.
- Admin panel instance in `App.jsx` is completely unaffected.

### ✅ JOB-012 — Fix Micro-Job Invoice Real-Time Notifications (client_link Bug)
- **File**: `src/pages/client-vault/layout.jsx`
- **Root bug fixed**: `invoicesChannel` subscription only matched `client_id`.
  CMS / micro-job invoices store the link in `client_link` — so the subscription
  silently dropped every micro-job invoice event and no notification ever fired.
- **Fix**: Condition now checks **both** `client_id` OR `client_link` with an OR guard.
- Added new notification type `micro_job_invoice`:
  - 🔧 Orange colour (`#f97316`) — distinct from 🧾 rose `final_invoice` toasts.
  - Detected by `micro_job_ids` array content or `invoice_no` starting with `CMS`.
  - Clicking the toast navigates directly to the Invoice Detail page.
- Status-change detection updated to use `payment_status` field (consistent with CMS schema).

### ✅ JOB-013 — Micro-Job Invoice Activity in Client Dashboard Recent Activity
- **File**: `src/supabase/database/clientVault.js`
- `fetchClientDashboardSummary` now synthesizes recent activity entries for CMS
  invoices by querying the `invoices` table directly via `client_link` (Option A — no schema change).
- Each CMS invoice becomes an activity entry:
  `"Micro-Job Invoice #CMS0001 for ₹500 — Pending"`
- Merged with project activity log entries, sorted by date descending, trimmed to 10 items.

### ✅ JOB-014 — Grey Out Progress & Milestones for 'General Support & Chat' Projects
- **Files**: `src/pages/client-vault/project-detail.jsx`, `dashboard.jsx`, `projects.jsx`
- Detection: `(project.service || '').toLowerCase().includes('general support')`
- **Project Detail page** (`project-detail.jsx`):
  - Progress card replaced with dimmed message:
    *"Progress tracking is not applicable for General Support & Chat projects."*
  - Milestones card replaced with dimmed message:
    *"Milestone tracking is disabled for General Support & Chat projects."*
- **Dashboard Active Projects list** (`dashboard.jsx`):
  - Progress bar + % replaced with muted "Chat only — no project tracking" pill badge.
- **Projects grid page** (`projects.jsx`):
  - Same "Chat only" pill badge on every project card in the full Projects list view.
- Normal projects: completely unaffected in all three locations.

---

## Session 2 — 2026-06-25 (Invoice Logic, Micro-Job Invoices & Client Portal)

### ✅ JOB-007 — Saved Invoice Grand Total Column Fix
- **File**: `src/pages/invoices.tsx`
- Fixed the Grand Total column in the Saved Invoices table to display the real
  invoice grand total (`grandTotal` / `grand_total`) instead of the project quote amount.

### ✅ JOB-008 — Micro-Job Invoice Totals & Discount Alignment (Admin Preview)
- **File**: `src/pages/invoices.tsx` (around L2187–2211)
- Dynamically calculates overall `quote` (pre-discount subtotal) and `discount`
  (sum of item-level discounts) from `resolvedItems` instead of hardcoding `discount: 0`.
- Printed subtotal, discount, and grand total in the preview summary panel now
  match the individual item maths exactly.

### ✅ JOB-009 — Disable Edit for Cumulative Micro-Job Invoices (Vault Table + Preview Modal)
- **Files**: `src/pages/invoices.tsx`, `src/App.jsx`, `src/App.css`
- **Vault table**: `isEditDisabled` now always true for all CMS invoices (paid or pending).
  Tooltip: *"Cumulative micro-job invoices cannot be edited. Delete and recreate from ledger instead."*
- **Preview modal sidebar**: `isMicroJobInvoice` uses `/^CMS/i` regex for robust detection.
  `EDIT DETAILS` button disabled with same tooltip.
- **CSS**: Added `.invoice-actions-panel .action-btn:disabled` rule —
  `opacity: 0.35`, `pointer-events: none`, `cursor: not-allowed`, hover effects disabled.

### ✅ JOB-010 — Case-Insensitive Invoice Number Detection
- **File**: `src/pages/invoices.tsx`
- All `inv.invoiceNo.startsWith('CMS')` calls replaced with `/^CMS/i.test(inv.invoiceNo)`
  for robust detection regardless of letter casing across lists, settling, and deletion checks.

### ✅ JOB-010b — Bulletproof Micro-Job Reversion on Invoice Deletion
- **File**: `src/pages/invoices.tsx` (executeSingleDelete + executeBatchDelete)
- Both single and batch delete now ALWAYS revert linked micro-jobs to `Unbilled`
  status in the ledger when their parent invoice is deleted, regardless of deletion strategy.
  Prevents jobs from being orphaned or stuck in `Billed` state.

### ✅ JOB-010c — Smart Deletion Strategy UI for Micro-Job Invoices
- **File**: `src/pages/invoices.tsx`
- Keep / Purge cashbook radio buttons shown only when actual cashbook entries exist
  (`relatedEntries.length > 0`).
- Added info box for CMS invoices:
  *"Notice: Deleting this cumulative invoice will automatically return the associated
  micro-jobs back to the ledger as Unbilled."*

### ✅ JOB-010d — Client Portal Micro-Job Invoice Itemization & Visibility
- **File**: `src/supabase/database/clientVault.js`
- `fetchClientInvoiceDetail` now queries `micro_jobs_ledger` for each linked micro-job
  and maps them into itemized line items with correct descriptions, rates, quantities,
  and individual discounts.
- Subtotal and discount dynamically calculated from the mapped items.
- Status matching aligned across `fetchClientInvoices`, `fetchClientInvoiceDetail`,
  `fetchClientDashboardSummary`, `fetchClientProjectMedia`, `fetchClientProjectDetail`
  to accept both `'paid'` and `'settled'` (case-insensitive).
  Ensures CMS invoices appear in Invoices tab and are excluded from pending count once settled.
- **File**: `src/pages/client-vault/invoice-detail.jsx`
  - Item row discount % calculation uses the item's own discount field when available.

### ✅ JOB-010e — Custom Invoice Issue Date Alignment (Preview Modal)
- **File**: `src/App.jsx` (around L8603–8618)
- Preview modal now extracts the date from the invoice number (`DDMMYYYY` format)
  and shows that date as the Issue Date instead of falling back to today.
- Example: `NG/25062026/C0003` now correctly shows *25 Jun 2026* as the issue date.

### ✅ JOB-010f — Disable Edit for Paid Custom Invoices (Preview Modal Sidebar)
- **File**: `src/App.jsx` (around L8907–8921)
- Added `isPaidCustomInvoice` check.
- `isEditDisabled = isCompletedProj || isMicroJobInvoice || isPaidCustomInvoice`
- EDIT DETAILS button disabled with tooltip:
  *"Paid Custom invoices cannot be edited."*

---

## Session 1 — 2026-06-24 (Core Bug Fixes)

### ✅ JOB-001 — Cashbook Search Crash Fix (Financials)
- **File**: `src/pages/financials.tsx`
- Fixed the cashbook entry search box causing the entire page to go blank when typing.
- Root cause: unguarded filter on undefined field — now safely falls back to an empty string.

### ✅ JOB-002 — Client Portal Micro-Job Invoice Tab Inspection
- Inspected micro-job invoice tab thoroughly for logic mismatches and discrepancies.
- Findings fed into Session 2 fixes (JOB-008 through JOB-010f).

### ✅ JOB-003 — Client Portal Invoice Vault Grand Total Column Investigation
- Inspected saved invoice grand total column — confirmed displaying project quote instead of actual total.
- Fix delivered in JOB-007.

### ✅ JOB-004 — Inquiry Ignition Safeguard
- Inquiries no longer marked as "Ignited" if project creation dialog is cancelled after accepting.
- Inquiry stays active until the project is successfully calibrated and saved.

### ✅ JOB-005 — Client Portal Mobile Responsiveness
- Redesigned mobile header layout: centered branding, visible hamburger menu.
- Auto-closing sidebar on page selection.
- Horizontally scrollable high-fidelity invoice sheets on narrow screens.

### ✅ JOB-006 — Disable Edit Pencil on Micro-Job Preview (Standalone Edit Menu)
- While viewing a micro-job invoice preview, clicking Edit Details was incorrectly
  leading to the standalone edit workspace.
- Fix: Edit disabled entirely for CMS invoices in preview modal (delivered in JOB-009).

---

## Verification Checklist — Before Each Git Push

### Session 3 Checks
| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Client portal header | No 💡 lightbulb icon anywhere |
| 2 | Admin panel sidebar | 💡 lightbulb still present |
| 3 | Admin creates micro-job invoice | Client portal shows 🔧 orange toast |
| 4 | Client dashboard → Recent Activity | CMS invoice entry appears |
| 5 | General Support project → Project Detail | Progress + Milestones greyed out with message |
| 6 | Any normal project → Project Detail | Progress bar + milestones render normally |
| 7 | Dashboard Active Projects | General Support shows "Chat only" badge |
| 8 | Projects page grid | General Support card shows "Chat only" badge |

### Session 2 Checks
| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Invoice Vault grand total column | Shows actual grand total, not project quote |
| 2 | Micro-job invoice edit pencil (Vault list) | Disabled with tooltip warning |
| 3 | Micro-job invoice preview → EDIT DETAILS | Button disabled, greyed out, tooltip shown |
| 4 | Custom invoice preview (e.g. NG/25062026/...) | Issue Date = date from invoice number |
| 5 | Paid custom invoice preview → EDIT DETAILS | Button disabled with "Paid" tooltip |
| 6 | Delete micro-job invoice | Jobs return to Unbilled in ledger |
| 7 | Delete invoice with no cashbook entries | Keep/Purge radio hidden, only notice shown |
| 8 | Client portal → Invoices tab | CMS invoices visible (Pending + Settled) |
| 9 | Client portal → invoice item detail | Itemized micro-jobs with correct discounts |

### Session 1 Checks
| # | Test | Expected Result |
|---|------|-----------------|
| 1 | Financials → Cashbook → Search box | Typing does not blank the page |
