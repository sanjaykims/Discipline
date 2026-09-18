-- Add numeric hours_slept field to completions, so sleep duration can be
-- tracked over time rather than only logged as a pass/fail against the
-- "Slept 6+ hrs" habit threshold.
alter table completions add column if not exists hours_slept numeric(3,1);
