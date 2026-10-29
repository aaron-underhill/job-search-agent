# Supabase live job board — setup

This feature adds a *separate* `/board.html` page to the Vercel deployment. The existing public fictional demo at `/` is unchanged. The new page uses email magic-link sign-in and a Postgres `jobs` table protected by row-level security (RLS).

## Set up (approximately one-time)

1. Create a free Supabase project at https://supabase.com/dashboard.
2. In **SQL Editor**, run the full contents of `supabase/schema.sql`. SQL creates the table and four ownership-scoped RLS policies.
3. In Supabase **Project Settings → API** (or **Connect → API keys**), copy the **Project URL** and **publishable key**. The older `anon` public key may also work but prefer the publishable key. **Never use a secret or service_role key in browser code.**
4. In Vercel project **Settings → Environment Variables**, set:
   - `SUPABASE_URL` = project URL
   - `SUPABASE_PUBLISHABLE_KEY` = publishable key
   Choose **Production** environment and redeploy.
5. In Supabase **Authentication → URL Configuration**:
   - Site URL: `https://job-search-agent-cyan.vercel.app`
   - Redirect allowlist: `https://job-search-agent-cyan.vercel.app/board.html`
6. In Supabase **Authentication → Providers → Email**, enable email sign-in and magic-link/OTP sign-in. Email delivery may have limits; for personal use, consider custom SMTP later. Open `https://job-search-agent-cyan.vercel.app/board.html`, enter your email, and follow the email sign-in link.
7. To restrict who can *create accounts*, turn off public signups after your account is established in **Authentication → Settings** (labels may vary). Even before that, RLS ensures users only see their own data.

## Fastest way to populate real listings

Download your existing Google Sheet **Jobs** tab as a CSV: **File → Download → Comma Separated Values (.csv)**. In the private `/board.html`, use **Import CSV** and choose that file. The import maps the original demo's column names (`Job title`, `Employer`, `Link`, `Location`, `Pay`, `Score`, `Posted`, `Source`, `Status`, `Notes`). Records are saved under your signed-in Supabase user.

You can also manually add a job. This initial implementation does *not* automatically search for jobs; it lets you read/import real records on your phone or at work today.

## Security notes

- The client is permitted to see the **publishable** Supabase key; security comes from Supabase Auth, ownership-scoped RLS, and database permissions.
- Test logged-out access, user isolation, and sign-in redirection before importing sensitive records.
- Do not expose any service role / secret key, `PRIVATE_API_TOKEN`, Google private key, or OpenAI key to frontend JavaScript.
- The earlier Google Sheets endpoint `/api/jobs` remains unconfigured and returns unavailable unless explicitly configured. It is not used by this page.
- The public project source is not a secure place to store personal application data. Data lives in Supabase.
