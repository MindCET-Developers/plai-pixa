-- A student gets two attempts per image. Until now the second attempt overwrote
-- the first (image, prompt and score), so a worse second try silently cost points.
-- Both attempts are now kept here, and the student chooses which one counts.
--
-- public.submissions stays the single row per (game, user, image) that the host
-- board and leaderboard read: it mirrors the *selected* attempt, while try_number
-- keeps meaning "attempts used" (the limit check relies on it).
create table if not exists public.submission_attempts (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  target_image_id uuid not null references public.images(id) on delete restrict,
  try_number integer not null check (try_number between 1 and 2),
  sent_prompt_text text not null,
  translated_prompt_text text,
  generated_image_url_text text,
  tip_text text,
  score_text text,
  score1_number integer not null default 0,
  image_comparison_score integer,
  prompt_comparison_score integer,
  score_breakdown_text text,
  ai_raw_json jsonb,
  created_at timestamptz not null default now(),
  unique (game_id, user_id, target_image_id, try_number)
);

alter table public.submissions
  add column if not exists selected_try_number integer;

comment on column public.submissions.selected_try_number is
  'Which attempt (1 or 2) this row mirrors and the score is counted from. NULL on rows from before attempts were kept: treat as try_number.';

-- Written and read only through the service-role admin client.
alter table public.submission_attempts enable row level security;
