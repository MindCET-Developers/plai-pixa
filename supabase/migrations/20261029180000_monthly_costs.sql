-- Per calendar month (Israel time): student attempts, which drive AI spend
-- (each attempt is one generated image plus moderation and scoring; a second
-- attempt replaces the first row, so it is counted from try_number), and the
-- spend actually recorded in ai_usage.
create or replace function public.monthly_costs()
returns json
language sql
stable
set search_path = public
as $$
  with
  attempts as (
    select date_trunc('month', created_at at time zone 'Asia/Jerusalem')::date as month,
      count(*) + count(*) filter (where try_number >= 2) as attempts
    from submissions group by 1
  ),
  tracked as (
    select date_trunc('month', created_at at time zone 'Asia/Jerusalem')::date as month,
      sum(cost_usd) as tracked_usd,
      count(*) filter (where operation = 'student_image') as tracked_attempts
    from ai_usage group by 1
  )
  select coalesce(json_agg(json_build_object(
    'month', month,
    'attempts', coalesce(attempts, 0),
    'tracked_usd', tracked_usd,
    'tracked_attempts', coalesce(tracked_attempts, 0)
  ) order by month), '[]')
  from attempts full join tracked using (month);
$$;

revoke execute on function public.monthly_costs() from public, anon, authenticated;
