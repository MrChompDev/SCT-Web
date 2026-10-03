import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import NewsletterEditor from "./NewsletterEditor";
import type { Newsletter } from "@/types";

export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("newsletters")
    .select("*")
    .order("created_at", { ascending: false });

  return <NewsletterEditor initialPosts={(data ?? []) as Newsletter[]} />;
}
