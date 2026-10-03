import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import { notifyApplication } from "@/lib/discord";
import type { Application } from "@/types";

export const dynamic = "force-dynamic";

function str(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const roblox_username = str(body.roblox_username, 60);
  const discord_username = str(body.discord_username, 60);
  if (!roblox_username || !discord_username) {
    return NextResponse.json(
      { ok: false, error: "Roblox and Discord usernames are required." },
      { status: 400 }
    );
  }

  const application: Application = {
    id: "pending",
    roblox_username,
    discord_username,
    age: body.age !== "" && body.age != null ? Number(body.age) || null : null,
    timezone: str(body.timezone, 40) || null,
    availability: str(body.availability, 40) || null,
    experience: str(body.experience, 2000) || null,
    why_join: str(body.why_join, 2000) || null,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  // Phase 2 — persist to the applications table (anon insert via RLS).
  let saved = false;
  if (isSupabaseConfigured) {
    try {
      const supabase = await getSupabaseServerClient();
      const { error } = await supabase.from("applications").insert({
        roblox_username: application.roblox_username,
        discord_username: application.discord_username,
        age: application.age,
        timezone: application.timezone,
        availability: application.availability,
        experience: application.experience,
        why_join: application.why_join,
        status: "pending",
      });
      if (!error) saved = true;
    } catch {
      // fall through to webhook / demo mode
    }
  }

  // Phase 4 — Trigger 1: fire the #applications Discord webhook.
  const webhookSent = await notifyApplication(application);

  const mode = saved && webhookSent ? "full" : saved ? "db" : webhookSent ? "webhook" : "demo";
  return NextResponse.json({ ok: true, mode });
}
