-- PIXA initial Supabase schema.
-- Maps the Pixa-relevant Bubble data model to Postgres while keeping Bubble field
-- names in comments for traceability.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.images_level as enum ('beginners', 'advanced', 'experts', 'mine');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.game_progress as enum ('setup', 'waiting', 'active', 'between_rounds', 'results', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.device_type as enum ('desktop', 'tablet', 'mobile', 'unknown');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.lang as enum ('hebrew', 'arabic', 'english');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.reviewer_type as enum ('teacher', 'student');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.option_school as enum ('other');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  name_text text,
  username_text text,
  avatar_image text,
  saw_boolean boolean not null default false,
  tried_boolean boolean not null default false,
  count_down_date timestamptz,
  mistakes_number integer not null default 4,
  testing_boolean boolean,
  visited_boolean boolean,
  showed_1_boolean boolean,
  final_score_number integer not null default 0,
  statues_video_text text,
  challange_1_boolean boolean not null default false,
  challange_2_boolean boolean not null default false,
  challange_3_boolean boolean not null default false,
  last_logged_in_date timestamptz,
  current_score_number integer not null default 0,
  data_mission_boolean boolean not null default false,
  language_option_lang public.lang not null default 'hebrew',
  finished_tasks_number integer not null default 0,
  finished_time_number integer,
  frost_mission_boolean boolean not null default false,
  mistakes_found_number integer not null default 0,
  pixa_last_logged_date timestamptz,
  visited_frost_boolean boolean not null default false,
  frost_last_logged_date timestamptz,
  pixa_game_count_number integer not null default 0,
  pixels_mission_boolean boolean not null default false,
  puzzle_start_date_date timestamptz,
  flipped_mission_boolean boolean not null default false,
  frost_game_count_number integer not null default 0,
  missions_finished_number integer not null default 0,
  pictures_mission_boolean boolean not null default false,
  admin_permissions_boolean boolean not null default false,
  finished_all_missions_boolean boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.users is 'Bubble User table. Pixa uses this for teachers and anonymous/session students.';
comment on column public.users.name_text is 'Bubble display: Name';
comment on column public.users.avatar_image is 'Bubble display: Avatar';
comment on column public.users.final_score_number is 'Bubble display: final score';
comment on column public.users.current_score_number is 'Bubble display: current score';

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete cascade,
  name_text text,
  email_text text not null,
  school_text text,
  progress_and_players_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auth_user_id)
);

comment on table public.teachers is 'Bubble teacher table.';
comment on column public.teachers.progress_and_players_text is 'Bubble display: progress and players';

create table if not exists public.user_schools (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  school public.option_school not null default 'other',
  created_at timestamptz not null default now(),
  unique (user_id, school)
);

comment on table public.user_schools is 'Join table for Bubble User schools_list_option_school.';

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users(id) on delete set null,
  url_text text not null,
  pic_image text,
  prompt_text text not null,
  back_boolean boolean not null default false,
  source_boolean boolean not null default true,
  level_option_images_level public.images_level not null default 'beginners',
  runware_task_uuid text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.images is 'Bubble image1 table.';
comment on column public.images.url_text is 'Bubble display: url';
comment on column public.images.pic_image is 'Bubble display: pic';
comment on column public.images.prompt_text is 'Bubble display: prompt';
comment on column public.images.back_boolean is 'Bubble display: back';
comment on column public.images.source_boolean is 'Bubble display: source';
comment on column public.images.level_option_images_level is 'Bubble display: level';

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  id_number integer not null unique,
  creator_user_id uuid references public.users(id) on delete set null,
  teacher_id uuid references public.teachers(id) on delete set null,
  game_started_boolean boolean not null default false,
  qr_code_ilan_url_text text,
  created_images_boolean boolean not null default false,
  results_showing_boolean boolean not null default false,
  progress_option_progress public.game_progress not null default 'setup',
  current_image_id uuid references public.images(id) on delete set null,
  qr_code_ilan_custom_image_id uuid references public.images(id) on delete set null,
  current_round_index integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint games_id_number_range check (id_number between 10000 and 99999)
);

comment on table public.games is 'Bubble Game table.';
comment on column public.games.id_number is 'Bubble display: id';
comment on column public.games.creator_user_id is 'Bubble display: creator';
comment on column public.games.game_started_boolean is 'Bubble display: Game Started';
comment on column public.games.qr_code_ilan_url_text is 'Bubble display: qr code ilan url';
comment on column public.games.created_images_boolean is 'Bubble display: created images';
comment on column public.games.results_showing_boolean is 'Bubble display: results showing';
comment on column public.games.progress_option_progress is 'Bubble display: progress';
comment on column public.games.current_image_id is 'Bubble display: current Image';
comment on column public.games.qr_code_ilan_custom_image_id is 'Bubble display: qr code ilan';

create table if not exists public.game_images (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  image_id uuid not null references public.images(id) on delete restrict,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (game_id, image_id),
  unique (game_id, position),
  constraint game_images_position_range check (position between 1 and 2)
);

comment on table public.game_images is 'Join table for Bubble Game images_list_custom_image.';

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  device_used_option_device public.device_type not null default 'unknown',
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz,
  unique (game_id, user_id)
);

comment on table public.game_players is 'Bubble players_list_user plus players.device_used_option_device.';

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  tip_text text,
  user_id uuid not null references public.users(id) on delete cascade,
  score_text text,
  try_number integer not null default 0,
  image_id uuid references public.images(id) on delete set null,
  score1_number integer not null default 0,
  game_id uuid not null references public.games(id) on delete cascade,
  target_image_id uuid not null references public.images(id) on delete restrict,
  sent_prompt_text text not null,
  revised_prompt_text text,
  generated_image_url_text text,
  translated_prompt_text text,
  image_comparison_score integer,
  prompt_comparison_score integer,
  score_breakdown_text text,
  ai_raw_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, user_id, target_image_id)
);

comment on table public.submissions is 'Bubble submition table. A second attempt replaces the prior row per game/user/image.';
comment on column public.submissions.tip_text is 'Bubble display: tip';
comment on column public.submissions.user_id is 'Bubble display: user';
comment on column public.submissions.score_text is 'Bubble display: score';
comment on column public.submissions.try_number is 'Bubble display: try';
comment on column public.submissions.image_id is 'Bubble display: image (generated/student image)';
comment on column public.submissions.score1_number is 'Bubble display: score1';
comment on column public.submissions.game_id is 'Bubble display: game';
comment on column public.submissions.sent_prompt_text is 'Bubble display: sent prompt';
comment on column public.submissions.revised_prompt_text is 'Bubble display: revised prompt';

create table if not exists public.banned_words (
  id uuid primary key default gen_random_uuid(),
  word_text text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.banned_words is 'Custom banned_words used by Bubble moderation prompts.';

create table if not exists public.bad_prompts (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete set null,
  user_id uuid references public.users(id) on delete set null,
  prompt_text text not null,
  reason_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  stars_number integer,
  reviewr_option_reviewrs public.reviewer_type not null,
  message_text text,
  created_at timestamptz not null default now(),
  constraint reviews_stars_range check (stars_number is null or stars_number between 1 and 5)
);

comment on table public.reviews is 'Bubble reviews table.';
comment on column public.reviews.reviewr_option_reviewrs is 'Bubble display: reviewr';

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name_text text,
  email_text text,
  message_text text not null,
  created_at timestamptz not null default now()
);

comment on table public.feedback is 'Bubble feedback table.';

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  pdf_file_file text,
  tested_number integer not null default 0,
  pressed_number integer not null default 0,
  cameback_number integer not null default 0,
  visits_count_number integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.visits is 'Bubble visits table.';

create table if not exists public.games_data (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  teacher_id uuid references public.teachers(id) on delete set null,
  id_number integer,
  players_count_number integer not null default 0,
  submissions_count_number integer not null default 0,
  started_at timestamptz,
  finished_at timestamptz,
  duration_seconds integer,
  progress_option_progress public.game_progress,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.games_data is 'Pixa analytics table extracted from Bubble dashboard requirements.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_teachers_updated_at on public.teachers;
create trigger set_teachers_updated_at before update on public.teachers
for each row execute function public.set_updated_at();

drop trigger if exists set_images_updated_at on public.images;
create trigger set_images_updated_at before update on public.images
for each row execute function public.set_updated_at();

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at before update on public.games
for each row execute function public.set_updated_at();

drop trigger if exists set_submissions_updated_at on public.submissions;
create trigger set_submissions_updated_at before update on public.submissions
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.user_schools enable row level security;
alter table public.images enable row level security;
alter table public.games enable row level security;
alter table public.game_images enable row level security;
alter table public.game_players enable row level security;
alter table public.submissions enable row level security;
alter table public.banned_words enable row level security;
alter table public.bad_prompts enable row level security;
alter table public.reviews enable row level security;
alter table public.feedback enable row level security;
alter table public.visits enable row level security;
alter table public.games_data enable row level security;

create policy "Teachers can read own teacher profile"
on public.teachers for select
using (auth.uid() = auth_user_id);

create policy "Teachers can upsert own teacher profile"
on public.teachers for all
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

create policy "Authenticated users can read public image bank"
on public.images for select
using (source_boolean = true or auth.uid() is not null);

create policy "Authenticated users can insert own generated images"
on public.images for insert
with check (auth.uid() is not null);

create policy "Teachers can read their games"
on public.games for select
using (
  exists (
    select 1 from public.teachers t
    where t.id = games.teacher_id and t.auth_user_id = auth.uid()
  )
);

create policy "Teachers can manage their games"
on public.games for all
using (
  exists (
    select 1 from public.teachers t
    where t.id = games.teacher_id and t.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.teachers t
    where t.id = games.teacher_id and t.auth_user_id = auth.uid()
  )
);

create policy "Service role manages runtime game rows"
on public.game_players for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role manages submissions"
on public.submissions for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Anyone can send feedback"
on public.feedback for insert
with check (true);

create index if not exists games_id_number_idx on public.games(id_number);
create index if not exists game_players_game_id_idx on public.game_players(game_id);
create index if not exists submissions_game_target_idx on public.submissions(game_id, target_image_id);
create index if not exists images_level_source_idx on public.images(level_option_images_level, source_boolean);
create unique index if not exists images_url_text_unique_idx on public.images(url_text);
create unique index if not exists users_auth_user_id_unique_idx on public.users(auth_user_id);
create unique index if not exists games_data_game_id_unique_idx on public.games_data(game_id);

do $$
begin
  alter publication supabase_realtime add table public.games;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.game_players;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.submissions;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
