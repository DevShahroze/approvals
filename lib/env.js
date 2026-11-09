import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGODB_URI: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL_DEFAULT: z.string().default("claude-sonnet-4-20250514"),
  CLAUDE_MODEL_LIGHT: z.string().default("claude-3-5-haiku-latest"),
  WORKER_API_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  ALLOWED_FIREBASE_UIDS: z.string().optional(),
  SEED_PROFILE: z.string().optional(),
  DEV_BYPASS_AUTH: z.string().optional(),
});

export function getEnv() {
  return envSchema.parse(process.env);
}

export function isFirebaseConfigured() {
  const e = getEnv();
  return Boolean(
    e.FIREBASE_PROJECT_ID &&
      e.FIREBASE_CLIENT_EMAIL &&
      e.FIREBASE_PRIVATE_KEY &&
      e.NEXT_PUBLIC_FIREBASE_API_KEY
  );
}

export function isMongoConfigured() {
  return Boolean(getEnv().MONGODB_URI);
}
