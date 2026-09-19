create table habit_weekly_overrides (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  week_start date not null,
  target smallint not null,
  created_at timestamptz not null default now(),
  unique (habit_id, week_start)
);

-- Gym: only 1x needed for the week already in progress (Sun 2026-09-13 - Sat 2026-09-19).
-- No override for future weeks, so they fall back to habits.weekly_target (2), starting Sun 2026-09-20.
insert into habit_weekly_overrides (habit_id, week_start, target)
select id, '2026-09-13', 1 from habits where name = 'Gym';
