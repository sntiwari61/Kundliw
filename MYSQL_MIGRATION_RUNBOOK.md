# MySQL migration: what was done, what was proven, how to switch

Branch: `mysql` (the working PostgreSQL site stays on `main`, tag `pre-mysql-postgres-final`, nothing there was changed).
Backup of the live PostgreSQL data (45 tables, 341 rows, every file checksummed): `C:\Users\anshu\Desktop\ClientWork-backups\postgres-2026-11-09\`
(contains customer data and encrypted keys. Keep it private, never commit it.)

## 1. What changed in the code (and why)

| Change | Why | How it was checked |
|---|---|---|
| `prisma/schema.prisma` now `mysql`; one new starting migration `0_init_mysql` plus `1_order_date_indexes`; the 29 old PostgreSQL migrations moved to `prisma/_postgres-archive/` | MySQL cannot run PostgreSQL-only SQL | Applied to an empty MySQL 8.0 **and** MariaDB 10.11 database; `prisma migrate diff` shows no drift |
| 14 list columns (features, inclusions, highlights, offer slugs ...) saved as JSON, read through `toList()` | MySQL has no list column | The type check flagged every place that read them (about 40); admin edit round trip tested in the browser |
| New table `OrderExtraPlan` (one row per extra plan on an order) | Seat counts searched inside a list; MySQL cannot | 600 concurrent bookings (below); copy script checks it matches `Order.extraPlanIds` |
| Seat lock rewritten for MySQL, and **every transaction runs READ COMMITTED** (`src/lib/db/tx.ts`) | MySQL's default would let all 20 of 20 customers take the last seat | See section 2, with a negative control that proves the test can fail |
| Order and invoice numbers use one atomic `INSERT ... ON DUPLICATE KEY UPDATE` (`src/lib/db/counter.ts`) | Prisma's `upsert` is not atomic on MySQL | 40 simultaneous numbers: none repeated, none skipped, on both databases |
| 9 case-insensitive searches: removed `mode: "insensitive"` | Not allowed on MySQL; its normal comparison already ignores case | Searches still work (admin users, associates, order tracking, vault) |
| Text columns: 188 free-text columns are `TEXT`, 71 content columns are `MEDIUMTEXT` | MySQL makes plain text 191 characters otherwise (saving a long link would fail) | Longest value in live data is 2,720 characters; every long one was already long text |
| Sorting by position number now has a fixed tie-break (`createdAt`, then `id`) | When two items share a position number the database used to decide by chance | Pages compared with the live site (section 3) |
| Legal page: when both `privacy` and `legal/privacy` exist, the plain one is shown | Database picked either by chance. MySQL picked the other one than PostgreSQL | Page text now identical to live |
| Connection pool: 5 connections on a normal server (Vercel keeps 1) | One connection would make every query wait in a line | Used by the tests |
| Two new indexes on `Order(createdAt)` and `Order(userId, createdAt)` | Admin "newest orders" read the whole table | 100 ms to 14 ms with 100,000 orders |

## 2. What was proven on a real database (MySQL 8.0.46 and MariaDB 10.11.19)

* **Data copy:** all 341 rows from the backup copied into an empty MySQL; every column of every row compared with the backup. Result on both databases: `ALL TABLES MATCH THE BACKUP`.
* **Last-seat test, 50 rounds on each database:** 20 customers at once for 1 seat, exactly 1 wins every round.
* **Extra-plan seat test, 50 rounds on each database:** 3 seats, 12 customers (half buy the plan as an extra), exactly 3 win every round.
* **Order numbers:** 40 at once, all different and consecutive. **Counters:** 40 transactions at once, none repeated.
* **Negative controls (the tests can really fail):** with MySQL's default isolation the same test let **20 of 20** customers take the single seat; with the lock removed, 15 of 20. So the READ COMMITTED setting is not optional.
* **Cancel, refund tracking, upgrade, downgrade refusal** all pass on the real MySQL schema.
* **Browser walkthrough on the MySQL copy:** customer sign in, My Account with order history and the cancel/upgrade buttons, upgrade to a higher plan (checkout correctly asks only for the difference), UPI payment reference, admin sign in, approving the payment (the old order closes as "credited", the new order gets an invoice number), all 38 admin pages open with no error, admin edit of a plan list saved and shown on the public page.
* Automatic checks: type check clean, 661 unit tests pass, production build passes.

## 3. Pages compared with the live PostgreSQL site

27 public pages (Hindi and English) were compared text for text with the live site. Identical except:
1. **Panchang strip** (today's lunar day: computed at a different moment).
2. **Dates shown a day apart on the blog list** (24 vs 23 October): the server's time zone. On Vercel the server is UTC; on a server in India it is IST. Set the server time zone to the one you want (or UTC) when you host it. This is not a database issue.
3. **Items that share the same position number.** The old database showed them in an accidental order; the new rule is "older first". Visible effects today: the "Next:" button on the Janam Kundli page now points to Career-Business & Raj Yoga (it pointed to Prashn Kundli), and two FAQ answers swap places. Fix for good: give each item its own position number in Admin (Services, FAQ).

## 4. How to switch (do it on a copy first)

1. **Take a fresh backup of PostgreSQL** (the export script is in this project's history; or Supabase's own backup). Keep it.
2. Create an empty MySQL database on the host: character set `utf8mb4`, collation `utf8mb4_unicode_ci`.
3. Put the connection in `DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DBNAME"` (remove `DIRECT_URL`).
4. Create the tables: `npx prisma migrate deploy`
5. Copy the data (reads only the backup folder, refuses a non-empty database): 
   `DATABASE_URL="mysql://..." node scripts/migrate-pg-to-mysql.cjs <backup-folder>`
   It prints `ALL TABLES MATCH THE BACKUP` only if every row and column matches. Do not go on if it prints anything else.
6. Start the site against it, test on a temporary address with the checklist in `FINAL_CHECK_REPORT.md`.
7. Choose a quiet moment, put the site in Maintenance mode, take a last PostgreSQL backup, repeat steps 2 to 5 with that backup (so no order is lost), switch `DATABASE_URL`, switch the domain, end Maintenance mode.
8. Keep PostgreSQL untouched for at least 30 days.

**Going back:** point `DATABASE_URL` and the code back to PostgreSQL (`main`). Orders taken after the switch exist only in MySQL, so write them down from the Admin orders list before going back.

## 5. Things to confirm on the client's real MySQL (cannot be tested from here)

* **Engine and version:** Hostinger's "MySQL" is often MariaDB. Both MySQL 8.0 and MariaDB 10.11 passed everything above. MySQL older than 8.0 or MariaDB older than 10.6 was not tested.
* **Collation** is `utf8mb4_unicode_ci` (case-insensitive) and **time zone**: see section 3.
* **Isolation level in effect:** the app sets READ COMMITTED per transaction, so the host default does not matter. Still run `tests/mysqlConcurrency.test.ts` against the host's database (it removes its own rows):
  `MYSQL_TEST_DB=1 DATABASE_URL="mysql://..." npx vitest run tests/mysqlConcurrency.test.ts`
* **Connections allowed per user** on the plan. The app uses 5. If Hostinger allows fewer, add `?connection_limit=3` to the address.
* **Backups:** the host's backups must include this database, and a restore must be tried once.
* **Real load:** the speed figures below are from a laptop. Shared hosting limits memory and CPU, so measure on the real plan.

## 6. Speed (100,000 orders, local MySQL 8; median of 15 runs)

| Page or action | Time |
|---|---|
| Track an order by number | 2 ms |
| Booking: look up one plan | 2 ms |
| Services page | 5 ms |
| Admin: orders grouped by status | 18 ms |
| Admin: orders waiting for payment check | 23 ms |
| Admin: newest 50 orders | **14 ms** (was 100 ms before the new index) |
| Seat count for a package | 51 ms with 25,000 matching orders (a real package has far fewer) |

All hot lookups use an index (orders by customer, by status, by number, extra plans by plan). No PostgreSQL timing on the same machine was taken, so "as fast as before" is shown by the indexes and the table above, not by a side by side race.

## 7. Known limits and decisions

* Two kinds of data that were arrays in PostgreSQL are now JSON, so a database tool cannot search inside them (the site never did).
* MySQL cannot undo a half-finished migration (PostgreSQL could). Always run `migrate deploy` on a copy and keep a backup first.
* `gen-catalog-migration.cjs` (PostgreSQL SQL generator) moved to `prisma/_postgres-archive/`.
* Vercel runs `vercel-build` (migrate, then build); on Hostinger run `npx prisma migrate deploy` yourself on every update, and start the two daily jobs (`/api/cron/expire-orders`, `/api/cron/backup`, header `Authorization: Bearer <CRON_SECRET>`) from the host's scheduler.
* File uploads on Hostinger: set `STORAGE_DRIVER=local` and `STORAGE_PATH` to a folder outside the app folder (for example `/home/USER/kjk-storage`). Without `STORAGE_DRIVER=local`, production refuses to save files ("Media upload failed"). Do not use `DEMO_MODE` for this.
