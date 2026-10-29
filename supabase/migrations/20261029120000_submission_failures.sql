-- submitPrompt() calls OpenRouter and Runware before saving a submission. When
-- one of them failed (e.g. Runware between 2026-10-13 and 2026-10-25) nothing
-- was recorded, so the outage went unnoticed. Each failed attempt is now
-- logged here and surfaced on the admin dashboard.
create table if not exists public.submission_failures (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  stage text not null check (stage in ('moderation', 'image_generation', 'scoring', 'save')),
  error_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists submission_failures_created_at_idx
  on public.submission_failures (created_at desc);

-- Written and read only through the service-role admin client.
alter table public.submission_failures enable row level security;
