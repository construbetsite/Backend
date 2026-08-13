import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const _env = {
  PORT: Number(process.env.PORT) || 10000,
  NODE_ENV: process.env.NODE_ENV || "development",
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
} as const;

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;

const missing = required.filter((field) => !_env[field]);

if (missing.length) {
  console.error(`❌ Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
  process.exit(1);
}

export const env = Object.freeze(_env);
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export type Env = typeof env;