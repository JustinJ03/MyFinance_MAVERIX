# MyFinance — MAVERIX Group
## Hackathon X: FinTech Forward 2026

A Malaysian-focused personal finance tracker built with **Laravel 11** (API) + **Next.js 16** (Frontend).

---

## Features

### Core
- **Bank Account Management** — multi-account support, transfers between accounts, archive/restore
- **Expense & Income Tracking** — two-level category hierarchy, receipt attachments (PDF/image, up to 15 MB), group-by-month list view
- **Recurring Transactions** — template-based scheduling with Pending → Confirm/Skip flow
- **Budget Tracker** — per-category monthly/weekly limits, real-time progress bars, on-track/approaching/exceeded alerts
- **Monitoring Dashboard** — net worth snapshot, cashflow chart, spending breakdown by category

### Investment Trackers
- **EPF Tracker** — 3 sub-accounts (Persaraan/Sejahtera/Fleksibel), mandatory contribution auto-split (75/15/10), dividend tracking with auto-calculation, balance-over-time chart, retirement projection calculator
- **ASB/ASNB Tracker** — multi-fund support (ASB, ASB2, ASM, ASM2 Wawasan, ASM3), deposit/withdrawal history grouped by month, annual dividends with bonus tracking, compound growth calculator

### Document Management
- **Bank Statements** — upload, view, and delete PDF/image statements per bank account (up to 20 MB), labelled by period

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Laravel 11 + Sanctum |
| Frontend | Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui |
| State / Data | TanStack Query v5 + React Hook Form |
| Charts | Recharts |
| Database | MySQL 8 |
| Local File Storage | Laravel `local` disk (receipts & statements) |
| Container | Docker Compose |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Node.js 22+ (only needed for local frontend dev without Docker)
- PHP 8.3+ & Composer (only needed for local backend dev without Docker)

---

## Quick Start (Docker — recommended)

```bash
# 1. Clone the repository
git clone https://github.com/JustinJ03/MyFinance_MAVERIX.git
cd MyFinance_MAVERIX

# 2. Copy environment files
cp backend/.env.example backend/.env          # pre-filled for Docker
cp frontend/.env.local.example frontend/.env.local

# 3. Start all services (nginx, laravel, nextjs, mysql, redis)
docker compose up -d

# 4. First-time Laravel setup
docker compose exec laravel composer install
docker compose exec laravel php artisan key:generate
docker compose exec laravel php artisan migrate --seed

# 5. Open in browser
#   Frontend : http://localhost:3000
#   API      : http://localhost/api/v1
```

> **Demo credentials** (seeded automatically):
> - Email: `demo@myfinance.my`
> - Password: `password`

---

## Local Development (without Docker)

### Backend

```bash
cd backend
composer install
cp .env.example .env

# Edit .env — set DB_* to match your local MySQL instance
php artisan key:generate
php artisan migrate --seed
php artisan serve
# API available at http://127.0.0.1:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local

# Edit .env.local — set the API base URL
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1

npm run dev
# App available at http://localhost:3000
```

---

## Environment Variables

### Backend (`backend/.env`)

| Key | Description | Default |
|---|---|---|
| `APP_KEY` | Laravel application key (auto-generated) | — |
| `DB_CONNECTION` | Database driver | `mysql` |
| `DB_HOST` | MySQL host (Docker: `mysql`) | `127.0.0.1` |
| `DB_DATABASE` | Database name | `myfinance` |
| `DB_USERNAME` | Database user | `myfinance` |
| `DB_PASSWORD` | Database password | `secret` |
| `REDIS_HOST` | Redis host (Docker: `redis`) | `127.0.0.1` |

### Frontend (`frontend/.env.local`)

| Key | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Laravel API base URL | `http://localhost/api/v1` |

---

## Project Structure

```
MyFinance_MAVERIX/
├── backend/                        # Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # API controllers
│   │   ├── Models/                 # Eloquent models
│   │   └── Services/               # Business logic (TransactionService, EpfService, …)
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
├── frontend/                       # Next.js 16 App Router
│   ├── app/
│   │   ├── (auth)/                 # Login / Register pages
│   │   └── (app)/
│   │       ├── (dynamic)/          # Authenticated feature pages
│   │       │   ├── accounts/       # Bank accounts + statement manager
│   │       │   ├── transactions/   # Transactions with receipt upload
│   │       │   ├── budgets/        # Budget tracker
│   │       │   ├── epf/            # EPF tracker + analytics + calculator
│   │       │   └── asb/            # ASB/ASNB tracker + calculator
│   │       └── (static)/           # Dashboard
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   └── common/                 # Shared components (ConfirmDialog, …)
│   ├── hooks/                      # TanStack Query hooks (useAsb, useEpf, useAccounts)
│   ├── lib/                        # API client (axios + auth interceptor)
│   └── types/                      # TypeScript interfaces
├── docker/                         # Docker configs (nginx, php, node)
└── docker-compose.yml
```

---

## API Endpoints (key routes)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Authenticate and receive token |
| `GET` | `/accounts` | List bank accounts |
| `GET` | `/transactions` | List transactions (filterable by type/status) |
| `GET` | `/transactions/{id}/receipt` | Stream receipt file (auth required) |
| `POST` | `/transactions/{id}/receipt` | Replace receipt attachment |
| `GET` | `/budgets/overview` | Budget status for current period |
| `GET` | `/accounts/{id}/statements` | List bank statements |
| `GET` | `/accounts/{id}/statements/{sid}/download` | Stream statement file (auth required) |
| `GET` | `/epf` | EPF overview (balances per account) |
| `GET` | `/epf/calculator/retirement` | Retirement projection |
| `GET` | `/asb/{fund}/calculator` | ASB compound growth projection |

---

## Useful Commands

```bash
# Run backend tests
docker compose exec laravel php artisan test

# Production build (frontend)
cd frontend && npm run build

# Clear Laravel caches
docker compose exec laravel php artisan optimize:clear

# View logs
docker compose logs -f

# Run a fresh migration with seed data
docker compose exec laravel php artisan migrate:fresh --seed
```

---

## Team — MAVERIX Group

Built for **Hackathon X: FinTech Forward 2026**

---

## AI Assistance

This project was developed with the assistance of AI coding agents:

| Tool | Model | Usage |
|---|---|---|
| Claude Code (Anthropic) | Claude Sonnet 4.5 / 4.6 | Architecture design, code generation, debugging, sprint planning, code review |
| Antigravity IDE | Google Gemini 2.5 Pro | Supplementary code suggestions and research |

AI tools were used throughout the entire development lifecycle — from initial architecture decisions and database schema design, to feature implementation, bug fixes, and documentation.
