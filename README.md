This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

1. Copy env template and fill your values:

```bash
cp .env.local.example .env.local
```

2. Set database env vars.

- `DATABASE_URL`: runtime connection string (recommended: Supabase pooler/pgBouncer URL)
- `DIRECT_URL`: direct Postgres URL for Prisma migrations (`db.<project-ref>.supabase.co:5432`)

3. Install dependencies and apply schema:

```bash
npm install
npm run db:generate
npm run db:migrate
```

4. Run the development server:

```bash
npm run dev
```

Optional pre-deploy validation:

```bash
npm run deploy:check
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Security Hardening

This app includes baseline production protections:

- Auth-protected API routes (Clerk + server-side ownership checks)
- API request rate limiting in `middleware.ts`
- Locked-down API CORS policy with trusted-origin preflight checks
- Same-origin checks for mutating API requests (CSRF mitigation)
- Strict security headers (CSP, HSTS in production, COOP/CORP, frame/object restrictions)
- Input validation/sanitization via `lib/validation.ts`
- Security event logging via `lib/security-monitoring.ts`
- Frontend runtime error capture + reporting endpoint (`/api/monitoring/client-errors`)
- Route/global error boundaries for clean user-facing recovery screens
- Sensitive webhook signature validation with timing-safe compare

### Required environment variables

- `DATABASE_URL` (PostgreSQL)
- `DIRECT_URL` (direct Postgres connection for Prisma migrations)
- `NEXT_PUBLIC_APP_URL`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OWNER_USER_ID` (recommended) or `OWNER_EMAIL` to lock admin to only one owner account
- Optional legacy fallback: `ADMIN_EMAILS` and/or `ADMIN_USER_IDS` (only first value is treated as owner)
- Optional: `ALLOWED_CORS_ORIGINS` (comma-separated trusted browser origins)
- Optional (dev/preview only): `ENABLE_TEST_PAYMENTS=true` to simulate successful checkout without charging cards
- Optional: `SECURITY_ALERT_WEBHOOK_URL` for security alerts
- Optional: `APP_ALERT_WEBHOOK_URL` for non-security runtime/crash alerts
- Optional: `NEXT_PUBLIC_TERMLY_PRIVACY_POLICY_ID` + `NEXT_PUBLIC_TERMLY_TERMS_OF_USE_ID`

If you use Supabase APIs with Clerk JWTs, apply [`supabase-clerk-rls.sql`](./supabase-clerk-rls.sql).

## Test Payments (No Real Charges)

Use this only for development or preview testing.

1. Set `ENABLE_TEST_PAYMENTS=true` in your `.env.local`.
2. Keep non-production keys/domains for local testing.
3. Checkout and domain purchase flows will redirect directly to success and verify through a safe test mode path.
4. In production, keep `ENABLE_TEST_PAYMENTS=false`.

## Monitoring

- Health endpoint: `GET /api/health`
- Frontend/runtime error endpoint: `POST /api/monitoring/client-errors`
- Security events are logged as structured JSON with `[security]` prefix.
- Application errors are logged as structured JSON with `[app]` prefix.
- In production, ship logs to your observability platform (Datadog, New Relic, CloudWatch, etc.).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

1. Add all environment variables from `.env.local.example` in Vercel Project Settings.

2. Ensure runtime DB is set to production PostgreSQL (Supabase/Neon/RDS).

- `DATABASE_URL` should be your runtime pooled URL.
- `DIRECT_URL` should be your direct DB URL for schema migrations.

3. Use Clerk production keys (`pk_live`, `sk_live`) and add your live domain in Clerk dashboard.
   - Password reset link/code expiry is controlled by Clerk settings and defaults.
   - If your dashboard allows custom reset/verification lifetime, set it to 30 minutes there.
   - This cannot be force-overridden purely from app code.

4. Set `NEXT_PUBLIC_APP_URL` to your exact HTTPS domain (for example `https://yourdomain.com`).

5. Run migrations on production database (uses `DIRECT_URL` when set):

```bash
npm run db:deploy
```

6. Run deployment preflight checks:

```bash
npm run deploy:check
```

`vercel.json` runs this automatically during Vercel builds via `npm run vercel:build`.

7. Build and start:

```bash
npm run build
npm run start
```

8. Add custom domain in Vercel and configure DNS records at your registrar.

9. Verify post-deploy:
- `GET /api/health`
- `POST /api/monitoring/client-errors` returns `{ received: true }`
- Login/Register flow
- Checkout/payments flow
- Dashboard and CRM data isolation (one user cannot access another user)

## SQLite to PostgreSQL Note

- The Prisma migration history is now PostgreSQL-based.
- Legacy SQLite migration files were archived under `prisma/sqlite-migrations-archive`.
- If you have existing SQLite data in `prisma/dev.db`, migrate that data into PostgreSQL before going live.
