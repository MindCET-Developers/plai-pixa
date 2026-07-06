export type GameProgress = "setup" | "waiting" | "active" | "between_rounds" | "results" | "closed";

export type GameRow = {
  id: string;
  id_number: number;
  progress_option_progress: GameProgress;
  current_image_id: string | null;
  current_round_index: number;
  results_showing_boolean: boolean;
};

export type GameImageWithImage = {
  image_id: string;
  position: number;
  image: { id: string; url_text: string; prompt_text: string } | null;
};

export type PlayerUser = {
  id: string;
  name_text: string | null;
  avatar_image: string | null;
  current_score_number: number;
  final_score_number: number;
};

export type PlayerRow = {
  id: string;
  user_id: string;
  user: PlayerUser | null;
};

export type SubmissionUser = {
  id: string;
  name_text: string | null;
  avatar_image: string | null;
  final_score_number: number;
};

export type SubmissionRow = {
  id: string;
  user_id: string;
  target_image_id: string;
  try_number: number;
  tip_text: string | null;
  score_text: string | null;
  generated_image_url_text: string | null;
  sent_prompt_text: string;
  user: SubmissionUser | null;
};

export type GameState = {
  game: GameRow;
  images: GameImageWithImage[];
  players: PlayerRow[];
  submissions: SubmissionRow[];
};
