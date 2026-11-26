import { fail, getGameStateByIdOrCode, ok } from "../../../../../../lib/pixa/api";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const userId = new URL(request.url).searchParams.get("userId");
    const state = await getGameStateByIdOrCode({ id, userId: userId ?? undefined });

    // Student clients pass ?userId= and only need the game row plus their own
    // player row and submissions. Sending the whole roster, every submission
    // and the image list (incl. target prompts) on each poll is what drives
    // Fast Origin Transfer, so trim the response for them.
    if (userId) {
      return ok({
        game: state.game,
        images: [],
        players: (state.players as { user_id: string }[]).filter((player) => player.user_id === userId),
        submissions: (state.submissions as { user_id: string }[]).filter(
          (submission) => submission.user_id === userId,
        ),
        attempts: state.attempts,
      });
    }

    return ok(state);
  } catch (error) {
    return fail(error);
  }
}
