-- requireTeacher() upserts public.users rows on conflict (auth_user_id), but
-- the initial schema never made auth_user_id unique, so every teacher API call
-- (createGame, generateTeacherImage, ...) failed with Postgres error 42P10.
-- Anonymous students keep auth_user_id NULL, and Postgres allows multiple
-- NULLs in a unique constraint, so they are unaffected.
alter table public.users
  add constraint users_auth_user_id_key unique (auth_user_id);
