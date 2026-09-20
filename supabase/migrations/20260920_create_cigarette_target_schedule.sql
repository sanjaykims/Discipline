-- A dated step-down schedule for the daily cigarette target. On any given
-- day, the applicable target is the most recent row with effective_date <=
-- that day; if none exists yet, the app falls back to the baseline constant
-- (CIGARETTE_TARGET = 9 in src/lib/constants.ts).
create table cigarette_target_schedule (
  id uuid primary key default gen_random_uuid(),
  effective_date date not null unique,
  daily_target smallint not null check (daily_target >= 0),
  created_at timestamptz not null default now()
);

-- Plan set 2026-09-20: 9/day baseline (unchanged, via fallback) through
-- Sun 2026-09-27, 8/day starting Mon 2026-09-21, 7/day starting the
-- following Mon 2026-09-28.
insert into cigarette_target_schedule (effective_date, daily_target) values
  ('2026-09-21', 8),
  ('2026-09-28', 7);
