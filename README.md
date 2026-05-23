# MyFinance — MAVERIX Group
## Hackathon X: FinTech Forward 2026

A Malaysian-focused personal finance tracker built with **Laravel** (API) + **Next.js** (Frontend).

---

## Features
- 🏦 Bank Account Management (multi-account, transfers, archive)
- 💸 Expense & Income Tracking (two-level categories, receipts)
- 🔁 Recurring Transactions (Template → Pending → Confirm flow)
- 🎯 Budget Tracker (progress bars, rollover, alerts)
- 📊 Monitoring Dashboard (net worth, cashflow, spending breakdown)
- 📈 EPF Tracker (3 sub-accounts, calculators, auto-sync)
- 🏦 ASB/ASNB Tracker (multi-fund, dividends, compound calculator)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | Laravel 11 + Sanctum |
| Frontend | Next.js 14 App Router + Tailwind CSS + shadcn/ui |
| Database | MySQL 8 |
| Cache/Queue | Redis |
| File Storage | Google Cloud Storage |
| Container | Docker Compose |

---

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+

```bash
# 1. Clone the repo
git clone https://github.com/JustinJ03/MyFinance_MAVERIX.git
cd MyFinance_MAVERIX

# 2. Copy environment files
cp .env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 3. Start all services
docker compose up -d

# 4. Run Laravel setup
docker compose exec laravel composer install
docker compose exec laravel php artisan key:generate
docker compose exec laravel php artisan migrate --seed

# 5. Open in browser
# Frontend: http://localhost:3000
# API:      http://localhost/api/v1
```

---

## Development (without Docker)

```bash
# Backend (in backend/)
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve

# Frontend (in frontend/)
npm install
npm run dev
```

---

## Team — MAVERIX Group
Built for Hackathon X: FinTech Forward 2026

---

## AI Assistance
This project was developed with the assistance of advanced AI coding agents:
- **Agents Used**: Claude Code, Antigravity IDE
- **Models Used**: Anthropic Claude 3.5 Sonnet, Google Gemini 2.5 Pro
