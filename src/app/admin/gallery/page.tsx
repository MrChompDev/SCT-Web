import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getProfile, permsFor } from "@/lib/auth";
import NoAccess from "@/components/admin/NoAccess";
import GalleryManager from "./GalleryManager";
import type { GalleryItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const profile = await getProfile();
  if (!permsFor(profile).gallery) {
    return <NoAccess title="Gallery" />;
  }
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("gallery")
    .select("*")
    .order("sort_order", { ascending: true });

  return <GalleryManager initialItems={(data ?? []) as GalleryItem[]} />;
}
