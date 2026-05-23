# MyFinance — 8-Hour Hackathon Sprint Design Spec
> **Date**: 2026-05-23  
> **Context**: Hackathon X: FinTech Forward 2026 — 8-hour deadline  
> **Approach**: Wave Execution (C) — Feature complete → Polish → Advanced trackers → Test

---

## 1. Baseline State

### Backend — 100% complete, zero changes needed
- Laravel 12 + Sanctum, 12 migrations, 68 API endpoints, all tested (10 tests, 27 assertions pass)
- Services layer: TransactionService, BankAccountService, EpfService, AsbService, SyncService, RecurringService, DashboardService
- Demo user: `demo@myfinance.my` / `password`

### Frontend — ~65% complete, all work happens here
- Next.js (App Router), Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand
- All 10 routes exist; hooks, types, stores, formatters, validators all present
- Missing: edit forms, EPF/ASB full CRUD, UI polish, EPF dividends tab, ASB full tabs

---

## 2. Wave Execution Plan

### Wave 1 — Critical Fixes + Edit Forms (~1.5 hrs)

#### 2.1 Fix: Transaction Form — add missing fields
**File**: `frontend/app/(app)/transactions/page.tsx`

Missing fields to add to the Add Transaction sheet form:
- `category_id` — grouped select (parent → children), filtered by transaction type (expense/income). Required for budget tracking.
- `to_account_id` — shown only when `type === 'transfer'`
- `epf_account_number` — shown when category is Investment/Savings → EPF (Voluntary)
- `asb_fund_id` — shown when category is Investment/Savings → ASB

Category grouping logic: fetch `/categories`, group children under parent labels using `optgroup`-style Select rendering.

#### 2.2 Edit: Bank Accounts
**File**: `frontend/app/(app)/accounts/page.tsx`

- Add edit (pencil) icon to each AccountCard alongside the existing archive button
- On click: open Sheet pre-filled with account data (nickname, bank_name, account_type, last_four_digits, color)
- Submit calls `useUpdateAccount(id)` mutation (already exists in `hooks/useAccounts.ts`) → PUT `/accounts/{id}`
- `initial_balance` is NOT editable after creation (display-only in edit form)
- On success: invalidate `['accounts']` and `['dashboard']` queries, close sheet, toast

#### 2.3 Edit: Transactions
**File**: `frontend/app/(app)/transactions/page.tsx`

- Add edit (pencil) and delete (trash) icon buttons on each transaction row
- Edit: open Sheet pre-filled with (name, amount, category_id, account_id, actual_date, remarks). `type` field is display-only (cannot change after creation).
- Submit calls `useUpdateTransaction(id)` mutation (already exists in `hooks/useTransactions.ts`) → PUT `/transactions/{id}`
- Delete: confirm dialog → `useDeleteTransaction()` mutation → DELETE `/transactions/{id}`
- On success: invalidate `['transactions']`, `['accounts']`, `['dashboard']`, `['budgets']`

#### 2.4 Edit: Recurring Templates
**File**: `frontend/app/(app)/recurring/page.tsx`

- Add edit icon to each template card (alongside existing pause/resume/delete buttons)
- Open Sheet pre-filled with (name, default_amount, category_id, account_id, frequency, scheduled_day, end_date, remarks)
- Add `useUpdateRecurring(id)` to `hooks/useRecurring.ts` → PUT `/recurring/{id}`
- `type` (expense/income) is display-only (cannot change)
- On success: invalidate `['recurring-templates']`, close sheet, toast

#### 2.5 Edit: Budgets + Toggle Active/Inactive
**File**: `frontend/app/(app)/budgets/page.tsx`

- Add edit icon to each BudgetCard (alongside existing delete button)
- Edit Sheet pre-filled with (amount_limit, period_type, rollover)
- Add `useUpdateBudget(id)` to `hooks/useBudgets.ts` → PUT `/budgets/{id}`
- Add toggle button (power icon) on each BudgetCard
- Add `useToggleBudget()` to `hooks/useBudgets.ts` → PATCH `/budgets/{id}/toggle`
- Visual: inactive budgets shown with reduced opacity + "Inactive" badge
- On success: invalidate `['budgets']` and `['dashboard']`

#### 2.6 Settings — Make Functional
**File**: `frontend/app/(app)/settings/page.tsx`

Current state: read-only display of user name, email, member since.

Add two forms (each in its own Card):
1. **Edit Profile**: name field → PUT `/auth/me` with `{ name }`
2. **Change Password**: current_password, new_password, confirm_password fields → PUT `/auth/me` with password fields. Validate new_password === confirm_password client-side.

Add `useUpdateProfile()` mutation in `hooks/useAuth.ts` (new file) → PUT `/auth/me`. On success: update Zustand `authStore` user object, toast "Profile updated".

---

### Wave 2 — UI/UX Polish (~3 hrs)

**Approach**: Invoke `frontend-design` skill for each page/section group. Design system to apply consistently:
- Background: `slate-950` base, `slate-900` cards
- Accents: indigo-500/600 primary, purple secondary
- Cards: subtle gradient tops, glassmorphism borders (`border-slate-800/60`)
- Typography: tight tracking on headings, muted subtitles
- Interactions: hover border lift, smooth `transition-all duration-200`
- Empty states: illustrated with emoji, friendly copy
- Loading: consistent spinner + skeleton approach

**Pages to polish (in order)**:
1. Auth pages (`/login`, `/register`) — centered card layout, brand logo, smooth form
2. Dashboard — hero net worth block with gradient, richer chart cards
3. Accounts — card grid with color accent strip, hover effects
4. Transactions — grouped by date rows, type color coding
5. Recurring — timeline/card view with frequency badges
6. Budgets — richer progress bars with gradient fill, status colour coding
7. EPF — account cards with percentage rings, tabbed layout polish
8. ASB — fund cards with balance/units display, compact per-fund tabs
9. Settings — profile card with avatar placeholder

**Component improvements alongside polish**:
- Replace all `window.confirm()` calls with a reusable `ConfirmDialog` using shadcn `AlertDialog`
- `ConfirmDialog` props: `open`, `onConfirm`, `onCancel`, `title`, `description`
- Add to `components/common/ConfirmDialog.tsx`

---

### Wave 3 — EPF Full + ASB Full (~2.5 hrs)

#### 3.1 EPF — 5-Tab Structure
**File**: `frontend/app/(app)/epf/page.tsx`

Tabs: `overview` | `transactions` | `dividends` | `analytics` | `calculators`

**Transactions Tab** (add/delete contributions & withdrawals):
- "Add Entry" button → Sheet form:
  - `transaction_type`: contribution | withdrawal (dropdown — dividends are in their own tab)
  - If contribution: `contribution_type` (mandatory | voluntary)
  - If mandatory: `employee_amount` + `employer_amount` + `date` + `remarks`
    - Display note: "Auto-splits 75% → Acc 1, 15% → Acc 2, 10% → Acc 3"
  - If voluntary: `epf_account_number` (1/2/3) + `amount` + `date` + `remarks`
  - If withdrawal: `epf_account_number` + `amount` + `date` + `remarks`
- Submit → POST `/epf/transactions`
- Add `useCreateEpfTransaction()` to `hooks/useEpf.ts`
- Delete button on each row → confirm dialog → DELETE `/epf/transactions/{id}`
- Add `useDeleteEpfTransaction()` to `hooks/useEpf.ts`
- List filtered to exclude `transaction_type === 'dividend'`

**Dividends Tab** (manual dividend insertion):
- Table of EPF dividend entries (filtered to `transaction_type === 'dividend'`)
- Columns: Account, Year, Dividend Rate, Amount (RM), Remarks
- "Add Dividend" button → Sheet form:
  - `epf_account_number` (1 / 2 / 3)
  - `year` (number, e.g. 2024)
  - `dividend_rate` — percentage display input (e.g. 5.50%). Appended to remarks on submit as prefix: `"Rate: 5.50% · " + remarks`. The `epf_transactions` table has no dedicated rate column; storing in remarks is the correct approach.
  - `total_amount` (RM) — the actual dividend amount credited to that account
  - `remarks` (optional, free text appended after rate prefix)
- Submit → POST `/epf/transactions` with `transaction_type: 'dividend'`, `total_amount` = dividend RM, `remarks` = "Rate: X%" string
- Uses same `useCreateEpfTransaction()` mutation
- Delete button → confirm dialog

**Analytics Tab**:
- Data: `useEpfAnalytics()` → GET `/epf/analytics`
- Add `useEpfAnalytics()` to `hooks/useEpf.ts`
- LineChart: balance over time, one line per account (Account 1/2/3), using Recharts
- BarChart: monthly contribution totals (employee + employer stacked bars)
- Stat row: total employee contributions vs total employer contributions

**Calculators Tab** (3 accordion panels):
All calculators are client-side forms that call GET endpoints with query params.

1. **Retirement Calculator**
   - Inputs: `current_age`, `retirement_age` (default 55), `current_balance` (pre-filled from overview), `monthly_contribution`, `annual_dividend_rate` (default 5.5%)
   - Submit → GET `/epf/calculator/retirement?...`
   - Output: projected_balance at retirement, formatted prominently

2. **Sustainability Calculator (Account 3)**
   - Inputs: `monthly_withdrawal`, `account_3_balance` (pre-filled)
   - Submit → GET `/epf/calculator/sustainability?...`
   - Output: months_remaining, years_remaining

3. **Comfort Analysis**
   - Inputs: `expected_monthly_expenses`, `retirement_age`
   - Submit → GET `/epf/calculator/comfort?...`
   - Output: surplus or shortfall indication, colour-coded

#### 3.2 ASB — Full Per-Fund CRUD
**File**: `frontend/app/(app)/asb/page.tsx`

**Add Fund Button** (top of page):
- Sheet form: `fund_name` dropdown (from `ASB_FUNDS` constant)
- Submit → POST `/asb`
- Add `useCreateAsbFund()` to `hooks/useAsb.ts`
- On success: invalidate `['asb']`

**Per-fund inner tabs**: `overview` | `transactions` | `dividends` | `calculator`

Each tab fetches using the fund's `id` from the outer funds list.

**Transactions Tab** (per fund):
- List of deposits and withdrawals: GET `/asb/{fundId}/transactions`
- "Add Transaction" button → Sheet:
  - `transaction_type`: deposit | withdrawal
  - `date`, `amount` (RM), `remarks`
- Submit → POST `/asb/{fundId}/transactions`
- Delete → DELETE `/asb/{fundId}/transactions/{id}`
- Add `useAsbTransactions(fundId)`, `useCreateAsbTransaction(fundId)`, `useDeleteAsbTransaction(fundId)` to `hooks/useAsb.ts`

**Dividends Tab** (per fund):
- List of annual dividend records: GET `/asb/{fundId}/dividends`
- Columns: Year, Dividend Rate, Dividend Amount, Bonus Rate, Bonus Amount, Total Payout
- "Add Dividend" button → Sheet:
  - `year`, `dividend_rate` (%), `dividend_amount` (RM)
  - `bonus_rate` (%) optional, `bonus_amount` (RM) optional
- Submit → POST `/asb/{fundId}/dividends`
- Delete → DELETE `/asb/{fundId}/dividends/{id}`
- Add `useAsbDividends(fundId)`, `useCreateAsbDividend(fundId)`, `useDeleteAsbDividend(fundId)` to `hooks/useAsb.ts`

**Calculator Tab** (per fund):
- Inputs: `current_balance` (pre-filled from fund data), `monthly_top_up`, `dividend_rate` (default 4.5%), `years` (default 10)
- Submit → GET `/asb/{fundId}/calculator?...`
- Display: projected_balance, total_dividends_earned, total_principal_deposited
- Optional: simple LineChart of year-by-year projected balance if API returns array

---

### Wave 4 — Test, Fix, Demo Prep (~1 hr)

**Functional smoke tests** (manual in browser):
1. Auth: login → dashboard → logout → login again
2. Accounts: add → edit → archive → restore
3. Transactions: add with category → confirm pending → edit → delete
4. Recurring: add monthly template → check pending generated
5. Budgets: add → check health after transaction → edit limit → toggle inactive
6. EPF: add mandatory contribution (check auto-split) → add dividend
7. ASB: add fund → add deposit → add dividend
8. Dashboard: verify net worth, cashflow chart, budget health, EPF/ASB snapshot

**Edge cases**:
- Empty states on all pages (delete all records to verify)
- Balance mask toggle (eye icon in Topbar)
- Pending banner count badge in Topbar

**Demo prep**:
- `docker compose exec laravel php artisan migrate:fresh --seed` for clean demo data
- Verify `demo@myfinance.my` / `password` login works
- Final TypeScript build: `npm run build` must pass with 0 errors

---

## 3. Architecture Rules (no exceptions)

- **Backend**: zero changes — all API endpoints already exist and are tested
- **Edit forms**: reuse the same Sheet component pattern as add forms — single `open` state, conditional `selectedItem` state drives pre-fill vs blank
- **Hooks**: mutations defined in domain hook files; pages import hooks, never call `api` directly
- **Queries invalidated** on every mutation: `['transactions']`, `['accounts']`, `['dashboard']`, `['budgets']` where relevant
- **ConfirmDialog**: all destructive actions use `components/common/ConfirmDialog.tsx` — no `window.confirm()`
- **Error handling**: `onError: (e) => toast.error(e.response?.data?.message ?? 'Failed')` pattern consistently
- **TypeScript**: `any` only where API response shape is genuinely unknown; prefer typed hooks

---

## 4. Files Changed (complete list)

### Modified
| File | Change |
|---|---|
| `app/(app)/transactions/page.tsx` | Add category/transfer/EPF/ASB fields to form; add edit+delete per row |
| `app/(app)/accounts/page.tsx` | Add edit Sheet per card |
| `app/(app)/recurring/page.tsx` | Add edit Sheet per template |
| `app/(app)/budgets/page.tsx` | Add edit Sheet + toggle button per budget |
| `app/(app)/settings/page.tsx` | Add edit profile + change password forms |
| `app/(app)/epf/page.tsx` | Add 5th Dividends tab; add Transaction form; build Analytics + Calculators tabs |
| `app/(app)/asb/page.tsx` | Add Fund button; per-fund Transactions/Dividends/Calculator tabs |
| `app/(auth)/login/page.tsx` | UI polish |
| `app/(auth)/register/page.tsx` | UI polish |
| `app/(app)/layout.tsx` | Minor polish (if needed) |
| `hooks/useRecurring.ts` | Add `useUpdateRecurring(id)` |
| `hooks/useBudgets.ts` | Add `useUpdateBudget(id)`, `useToggleBudget()` |
| `hooks/useEpf.ts` | Add `useCreateEpfTransaction()`, `useDeleteEpfTransaction()`, `useEpfAnalytics()` |
| `hooks/useAsb.ts` | Add all ASB mutations (create fund, transactions, dividends) |
| `components/layout/Sidebar.tsx` | Visual polish |
| `components/layout/Topbar.tsx` | Visual polish |

### New Files
| File | Purpose |
|---|---|
| `hooks/useAuth.ts` | `useUpdateProfile()` mutation → PUT /auth/me. New file — distinct from `store/authStore.ts` (Zustand store). This is a TanStack Query mutation hook. |
| `components/common/ConfirmDialog.tsx` | AlertDialog wrapper for destructive action confirmations |

### No Changes
- All backend files
- `lib/api.ts`, `lib/constants.ts`, `lib/formatters.ts`, `lib/validators.ts`, `lib/utils.ts`, `lib/queryClient.ts`
- `store/authStore.ts`, `store/uiStore.ts`, `store/pendingStore.ts`
- `types/` directory (all 10 type files)
- `components/ui/` directory (all shadcn components)
- `components/common/EmptyState.tsx`, `LoadingSpinner.tsx`, `BalanceMask.tsx`, `StatusBadge.tsx`
- `components/layout/PendingBanner.tsx`
- `app/(app)/dashboard/page.tsx` (polish only, during Wave 2)
- `app/(app)/accounts/[id]/page.tsx` (no changes needed)
