# PLAI / PIXA

Next.js rebuild of the Bubble PIXA game. The app is RTL-first, uses Supabase
for auth/data/realtime, OpenRouter for text and vision feedback, and Runware
for image generation.

## Getting Started

Copy `.env.example` to `.env.local`, fill in the Supabase/OpenRouter/Runware
values, then run:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Supabase migrations live in `supabase/migrations`.

Apply the initial PIXA schema to a Supabase project with the Supabase CLI:

```bash
supabase db push
```

The initial migration creates the Pixa-relevant Bubble tables as Postgres
tables: `games`, `users`, `teachers`, `images`, `game_players`,
`submissions`, `banned_words`, `bad_prompts`, `reviews`, `feedback`,
`visits`, and `games_data`.

## Scripts

- `npm run dev` - local dev server
- `npm run typecheck` - TypeScript validation
- `npm run lint` - ESLint
- `npm run build` - production build
- `npm run smoke:ai` - live OpenRouter and Runware smoke test
- `npm run import:translations` - import Arabic translations from CSV

## Environment

Never commit real API keys. Use `.env.local` locally and Vercel environment
variables in production. The service role key is server-only.
