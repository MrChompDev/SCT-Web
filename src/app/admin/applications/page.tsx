import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getProfile, permsFor } from "@/lib/auth";
import NoAccess from "@/components/admin/NoAccess";
import ApplicationsManager from "./ApplicationsManager";
import type { Application } from "@/types";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const profile = await getProfile();
  if (!permsFor(profile).applications) {
    return <NoAccess title="Applications" />;
  }
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <ApplicationsManager initial={(data ?? []) as Application[]} />
  );
}
