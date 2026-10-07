import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// Newer Supabase projects call the anon key the "publishable key" — accept either name.
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";
// Newer projects also call the service-role key the "secret key" — accept either name.
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SECRET_KEY ??
  "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const NOT_CONFIGURED =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in .env.local — see README.md for the walkthrough.";

/** Browser-side client (client components: forms, admin managers). */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED);
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/** Service-role client (bypasses RLS). Server-side only — never import from
 *  a client component; it is only instantiated when the key is present. */
export function getSupabaseAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Public URL for a file in the `site-assets` storage bucket. */
export function supabaseStorageUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
}
