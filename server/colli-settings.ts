import { pool } from "./db";
import { isSupabaseAdminConfigured, supabaseAdmin } from "./supabase";
import {
  COLLI_ENGLISH_ENABLED_SETTINGS_KEY,
  DEFAULT_COLLI_ADMIN_SETTINGS,
  type ColliAdminSettings,
} from "@shared/colli";

function readEnglishEnabled(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (value && typeof value === "object" && "englishEnabled" in value) {
    return (value as { englishEnabled?: unknown }).englishEnabled !== false;
  }
  return DEFAULT_COLLI_ADMIN_SETTINGS.englishEnabled;
}

export async function getColliAdminSettings(): Promise<ColliAdminSettings> {
  const value = await readColliSetting(COLLI_ENGLISH_ENABLED_SETTINGS_KEY);
  return { englishEnabled: readEnglishEnabled(value) };
}

export async function setColliAdminSettings(
  settings: ColliAdminSettings,
): Promise<ColliAdminSettings> {
  const normalized = { englishEnabled: settings.englishEnabled !== false };
  await writeColliSetting(COLLI_ENGLISH_ENABLED_SETTINGS_KEY, normalized.englishEnabled);
  return normalized;
}

async function readColliSetting(key: string): Promise<unknown> {
  if (isSupabaseAdminConfigured) {
    const { data, error } = await supabaseAdmin
      .from("colli_settings")
      .select("value")
      .eq("key", key)
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data?.value;
  }

  if (!pool) return undefined;

  const result = await pool.query<{ value: unknown }>(
    "select value from colli_settings where key = $1 limit 1",
    [key],
  );
  return result.rows[0]?.value;
}

async function writeColliSetting(key: string, value: unknown): Promise<void> {
  if (isSupabaseAdminConfigured) {
    const { error } = await supabaseAdmin
      .from("colli_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return;
  }

  if (!pool) throw new Error("Database is not configured");

  await pool.query(
    `insert into colli_settings (key, value, updated_at)
     values ($1, $2, CURRENT_TIMESTAMP)
     on conflict (key) do update set value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
    [key, JSON.stringify(value)],
  );
}
