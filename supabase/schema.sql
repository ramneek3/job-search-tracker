-- Pipeline schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Every row belongs to one user, enforced by Row-Level Security — the anon key
-- in the browser can never read or write anyone else's applications.

create type application_stage as enum ('wishlist', 'applied', 'oa', 'interview', 'offer', 'rejected');
create type application_source as enum ('linkedin', 'company_site', 'referral', 'handshake', 'indeed', 'other');

create table public.applications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company       text not null check (char_length(company) between 1 and 100),
  role          text not null check (char_length(role) between 1 and 120),
  stage         application_stage not null default 'applied',
  source        application_source not null default 'other',
  url           text,
  location      text,
  compensation  text,
  applied_at    date,
  deadline      date,
  follow_up_at  date,
  contact_name  text,
  contact_email text,
  notes         text check (char_length(notes) <= 2000),
  position      double precision not null default 0,
  history       jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index applications_user_stage_position on public.applications (user_id, stage, position);

-- Keep updated_at honest regardless of what the client sends.
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger applications_touch before update on public.applications
  for each row execute function public.touch_updated_at();

alter table public.applications enable row level security;

create policy "read own"   on public.applications for select using (auth.uid() = user_id);
create policy "insert own" on public.applications for insert with check (auth.uid() = user_id);
create policy "update own" on public.applications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own" on public.applications for delete using (auth.uid() = user_id);
