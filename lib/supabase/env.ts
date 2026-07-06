function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseBrowserEnv() {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseAdminEnv() {
  return {
    url: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    serviceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getOpenRouterEnv() {
  return {
    apiKey: readEnv("OPENROUTER_API_KEY"),
    textModel: process.env.OPENROUTER_TEXT_MODEL || "google/gemini-2.5-flash",
    visionModel: process.env.OPENROUTER_VISION_MODEL || "google/gemini-2.5-flash",
    siteUrl: process.env.PUBLIC_APP_URL || "http://localhost:3000",
    appTitle: "PIXA",
  };
}

export function getRunwareEnv() {
  return {
    apiKey: readEnv("RUNWARE_API_KEY"),
    model: process.env.RUNWARE_IMAGE_MODEL || "runware:101@1",
    width: Number(process.env.RUNWARE_IMAGE_WIDTH || 1024),
    height: Number(process.env.RUNWARE_IMAGE_HEIGHT || 1024),
    steps: Number(process.env.RUNWARE_IMAGE_STEPS || 50),
  };
}

export function getPublicAppUrl() {
  return process.env.PUBLIC_APP_URL || "http://localhost:3000";
}
