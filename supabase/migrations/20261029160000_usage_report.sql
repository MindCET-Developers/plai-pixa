-- Everything the /report page shows, aggregated in SQL (PostgREST caps plain
-- selects at 1000 rows). Days and hours are Israel time. Totals and breakdowns
-- count from launch_day; the daily series covers all time so the page can
-- show the pilot before launch.
create or replace function public.usage_report(launch_day date)
returns json
language sql
stable
set search_path = public
as $$
  with
  launch as (select (launch_day::timestamp at time zone 'Asia/Jerusalem') as t),
  g as (select * from games where created_at >= (select t from launch)),
  gp as (
    select p.*, (p.joined_at at time zone 'Asia/Jerusalem') as local_time
    from game_players p
    where p.joined_at >= (select t from launch)
  ),
  s as (select * from submissions where created_at >= (select t from launch)),
  r as (select * from reviews where created_at >= (select t from launch) and stars_number is not null),
  per_game as (
    select g.id, g.teacher_id, g.started_at, (g.created_at at time zone 'Asia/Jerusalem')::date as day, count(p.id) as players
    from g left join game_players p on p.game_id = g.id
    group by g.id, g.teacher_id, g.started_at, g.created_at
  ),
  per_teacher as (
    select teacher_id, count(*) as games, count(distinct day) as days
    from per_game where teacher_id is not null group by teacher_id
  ),
  daily as (
    select day, sum(players)::int as players, sum(games)::int as games, sum(submissions)::int as submissions
    from (
      select (joined_at at time zone 'Asia/Jerusalem')::date as day, 1 as players, 0 as games, 0 as submissions from game_players
      union all select (created_at at time zone 'Asia/Jerusalem')::date, 0, 1, 0 from games
      union all select (created_at at time zone 'Asia/Jerusalem')::date, 0, 0, 1 from submissions
    ) x
    group by day
  ),
  weekly as (
    select week_start,
      count(*) filter (where kind = 'game') as games,
      count(*) filter (where kind = 'game' and started) as started,
      count(distinct teacher_id) as teachers,
      count(*) filter (where kind = 'player') as players,
      count(*) filter (where kind = 'submission') as submissions
    from (
      -- Weeks start on Sunday.
      select (day - extract(dow from day)::int) as week_start, 'game' as kind, started_at is not null as started, teacher_id from per_game
      union all select (local_time::date - extract(dow from local_time)::int), 'player', null, null from gp
      union all select ((created_at at time zone 'Asia/Jerusalem')::date - extract(dow from (created_at at time zone 'Asia/Jerusalem'))::int), 'submission', null, null from s
    ) x
    group by week_start
  )
  select json_build_object(
    'summary', json_build_object(
      'games', (select count(*) from g),
      'started', (select count(*) from g where started_at is not null),
      'teachers', (select count(distinct teacher_id) from g),
      'players', (select count(*) from gp),
      'submissions', (select count(*) from s),
      'second_tries', (select count(*) from s where try_number >= 2),
      'avg_score', (select round(avg(score1_number), 1) from s),
      'reviews', (select count(*) from r),
      'avg_stars', (select round(avg(stars_number), 2) from r),
      'median_players', (select percentile_cont(0.5) within group (order by players) from per_game where started_at is not null),
      'max_players', (select max(players) from per_game),
      'teachers_one_game', (select count(*) from per_teacher where games = 1),
      'teachers_two_three', (select count(*) from per_teacher where games between 2 and 3),
      'teachers_four_plus', (select count(*) from per_teacher where games >= 4),
      'teachers_returning', (select count(*) from per_teacher where days > 1),
      'top_teacher_games', (select max(games) from per_teacher)
    ),
    'daily', (select coalesce(json_agg(json_build_object('day', day, 'players', players, 'games', games, 'submissions', submissions) order by day), '[]') from daily),
    'weekly', (select coalesce(json_agg(json_build_object('week_start', week_start, 'games', games, 'started', started, 'teachers', teachers, 'players', players, 'submissions', submissions) order by week_start), '[]') from weekly),
    'hours', (select coalesce(json_agg(json_build_object('hour', hour, 'players', players) order by hour), '[]') from (select extract(hour from local_time)::int as hour, count(*) as players from gp group by 1) x),
    'weekdays', (select coalesce(json_agg(json_build_object('dow', dow, 'players', players) order by dow), '[]') from (select extract(dow from local_time)::int as dow, count(*) as players from gp group by 1) x),
    'devices', (select coalesce(json_object_agg(device, players), '{}') from (select device_used_option_device::text as device, count(*) as players from gp group by 1) x),
    'game_sizes', (select coalesce(json_agg(json_build_object('bucket', bucket, 'games', games) order by low), '[]') from (
      select case when players <= 1 then '1' when players <= 5 then '2–5' when players <= 15 then '6–15' when players <= 30 then '16–30' else '31+' end as bucket,
        min(players) as low, count(*) as games
      from per_game where started_at is not null group by 1) x),
    'scores', (select coalesce(json_agg(json_build_object('upper', upper, 'submissions', submissions) order by upper), '[]') from (
      select least(width_bucket(score1_number, 0, 100, 10), 10) * 10 as upper, count(*) as submissions from s group by 1) x),
    'stars', (select coalesce(json_agg(json_build_object('stars', stars_number, 'students', students, 'teachers', teachers) order by stars_number), '[]') from (
      select stars_number,
        count(*) filter (where reviewr_option_reviewrs = 'student') as students,
        count(*) filter (where reviewr_option_reviewrs = 'teacher') as teachers
      from r group by 1) x),
    'levels', (select coalesce(json_object_agg(level, images), '{}') from (
      select i.level_option_images_level::text as level, count(*) as images
      from game_images gi join g on g.id = gi.game_id join images i on i.id = gi.image_id group by 1) x),
    'failures', (select count(*) from submission_failures where created_at >= (select t from launch)),
    'costs', (select json_build_object(
      'tracked_since', min(created_at),
      'total', coalesce(sum(cost_usd), 0),
      'openrouter', coalesce(sum(cost_usd) filter (where provider = 'openrouter'), 0),
      'runware', coalesce(sum(cost_usd) filter (where provider = 'runware'), 0),
      'student_cost', coalesce(sum(cost_usd) filter (where operation in ('moderation', 'scoring', 'student_image')), 0),
      'student_attempts', count(*) filter (where operation = 'student_image')
    ) from ai_usage)
  );
$$;

revoke execute on function public.usage_report(date) from public, anon, authenticated;
