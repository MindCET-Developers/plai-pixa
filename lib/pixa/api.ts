import { z } from "zod";
import { createAdminClient } from "../supabase/admin";
import { createClient as createServerSupabaseClient } from "../supabase/server";
import type { Database, Tables } from "../supabase/database.types";
import {
  createTeacherImagePrompt,
  moderateAndTranslatePrompt,
  scoreStudentImage,
  translateOrFixPrompt,
} from "../ai/openrouter";
import { generateImage } from "../ai/runware";

type SupabaseAdmin = ReturnType<typeof createAdminClient>;
type GameProgress = Database["public"]["Enums"]["game_progress"];

const uuidSchema = z.string().uuid();
const deviceSchema = z.enum(["desktop", "tablet", "mobile", "unknown"]);
const levelSchema = z.enum(["beginners", "advanced", "experts", "mine"]);

export const createGameSchema = z.object({
  imageIds: z.array(uuidSchema).min(1).max(2),
  teacher: z
    .object({
      school: z.string().trim().optional(),
    })
    .optional(),
  studentBaseUrl: z.string().url().optional(),
});

export const joinGameSchema = z.object({
  code: z.coerce.number().int().min(10000).max(99999),
  name: z.string().trim().min(1).max(80),
  avatar: z.string().url().optional(),
  device: deviceSchema.default("unknown"),
});

export const submitPromptSchema = z
  .object({
    gameId: uuidSchema.optional(),
    code: z.coerce.number().int().min(10000).max(99999).optional(),
    userId: uuidSchema,
    prompt: z.string().trim().min(2).max(2000),
  })
  .refine((value) => value.gameId !== undefined || value.code !== undefined, {
    message: "Either gameId or code is required.",
    path: ["gameId"],
  });

export const submitReviewSchema = z.object({
  gameId: uuidSchema,
  userId: uuidSchema.optional(),
  stars: z.coerce.number().int().min(1).max(5).optional(),
  message: z.string().trim().max(1000).optional(),
  reviewer: z.enum(["teacher", "student"]).default("student"),
});

export const generateTeacherImageSchema = z.object({
  topic: z.string().trim().min(1).max(120),
  grade: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(1000),
  level: levelSchema.default("mine"),
});

export const listImagesQuerySchema = z.object({
  level: levelSchema.default("beginners"),
});

export const createImageSchema = z.object({
  url: z.string().url(),
  prompt: z.string().trim().min(1).max(4000),
  level: levelSchema.default("mine"),
  source: z.boolean().default(false),
  picImage: z.string().url().optional(),
});

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json({ ok: true, data }, init);
}

export function fail(error: unknown) {
  if (error instanceof z.ZodError) {
    return Response.json(
      { ok: false, error: "Invalid request body.", issues: error.issues },
      { status: 422 },
    );
  }

  if (error instanceof ApiError) {
    return Response.json({ ok: false, error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return Response.json({ ok: false, error: message }, { status: 500 });
}

export async function requireTeacher() {
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await authClient.auth.getUser();

  if (error || !user?.email) throw new ApiError("Teacher sign-in is required.", 401);

  const admin = createAdminClient();
  const displayName =
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email.split("@")[0] ?? null;

  const { data: pixaUser, error: userError } = await admin
    .from("users")
    .upsert(
      {
        auth_user_id: user.id,
        name_text: displayName,
        username_text: user.email,
        avatar_image: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
        pixa_last_logged_date: new Date().toISOString(),
      },
      { onConflict: "auth_user_id" },
    )
    .select()
    .single();

  if (userError) throw userError;

  const { data: teacher, error: teacherError } = await admin
    .from("teachers")
    .upsert(
      {
        auth_user_id: user.id,
        user_id: pixaUser.id,
        email_text: user.email,
        name_text: displayName,
      },
      { onConflict: "auth_user_id" },
    )
    .select()
    .single();

  if (teacherError) throw teacherError;

  return { admin, authUser: user, pixaUser, teacher };
}

export function parseRequest<T>(schema: z.ZodType<T>, request: Request) {
  return request.json().then((body) => schema.parse(body));
}

export async function createGame(request: Request) {
  const body = await parseRequest(createGameSchema, request);
  const { admin, pixaUser, teacher } = await requireTeacher();

  const { data: images, error: imagesError } = await admin
    .from("images")
    .select("id")
    .in("id", body.imageIds);

  if (imagesError) throw imagesError;
  if ((images?.length ?? 0) !== body.imageIds.length) {
    throw new ApiError("One or more selected images were not found.", 404);
  }

  const idNumber = await generateUniqueGameCode(admin);
  const studentUrl = new URL(body.studentBaseUrl ?? `${new URL(request.url).origin}/pixa/play`);
  studentUrl.searchParams.set("ids", String(idNumber));

  const { data: game, error: gameError } = await admin
    .from("games")
    .insert({
      id_number: idNumber,
      creator_user_id: pixaUser.id,
      teacher_id: teacher.id,
      progress_option_progress: "waiting",
      qr_code_ilan_url_text: studentUrl.toString(),
      current_image_id: body.imageIds[0],
      current_round_index: 0,
    })
    .select()
    .single();

  if (gameError) throw gameError;

  const gameImages = body.imageIds.map((imageId, index) => ({
    game_id: game.id,
    image_id: imageId,
    position: index + 1,
  }));
  const { error: gameImagesError } = await admin.from("game_images").insert(gameImages);
  if (gameImagesError) throw gameImagesError;

  await upsertGameData(admin, game.id);

  return {
    game,
    code: idNumber,
    joinUrl: studentUrl.toString(),
  };
}

export async function joinGame(request: Request) {
  const body = await parseRequest(joinGameSchema, request);
  const admin = createAdminClient();
  const game = await getGameByCode(admin, body.code);

  if (game.progress_option_progress === "closed" || game.progress_option_progress === "results") {
    throw new ApiError("This game is no longer open for joining.", 409);
  }

  const avatar =
    body.avatar ??
    `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(body.name)}`;

  const { data: user, error: userError } = await admin
    .from("users")
    .insert({
      name_text: body.name,
      username_text: body.name,
      avatar_image: avatar,
      pixa_last_logged_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) throw userError;

  const { error: playerError } = await admin.from("game_players").upsert(
    {
      game_id: game.id,
      user_id: user.id,
      device_used_option_device: body.device,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "game_id,user_id" },
  );

  if (playerError) throw playerError;
  await upsertGameData(admin, game.id);

  return { game, user };
}

export async function startGame(gameId: string) {
  const { admin } = await requireTeacher();
  const game = await getTeacherGame(admin, gameId);
  const images = await getGameImages(admin, game.id);
  const firstImage = images[0];

  if (!firstImage) throw new ApiError("Cannot start a game without images.", 409);
  if (game.progress_option_progress !== "waiting" && game.progress_option_progress !== "setup") {
    throw new ApiError("Only waiting games can be started.", 409);
  }

  const { data, error } = await admin
    .from("games")
    .update({
      game_started_boolean: true,
      progress_option_progress: "active",
      current_image_id: firstImage.image_id,
      current_round_index: 0,
      started_at: new Date().toISOString(),
      results_showing_boolean: false,
    })
    .eq("id", game.id)
    .select()
    .single();

  if (error) throw error;
  await upsertGameData(admin, game.id);
  return { game: data };
}

export async function advanceGame(gameId: string) {
  const { admin } = await requireTeacher();
  const game = await getTeacherGame(admin, gameId);
  const images = await getGameImages(admin, game.id);
  const nextIndex = game.current_round_index + 1;
  const nextImage = images[nextIndex];

  const update =
    nextImage === undefined
      ? {
          progress_option_progress: "results" as GameProgress,
          results_showing_boolean: true,
          current_image_id: null,
          finished_at: new Date().toISOString(),
        }
      : {
          progress_option_progress: "active" as GameProgress,
          results_showing_boolean: false,
          current_image_id: nextImage.image_id,
          current_round_index: nextIndex,
        };

  const { data, error } = await admin.from("games").update(update).eq("id", game.id).select().single();
  if (error) throw error;
  await upsertGameData(admin, game.id);
  return { game: data, finished: nextImage === undefined };
}

export async function getGameStateByIdOrCode(input: { id?: string; code?: number }) {
  const admin = createAdminClient();
  const game = input.id
    ? await getGameById(admin, input.id)
    : input.code
      ? await getGameByCode(admin, input.code)
      : null;

  if (!game) throw new ApiError("Game id or code is required.", 422);

  const [images, players, submissions] = await Promise.all([
    getGameImagesWithImage(admin, game.id),
    getGamePlayers(admin, game.id),
    getGameSubmissions(admin, game.id),
  ]);

  return { game, images, players, submissions };
}

export async function submitPrompt(request: Request) {
  const body = await parseRequest(submitPromptSchema, request);
  const admin = createAdminClient();
  const game = body.gameId ? await getGameById(admin, body.gameId) : await getGameByCode(admin, body.code!);

  if (game.progress_option_progress !== "active" || !game.current_image_id) {
    throw new ApiError("The game is not currently accepting submissions.", 409);
  }

  const { data: player } = await admin
    .from("game_players")
    .select("id")
    .eq("game_id", game.id)
    .eq("user_id", body.userId)
    .maybeSingle();

  if (!player) throw new ApiError("The student has not joined this game.", 403);

  const { data: targetImage, error: imageError } = await admin
    .from("images")
    .select("*")
    .eq("id", game.current_image_id)
    .single();

  if (imageError) throw imageError;

  const { data: bannedRows, error: bannedError } = await admin.from("banned_words").select("word_text");
  if (bannedError) throw bannedError;

  const moderation = await moderateAndTranslatePrompt({
    prompt: body.prompt,
    bannedWords: (bannedRows ?? []).map((row) => row.word_text),
  });

  if (moderation.flag === "no") {
    await admin.from("bad_prompts").insert({
      game_id: game.id,
      user_id: body.userId,
      prompt_text: body.prompt,
      reason_text: "OpenRouter moderation returned flag=no",
    });
    throw new ApiError("יש תוכן לא ראוי בפרומפט, תקן אותו ונסה שוב.", 422);
  }

  const existing = await getExistingSubmission(admin, game.id, body.userId, game.current_image_id);
  if ((existing?.try_number ?? 0) >= 2) {
    throw new ApiError("Only two attempts are allowed for this image.", 409);
  }

  const generated = await generateImage(moderation.translated_prompt);
  const score = await scoreStudentImage({
    targetImageUrl: targetImage.url_text,
    studentImageUrl: generated.imageURL,
    originalPrompt: targetImage.prompt_text,
    studentPrompt: moderation.translated_prompt,
  });

  const nextTry = existing ? existing.try_number + 1 : 1;
  const submissionPayload = {
    game_id: game.id,
    user_id: body.userId,
    target_image_id: game.current_image_id,
    image_id: null,
    sent_prompt_text: body.prompt,
    revised_prompt_text: nextTry > 1 ? body.prompt : null,
    translated_prompt_text: moderation.translated_prompt,
    generated_image_url_text: generated.imageURL,
    tip_text: score.feedback,
    score_text: score.score,
    score1_number: Number(score.score),
    image_comparison_score: score.image_comparison_score,
    prompt_comparison_score: score.prompt_comparison_score,
    score_breakdown_text: score.score_breakdown,
    ai_raw_json: score,
    try_number: nextTry,
  };

  const { data: submission, error: upsertError } = await admin
    .from("submissions")
    .upsert(submissionPayload, { onConflict: "game_id,user_id,target_image_id" })
    .select()
    .single();

  if (upsertError) throw upsertError;

  const previousScore = existing?.score1_number ?? 0;
  await updateUserScores(admin, body.userId, Number(score.score) - previousScore);
  await upsertGameData(admin, game.id);

  return { submission, moderation, score };
}

export async function submitReview(request: Request) {
  const body = await parseRequest(submitReviewSchema, request);
  const admin = createAdminClient();
  await getGameById(admin, body.gameId);

  const { data, error } = await admin
    .from("reviews")
    .insert({
      game_id: body.gameId,
      user_id: body.userId ?? null,
      stars_number: body.stars ?? null,
      message_text: body.message ?? null,
      reviewr_option_reviewrs: body.reviewer,
    })
    .select()
    .single();

  if (error) throw error;
  return { review: data };
}

export async function generateTeacherImage(request: Request) {
  const body = await parseRequest(generateTeacherImageSchema, request);
  const { admin, pixaUser } = await requireTeacher();
  const prompt = await createTeacherImagePrompt(body);
  const image = await generateImage(prompt);

  const { data, error } = await admin
    .from("images")
    .insert({
      owner_user_id: pixaUser.id,
      url_text: image.imageURL,
      pic_image: image.imageURL,
      prompt_text: prompt,
      source_boolean: false,
      level_option_images_level: body.level,
      runware_task_uuid: image.taskUUID,
    })
    .select()
    .single();

  if (error) throw error;
  return { image: data, prompt, runware: image };
}

export async function listImages(request: Request) {
  const url = new URL(request.url);
  const { level } = listImagesQuerySchema.parse({
    level: url.searchParams.get("level") ?? undefined,
  });
  const admin = createAdminClient();

  if (level === "mine") {
    const { pixaUser } = await requireTeacher();
    const { data, error } = await admin
      .from("images")
      .select("*")
      .eq("owner_user_id", pixaUser.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { images: data };
  }

  const { data, error } = await admin
    .from("images")
    .select("*")
    .eq("level_option_images_level", level)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) throw error;
  return { images: data };
}

export async function createImage(request: Request) {
  const body = await parseRequest(createImageSchema, request);
  const { admin, pixaUser } = await requireTeacher();
  const prompt = await translateOrFixPrompt(body.prompt);

  const { data, error } = await admin
    .from("images")
    .insert({
      owner_user_id: pixaUser.id,
      url_text: body.url,
      pic_image: body.picImage ?? body.url,
      prompt_text: prompt,
      source_boolean: body.source,
      level_option_images_level: body.level,
    })
    .select()
    .single();

  if (error) throw error;
  return { image: data };
}

async function generateUniqueGameCode(admin: SupabaseAdmin) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Math.floor(10000 + Math.random() * 90000);
    const { data, error } = await admin.from("games").select("id").eq("id_number", code).maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new ApiError("Could not allocate a unique game code.", 500);
}

async function getGameByCode(admin: SupabaseAdmin, code: number) {
  const { data, error } = await admin.from("games").select("*").eq("id_number", code).single();
  if (error) throw new ApiError("Game was not found.", 404);
  return data;
}

async function getGameById(admin: SupabaseAdmin, id: string) {
  const { data, error } = await admin.from("games").select("*").eq("id", id).single();
  if (error) throw new ApiError("Game was not found.", 404);
  return data;
}

async function getTeacherGame(admin: SupabaseAdmin, gameId: string) {
  const { teacher } = await requireTeacher();
  const { data, error } = await admin
    .from("games")
    .select("*")
    .eq("id", gameId)
    .eq("teacher_id", teacher.id)
    .single();

  if (error) throw new ApiError("Game was not found for this teacher.", 404);
  return data;
}

async function getGameImages(admin: SupabaseAdmin, gameId: string) {
  const { data, error } = await admin
    .from("game_images")
    .select("*")
    .eq("game_id", gameId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

async function getGameImagesWithImage(admin: SupabaseAdmin, gameId: string) {
  const { data, error } = await admin
    .from("game_images")
    .select("*, image:images(*)")
    .eq("game_id", gameId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

async function getGamePlayers(admin: SupabaseAdmin, gameId: string) {
  const { data, error } = await admin
    .from("game_players")
    .select("*, user:users(id, name_text, username_text, avatar_image, current_score_number, final_score_number)")
    .eq("game_id", gameId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return data;
}

async function getGameSubmissions(admin: SupabaseAdmin, gameId: string) {
  const { data, error } = await admin
    .from("submissions")
    .select("*")
    .eq("game_id", gameId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

async function getExistingSubmission(
  admin: SupabaseAdmin,
  gameId: string,
  userId: string,
  targetImageId: string,
) {
  const { data, error } = await admin
    .from("submissions")
    .select("*")
    .eq("game_id", gameId)
    .eq("user_id", userId)
    .eq("target_image_id", targetImageId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function updateUserScores(admin: SupabaseAdmin, userId: string, scoreDelta: number) {
  const { data: user, error: getError } = await admin
    .from("users")
    .select("current_score_number, final_score_number")
    .eq("id", userId)
    .single();

  if (getError) throw getError;

  const nextScore = Math.max(0, (user.current_score_number ?? 0) + scoreDelta);
  const { error } = await admin
    .from("users")
    .update({
      current_score_number: nextScore,
      final_score_number: nextScore,
    })
    .eq("id", userId);

  if (error) throw error;
}

async function upsertGameData(admin: SupabaseAdmin, gameId: string) {
  const [{ data: game, error: gameError }, { count: playersCount, error: playersError }, { count: submissionsCount, error: submissionsError }] =
    await Promise.all([
      admin.from("games").select("*").eq("id", gameId).single(),
      admin.from("game_players").select("id", { count: "exact", head: true }).eq("game_id", gameId),
      admin.from("submissions").select("id", { count: "exact", head: true }).eq("game_id", gameId),
    ]);

  if (gameError) throw gameError;
  if (playersError) throw playersError;
  if (submissionsError) throw submissionsError;

  const durationSeconds =
    game.started_at && game.finished_at
      ? Math.max(0, Math.round((Date.parse(game.finished_at) - Date.parse(game.started_at)) / 1000))
      : null;

  const row = {
    game_id: game.id,
    teacher_id: game.teacher_id,
    id_number: game.id_number,
    players_count_number: playersCount ?? 0,
    submissions_count_number: submissionsCount ?? 0,
    started_at: game.started_at,
    finished_at: game.finished_at,
    duration_seconds: durationSeconds,
    progress_option_progress: game.progress_option_progress,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin.from("games_data").upsert(row, { onConflict: "game_id" });
  if (error) throw error;
}

export type GameState = Awaited<ReturnType<typeof getGameStateByIdOrCode>>;
export type GameRow = Tables<"games">;
