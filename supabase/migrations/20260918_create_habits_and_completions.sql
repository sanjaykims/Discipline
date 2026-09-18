-- Discipline habit tracker schema
-- Tables backing src/lib/types.ts (Habit, Completion)

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  color text not null default '#6366f1',
  icon text not null default '⭐',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  completed_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_date)
);

alter table public.habits enable row level security;
alter table public.completions enable row level security;

create policy "allow_all_habits" on public.habits for all to public using (true) with check (true);
create policy "allow_all_completions" on public.completions for all to public using (true) with check (true);
