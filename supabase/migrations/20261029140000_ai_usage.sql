-- Cost of every paid AI call (OpenRouter text/vision, Runware images), as
-- reported by the provider in its response, so spend can be tracked per day,
-- per provider and per student attempt on the admin dashboard.
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('openrouter', 'runware')),
  operation text not null check (operation in ('moderation', 'scoring', 'student_image', 'teacher_prompt', 'teacher_image')),
  model text not null,
  -- USD; null when the provider did not report a cost for the call.
  cost_usd numeric(12, 8),
  game_id uuid references public.games(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_created_at_idx on public.ai_usage (created_at desc);

-- Written and read only through the service-role admin client.
alter table public.ai_usage enable row level security;

-- Aggregated in SQL because PostgREST caps plain selects at 1000 rows.
create or replace function public.ai_cost_summary()
returns json
language sql
stable
set search_path = public
as $$
  select json_build_object(
    'last_day', coalesce(sum(cost_usd) filter (where created_at >= now() - interval '1 day'), 0),
    'last_week', coalesce(sum(cost_usd) filter (where created_at >= now() - interval '7 days'), 0),
    'last_month', coalesce(sum(cost_usd) filter (where created_at >= now() - interval '30 days'), 0),
    'month_openrouter', coalesce(sum(cost_usd) filter (where created_at >= now() - interval '30 days' and provider = 'openrouter'), 0),
    'month_runware', coalesce(sum(cost_usd) filter (where created_at >= now() - interval '30 days' and provider = 'runware'), 0),
    'month_student_cost', coalesce(sum(cost_usd) filter (where created_at >= now() - interval '30 days' and operation in ('moderation', 'scoring', 'student_image')), 0),
    'month_student_attempts', count(*) filter (where created_at >= now() - interval '30 days' and operation = 'student_image'),
    'month_unpriced_calls', count(*) filter (where created_at >= now() - interval '30 days' and cost_usd is null),
    'tracked_since', min(created_at)
  )
  from public.ai_usage;
$$;

revoke execute on function public.ai_cost_summary() from public, anon, authenticated;
