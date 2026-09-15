# CampusBite — BUKC

Developed by **Bilal Khan**.

Campus cafeteria ordering with Next.js 16, Prisma 5, PostgreSQL, and role-based NextAuth sessions. Demo data is seeded into PostgreSQL; the application does not use in-memory accounts, carts, wallets, or fake analytics.

## Vercel + Prisma Postgres

1. Set the Vercel project **Root Directory** to `campusbite` if the repository contains this folder.
2. Connect the Prisma Postgres integration to the project. Set `DATABASE_URL` to its PostgreSQL **TCP connection string** (`postgres://` or `postgresql://`). This project uses Prisma 5's PostgreSQL connector, not an HTTP driver. Use the provider's pooled endpoint for application traffic.
3. Set a strong random `AUTH_SECRET` and `AUTH_TRUST_HOST=true` in Vercel. Set the variables for each environment you intend to use. A local `.env` does not configure Vercel. Remove stale localhost `AUTH_URL` / `NEXTAUTH_URL` values in Vercel; host detection handles its deployment URLs. When testing on a non-default local port, set `AUTH_URL` to that local origin.
4. Copy `.env.example` to `.env` for local development and fill in your connection. Keep real credentials out of Git.
5. For a **new, empty database**, run:

   ```sh
   npm install
   npm run db:setup
   ```

   This applies the checked-in migration and seeds the demo data. Run this with the intended database connection available to the shell. For migrations, use the provider's direct connection if its pooler does not support migration tooling; temporarily supply that connection as `DATABASE_URL` for the CLI.

6. Deploy with Vercel's normal `npm run build` command. The build regenerates Prisma Client. It does **not** seed, reset, or migrate your database automatically. Apply later migrations with `npm run db:migrate` before deploying code that needs them.

If the database already contains the CampusBite tables from `prisma db push`, **do not reset it**. Compare its schema with `prisma/schema.prisma` first. Only when it matches the initial migration, baseline the existing schema with:

```sh
npx prisma migrate resolve --applied 20260915000000_initial
npm run db:migrate
npm run db:seed
```

Provider references: [Prisma Postgres on Vercel](https://vercel.com/marketplace/prisma/prisma-postgres), [Prisma Postgres connection pooling](https://www.prisma.io/docs/postgres/database/connection-pooling).

## Seeded demo accounts

| Role | Email | Password | Initial wallet |
| --- | --- | --- | --- |
| Admin | admin@campusbite.pk | Admin@123 | — |
| Staff | staff@campusbite.pk | Staff@123 | — |
| Student — Bilal 1 | ahmed@student.ku.edu.pk | Student@123 | Rs. 2,500 |
| Student — Bilal 2 | fatima@student.ku.edu.pk | Student@123 | Rs. 1,500 |
| Student — Bilal 3 | bilal@student.ku.edu.pk | Student@123 | Rs. 500 |

The five fixed demo credentials are defined in `src/lib/demo-accounts.ts`, shared by the login page and database seed. The sign-in page displays their passwords and fills the selected account. The seed hashes passwords, creates 27 dishes across eight categories, and initializes settings. Rerunning the seed restores the listed demo names/passwords/roles but preserves existing wallet balances, transactions, orders, menu edits, and settings. Starting balances apply when a student's wallet is first created. Do not run the demo seed against unrelated accounts using these emails.

## Local development

```sh
npm run dev
```

Open http://localhost:3000. Public visitors can browse `/menu`. Students manage carts, pickup orders, wallets, and notifications. Staff manage the kitchen board, stock availability, and collection. Administrators manage menu items, settings, student wallet credits, orders, and database-derived analytics.

Ordering follows **Asia/Karachi** time. Default hours are **08:00–18:00**. Pickup slots are generated daily, and checkout requires enough preparation time. An empty order history or zero analytics is valid; use a student account to place an order, then sign in as staff to fulfill it. Cash is marked paid when staff completes collection. Wallet credit is a cafeteria ledger, not a payment-gateway integration.

Email password resets are not configured; the account-help page explains this without pretending to send mail.

## Verification

```sh
npm run prisma:generate
npm run typecheck
npm run lint
npm test
npm run build
```

`npm test` runs unit tests and skips database integration tests unless `TEST_DATABASE_URL` is set. The integration suite requires an isolated, seeded **local** PostgreSQL database named `campusbite_test`; it refuses cloud databases and mutates test data.

PowerShell example, after creating the test database:

```powershell
$env:DATABASE_URL = 'postgresql://USER:PASSWORD@127.0.0.1:5432/campusbite_test'
npm run db:setup
$env:TEST_DATABASE_URL = $env:DATABASE_URL
npm test
```

Integration tests cover all five credentials and initial balances, option pricing, ownership checks, insufficient funds, concurrent checkout/refunds, status transitions, cash collection, notifications, settings, and analytics. Browser tests run with `E2E_BASE_URL` pointing to the locally running, seeded app (`npm run test:e2e`). Use a disposable local database; browser tests create orders and simulate wallet payments.
