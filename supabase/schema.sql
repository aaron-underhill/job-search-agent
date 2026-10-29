-- Run in the SQL editor for YOUR Supabase project.
-- Every job belongs to the signed-in user. Never turn off RLS.
create extension if not exists pgcrypto;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  employer text not null check (char_length(employer) between 1 and 300),
  url text not null check (char_length(url) between 8 and 2048),
  location text not null default '',
  pay text not null default '',
  score integer check (score between 0 and 100),
  posted_at text not null default '',
  source text not null default '',
  status text not null default 'Found',
  notes text not null default '',
  discovered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,url)
);

create index if not exists jobs_owner_discovered_idx
  on public.jobs(owner_id, discovered_at desc);

alter table public.jobs enable row level security;

drop policy if exists "Owner can read jobs" on public.jobs;
create policy "Owner can read jobs" on public.jobs
  for select to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "Owner can insert jobs" on public.jobs;
create policy "Owner can insert jobs" on public.jobs
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner can update jobs" on public.jobs;
create policy "Owner can update jobs" on public.jobs
  for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

drop policy if exists "Owner can delete jobs" on public.jobs;
create policy "Owner can delete jobs" on public.jobs
  for delete to authenticated using (owner_id = (select auth.uid()));

-- No public/anon policies. Even with a publishable key, anonymous visitors
-- cannot read or write jobs. Test RLS before importing private data.
