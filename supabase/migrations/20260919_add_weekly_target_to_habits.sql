alter table habits add column weekly_target smallint;

-- Gym only needs 2x/week, not a daily checkbox target.
update habits set weekly_target = 2 where name = 'Gym';
