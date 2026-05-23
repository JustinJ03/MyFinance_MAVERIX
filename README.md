# MyFinance — MAVERIX Group
## Hackathon X: FinTech Forward 2026

A Malaysian-focused personal finance tracker built with **Laravel 11** (API) + **Next.js 16** (Frontend).

---

## Features

- Bank Account Management (multi-account, transfers, archive)
- Expense & Income Tracking (two-level categories, receipts)
- Recurring Transactions (Template → Pending → Confirm flow)
- Budget Tracker (progress bars, rollover, alerts)
- Monitoring Dashboard (net worth, cashflow, spending breakdown)
- EPF Tracker (3 sub-accounts, calculators, auto-sync)
- ASB/ASNB Tracker (multi-fund, dividends, compound calculator)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Laravel 11 + Sanctum |
| Frontend | Next.js 16 App Router + Tailwind CSS v4 + shadcn/ui |
| Database | MySQL 8 |
| Cache / Queue | Redis 7 |
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
cp .env.example backend/.env
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

# Edit .env — set DB_* and REDIS_* to match your local services
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

# Edit .env.local if your API runs on a different port/host
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
| `DB_CONNECTION` | Database driver | `sqlite` |
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
├── backend/          # Laravel 11 API
│   ├── app/
│   ├── database/
│   └── routes/api.php
├── frontend/         # Next.js 16 App Router
│   ├── app/
│   │   ├── (auth)/   # Login / Register
│   │   └── (app)/    # Authenticated pages
│   └── components/
├── docker/           # Docker configs (nginx, php, node, mysql)
└── docker-compose.yml
```

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
```

---

## Team — MAVERIX Group

Built for **Hackathon X: FinTech Forward 2026**

---

## AI Assistance

This project was developed with the assistance of AI coding agents:

| Tool | Model |
|---|---|
| Claude Code (Anthropic) | Claude Sonnet 4.6 |
| Antigravity IDE | Google Gemini 2.5 Pro |

AI was used for architecture design, code generation, debugging, and sprint planning throughout the hackathon.
