# MyFinance — Development Memory Checkpoint
> **Date**: 23 May 2026
> **Purpose**: This file preserves the project context, exact current status, and setup instructions in case of model context limits or session resets.

---

## 1. Project Overview & Tech Stack
**MyFinance** is a Malaysian-focused personal finance web application built for **Hackathon X: FinTech Forward 2026**.

* **Monorepo Structure**:
  * `/backend`: Laravel 12 API with Sanctum token authentication.
  * `/frontend`: Next.js 16 (Turbopack) with TypeScript, Tailwind CSS v4, shadcn/ui Nova preset, Zustand, and TanStack Query.
  * `/docker`: Containership setup (Nginx routing `/api` to Laravel, `/` to Next.js; MySQL; Redis).

---

## 2. Current Implementation Status

### 2.1 Backend (Laravel) — 100% Core Ready
* **Database & Migrations**: All 11 migrations are successfully created and ran.
* **Seeders**: `DatabaseSeeder` runs `CategorySeeder` (system categories + subcategories) and creates the default Hackathon demo user.
  * **Demo User Credential**:
    * **Email**: `demo@myfinance.my`
    * **Password**: `password`
* **API Endpoints**: 68 endpoints fully configured, including:
  * `/auth/*` (register, login, logout, me, updateMe)
  * `/accounts/*` (list, create, show, update, archive, restore, transactions)
  * `/categories/*` (index, store, update, destroy, parents, children)
  * `/transactions/*` (index, store, show, update, destroy, confirm, skip, pending, summary)
  * `/recurring/*` (index, store, show, update, destroy, pause, resume)
  * `/budgets/*` (index, store, show, update, destroy, toggle, history, overview)
  * `/dashboard/*` (index, net-worth, cashflow, spending-breakdown)
  * `/epf/*` (overview, transactions, analytics, calculators)
  * `/asb/*` (funds, transactions, dividends, analytics, calculators)
* **Services Layer**: Business logic separated from controllers into Services (`TransactionService`, `AsbService`, `EpfService`, `SyncService`, etc.).
* **Test Status**: Basic unit and feature tests pass (`php artisan test`).

### 2.2 Frontend (Next.js) — 95% Core Ready
* **Build Check**: Verified that the Next.js production build (`npm run build`) compiles successfully with 0 errors across all 12 routes!
* **Routes & Pages**:
  * `/` (Home redirecting to dashboard)
  * `/login` & `/register` (Auth forms)
  * `/dashboard` (Aggregated Net Worth, Cashflow cards, charts, budgets health, recent feed)
  * `/accounts` (Management grid, slide-over creation form)
  * `/transactions` (List, filters, confirm/skip actions)
  * `/recurring` (Recurring templates list / stub)
  * `/budgets` (Budget tracker / stub)
  * `/epf` (EPF tracker with Overview, Transactions, Analytics, and Calculators tabs)
  * `/asb` (ASB tracker with per-fund tabs and dividend tables)
  * `/settings` (User settings overview)
* **Design & Theme**: shadcn/ui Nova preset configured, global design elements (e.g., balance mask visibility toggles, dynamic sidebar collapse) wired via Zustand stores.

---

## 3. Configuration & Local Execution

### 3.1 Backend Configuration (.env)
Copy `backend/.env.example` to `backend/.env`.
```bash
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=myfinance
DB_USERNAME=root
DB_PASSWORD=
```
*Run Migrations & Seeders*:
```bash
php artisan migrate:fresh --seed
```

### 3.2 Frontend Configuration (.env.local)
Copy `frontend/.env.local.example` to `frontend/.env.local`.
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### 3.3 Running Dev Servers Locally
* **Backend**: `php artisan serve` (starts on port 8000)
* **Frontend**: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; npm run dev` (starts Next.js on port 3000)

---

## 4. Next Action Items (Remaining Tasks)
1. **Test Auto-Sync Logic**: Verify that saving an investment expense in Category `Investment/Savings -> EPF` or `ASB` automatically creates the corresponding transaction in the EPF/ASB trackers.
2. **Test Scheduler Flow**: Verify that when scheduler command `db:seed` or Scheduler runs, pending transaction occurrences are generated for active recurring templates.
3. **Empty States**: Review first-time user dashboard/account views and ensure user experience remains smooth before data is keyed.
4. **Responsive/Mobile Verification**: Ensure layout behaves correctly on smaller screens.
