import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import GalleryManager from "./GalleryManager";
import type { GalleryItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("gallery")
    .select("*")
    .order("sort_order", { ascending: true });

  return <GalleryManager initialItems={(data ?? []) as GalleryItem[]} />;
}
