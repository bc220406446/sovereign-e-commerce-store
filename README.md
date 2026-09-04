# Sovereign Watches

Luxury watch storefront built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.

## Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Tailwind CSS v4 with PostCSS
- Supabase Auth and PostgreSQL
- Supabase Storage for user profile images
- Radix UI, shadcn-style components, Lucide icons, and Framer Motion

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_secret_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Keep all secret keys server-side and never commit `.env.local`.

## Supabase setup

Run these migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_initial.sql`
2. `supabase/migrations/002_profile_avatar.sql`

The second migration adds `profiles.avatar_url`. Passwords are managed by Supabase Auth and are never stored in `public.profiles`.

Configure these Supabase redirect URLs:

```text
http://localhost:3000
http://localhost:3000/api/auth/callback
```

Add the matching production URLs when deploying.

## Authentication and authorization

All users use the same `/auth` page for email/password registration and login. Email verification and password reset are supported.

Admin access is role-based. Set an administrator with:

```sql
update public.profiles
set role = 'admin'
where email = 'admin@example.com';
```

Admins sign in through the same page and are redirected to `/admin`. Regular users are redirected to `/account`. There is no public admin registration page.

## Main routes

- `/` — storefront home
- `/shop` — product catalog
- `/product/[slug]` — product details
- `/cart` — shopping cart
- `/checkout` — guest and authenticated checkout
- `/auth` — registration and login
- `/account` — profile, orders, addresses, and wishlist
- `/admin` — role-protected administration portal
- `/track` — guest order tracking

## Product seeding

For controlled development use:

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/seed
```

Protect or remove this endpoint before production deployment.

## Payments and email

Payment and email integrations are configured through environment variables. Keep all secret keys server-side. PayFast webhooks are handled under `/api/payments/payfast/itn`.

## Production

```bash
npm run build
npm run start
```

Set production environment variables in the hosting provider and add the production callback URL to Supabase Authentication URL Configuration.
