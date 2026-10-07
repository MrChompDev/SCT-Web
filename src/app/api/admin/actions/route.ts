import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { announceNewsletter, logAdminAction } from "@/lib/discord";
import { hasAnyPermission, permsFor } from "@/lib/auth";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

type ActionBody =
  | { type: "audit"; action: string; details?: string }
  | { type: "announce"; title: string; body: string; pingEveryone?: boolean };

/** Verifies the caller is a dashboard user (any permission) before anything. */
async function requireProfile(): Promise<
  { profile: Profile } | { error: NextResponse }
> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();
  if (!profile) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { profile };
}

export async function POST(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth) return auth.error;

  let body: ActionBody;
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const actor = auth.profile.email ?? auth.profile.id;
  const perms = permsFor(auth.profile);

  switch (body.type) {
    // Trigger 3 — silent audit log → #admin-logs (any dashboard user)
    case "audit": {
      if (!hasAnyPermission(perms)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      try {
        const supabase = await getSupabaseServerClient();
        await supabase.from("audit_logs").insert({
          actor,
          action: String(body.action ?? "").slice(0, 200),
          details: body.details ? String(body.details).slice(0, 1000) : null,
        });
      } catch {
        // audit logging is best-effort
      }
      await logAdminAction(actor, body.action, body.details);
      return NextResponse.json({ ok: true });
    }

    // Trigger 2 — newsletter publish → #announcements (needs newsletter perm)
    case "announce": {
      if (!perms.newsletter) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (!body.title?.trim() || !body.body?.trim()) {
        return NextResponse.json(
          { error: "Title and body are required." },
          { status: 400 }
        );
      }
      const sent = await announceNewsletter(
        { title: body.title, body: body.body },
        Boolean(body.pingEveryone)
      );
      return NextResponse.json({ ok: true, delivered: sent });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
