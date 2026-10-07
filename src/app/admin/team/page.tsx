import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getProfile, permsFor } from "@/lib/auth";
import NoAccess from "@/components/admin/NoAccess";
import TeamManager from "./TeamManager";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const profile = await getProfile();
  if (!permsFor(profile).team) {
    return <NoAccess title="Team & Permissions" />;
  }
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });

  const members: Profile[] = (data ?? []).map((row) => ({
    ...row,
    can_manage_gallery: Boolean(row.can_manage_gallery),
    can_manage_staff: Boolean(row.can_manage_staff),
    can_manage_settings: Boolean(row.can_manage_settings),
    can_publish_newsletter: Boolean(row.can_publish_newsletter),
    can_review_applications: Boolean(row.can_review_applications),
  }));

  return <TeamManager initialMembers={members} selfId={profile?.id ?? ""} />;
}
