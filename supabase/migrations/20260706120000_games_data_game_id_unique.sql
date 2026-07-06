-- upsertGameData() upserts games_data rows on conflict (game_id), but the
-- initial schema never gave game_id a unique constraint, so every upsert
-- (join/start/next/submit) failed with Postgres error 42P10.
alter table public.games_data
  add constraint games_data_game_id_key unique (game_id);
