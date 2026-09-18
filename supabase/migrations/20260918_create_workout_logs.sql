-- Workout tab: free-form log entries (date + text), separate from the
-- boolean habit/completions model. Backs src/app/workout/page.tsx.

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  content text not null,
  muscles text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.workout_logs enable row level security;

create policy "allow_all_workout_logs" on public.workout_logs for all to public using (true) with check (true);

-- Free-text notes on individual habit completions (e.g. gym session detail
-- logged inline from the Today tab).
alter table public.completions add column if not exists notes text;
