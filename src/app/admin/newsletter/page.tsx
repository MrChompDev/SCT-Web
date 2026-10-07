import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getProfile, permsFor } from "@/lib/auth";
import NoAccess from "@/components/admin/NoAccess";
import NewsletterEditor from "./NewsletterEditor";
import type { Newsletter } from "@/types";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const profile = await getProfile();
  if (!permsFor(profile).newsletter) {
    return <NoAccess title="Sitrep Editor" />;
  }
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false });

  return <NewsletterEditor initialPosts={(data ?? []) as Newsletter[]} />;
}
