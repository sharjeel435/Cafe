# CampusBite — University Cafeteria Pre-Order Platform

> **Production-grade full-stack web application designed for Karachi University (KU) context.**  
> Eliminates cafeteria queues during short class breaks by providing live digital menus, time-slotted pre-ordering, integrated campus wallet & cash payments, order tracking, and live staff fulfillment boards.

---

## 🚀 Key Features

### 🎓 For Students
- **Smart Digital Menu**: Instant search, category tabs (Desi, Burgers, Rolls, Snacks, Drinks, Tea & Coffee, Desserts), live stock availability toggles, and customizable item options (spice levels, sizes, extras).
- **Time-Slotted Pickup**: Dynamic 10-minute pickup slots with slot capacity enforcement to prevent rush hour bottlenecking.
- **Dual Payment Methods**: Instant payment via campus digital wallet (with integer-paisa accuracy) or cash on pickup.
- **Live Order Tracking**: Visual progress pipeline (Pending → Confirmed → Preparing → Ready → Completed) with instant 4-digit pickup authentication code upon preparation completion.
- **Campus Wallet**: Real-time balance tracker, transaction history with receipts, and automatic refunds upon order cancellation.
- **In-App Notifications**: Real-time alerts on order status changes and wallet updates.

### 👨‍🍳 For Cafeteria Staff
- **Live Kanban Fulfillment Board**: Real-time 4-stage pipeline (New Orders, Confirmed, Preparing, Ready) with auto-refresh every 30 seconds and urgent order markers.
- **Instant Menu Controls**: One-tap stock toggle to mark items sold out or back in stock immediately.
- **Pickup Verification Terminal**: 4-digit code verifier verifying ready status before meal handover.

### 🛠️ For Administrators
- **Executive Analytics Dashboard**: Real-time sales metrics, hourly order distribution chart, 7-day revenue tracking, best-selling dishes ranking, and order status breakdown via Recharts.
- **User & Student Management**: Full user registry, student ID tracking, and direct administrative wallet top-ups.
- **Menu Management Console**: Complete CRUD interface for dishes, categories, pricing, and prep times.
- **Cafeteria System Settings**: Dynamic configuration for cafeteria operating hours, rush hour windows, slot intervals, max orders per slot, and payment toggle switches.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Server Actions)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 with RBAC (`STUDENT`, `STAFF`, `ADMIN`) & Bcrypt password hashing
- **Validation**: Zod schema validation & React Hook Form
- **Data Visualization**: Recharts
- **Testing**: Vitest & Playwright

---

## 📦 Pre-configured Demo Accounts & Seed Data

The database seed (`prisma/seed.ts`) provides **27 Pakistani cafeteria dishes** across 8 categories, 18 pickup slots for today, system settings, and demo credentials:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@campusbite.pk` | `Admin@123` | Full dashboard, analytics, settings, user management |
| **Staff** | `staff@campusbite.pk` | `Staff@123` | Live Kitchen Kanban board & Pickup code verifier |
| **Student 1** | `ahmed@student.ku.edu.pk` | `Student@123` | STU-2026-001 (Wallet Balance: **Rs. 2,500**) |
| **Student 2** | `fatima@student.ku.edu.pk` | `Student@123` | STU-2026-002 (Wallet Balance: **Rs. 1,500**) |
| **Student 3** | `bilal@student.ku.edu.pk` | `Student@123` | STU-2026-003 (Wallet Balance: **Rs. 500**) |

---

## ⚡ Quick Start & Database Setup

### 1. Configure Environment
Update `.env` with your PostgreSQL connection string:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/campusbite"
AUTH_SECRET="campusbite-dev-secret-key-change-in-production-32chars"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
UNIVERSITY_EMAIL_DOMAIN=""
```

### 2. Push Schema and Run Seed (20+ Items)
```bash
# Push schema migrations to your database
npm run prisma:push

# Seed demo users, categories, 27 dishes & pickup slots
npx tsx prisma/seed.ts
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Tests & Quality Assurance

```bash
# Run unit test suite (Vitest)
npm test

# Run TypeScript typecheck
npm run typecheck

# Run production build check
npm run build
```
