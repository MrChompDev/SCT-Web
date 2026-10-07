import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getProfile, permsFor } from "@/lib/auth";
import NoAccess from "@/components/admin/NoAccess";
import StaffManager from "./StaffManager";
import type { StaffMember } from "@/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const profile = await getProfile();
  if (!permsFor(profile).staff) {
    return <NoAccess title="Staff Manager" />;
  }
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("staff_members")
    .select("*")
    .order("sort_order", { ascending: true });

  return <StaffManager initialStaff={(data ?? []) as StaffMember[]} />;
}
