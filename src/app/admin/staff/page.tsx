import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import StaffManager from "./StaffManager";
import type { StaffMember } from "@/types";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("staff_members")
    .select("*")
    .order("sort_order", { ascending: true });

  return <StaffManager initialStaff={(data ?? []) as StaffMember[]} />;
}
