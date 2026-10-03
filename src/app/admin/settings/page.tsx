import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import SettingsForm from "./SettingsForm";
import { DEFAULT_SETTINGS } from "@/lib/data";
import type { SiteSettings } from "@/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  const settings: SiteSettings = {
    hero_heading: data?.hero_heading ?? DEFAULT_SETTINGS.hero_heading,
    hero_subtext: data?.hero_subtext ?? DEFAULT_SETTINGS.hero_subtext,
    logo_url: data?.logo_url ?? null,
    recruitment_open: data?.recruitment_open ?? true,
    discord_url: data?.discord_url ?? null,
  };

  return <SettingsForm initial={settings} />;
}
