import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Profile } from "@/types";

/**
 * Server-side RBAC helpers. The database enforces the same rules via RLS
 * (see supabase/schema.sql) — these keep the dashboard UI in sync so people
 * only see what they've been granted.
 */

export type Permissions = {
  applications: boolean;
  staff: boolean;
  gallery: boolean;
  newsletter: boolean;
  settings: boolean;
  /** Grant/revoke permissions + roles — executives/admins only. */
  team: boolean;
};

const NO_ACCESS: Permissions = {
  applications: false,
  staff: false,
  gallery: false,
  newsletter: false,
  settings: false,
  team: false,
};

/** Map a profile row (or null) to the UI permission set. */
export function permsFor(profile: Profile | null): Permissions {
  if (!profile) return NO_ACCESS;
  const full =
    profile.role === "executive" || profile.role === "admin";
  return {
    applications: full || Boolean(profile.can_review_applications),
    staff: full || Boolean(profile.can_manage_staff),
    gallery: full || Boolean(profile.can_manage_gallery),
    newsletter: full || Boolean(profile.can_publish_newsletter),
    settings: full || Boolean(profile.can_manage_settings),
    team: full,
  };
}

export function hasAnyPermission(perms: Permissions): boolean {
  return (
    perms.applications ||
    perms.staff ||
    perms.gallery ||
    perms.newsletter ||
    perms.settings ||
    perms.team
  );
}

/** Profile of the signed-in user (null when signed out / DB unreachable). */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return (data as Profile) ?? null;
}
