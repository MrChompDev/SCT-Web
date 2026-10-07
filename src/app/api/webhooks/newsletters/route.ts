import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase";
import { announceNewsletter } from "@/lib/discord";

export const dynamic = "force-dynamic";

/**
 * Inbound newsletter webhook — lets staff auto-post sitreps to the website
 * from anywhere (Discord bot, Zapier/Make automation, cron script, curl).
 *
 *   POST /api/webhooks/newsletters
 *   Authorization: Bearer <NEWSLETTER_WEBHOOK_SECRET>
 *   { "title": "Weekly Sitrep", "body": "…", "author": "Command Team" }
 *
 * The body may also use `content`/`text`/`description` keys, or a forwarded
 * Discord-webhook shape ({ content, embeds: [{ title, description }] }),
 * so automation platforms work without a custom transform step.
 *
 * Optional flags:
 *   author   — byline shown on the post (default "Command Team")
 *   announce — also fire the #announcements Discord webhook (default false)
 */

const MAX_TITLE = 150;
const MAX_BODY = 4000;
const MAX_AUTHOR = 100;

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function secretMatches(provided: string): boolean {
  const secret = process.env.NEWSLETTER_WEBHOOK_SECRET ?? "";
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function extractSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7).trim();
  const header = request.headers.get("x-webhook-secret");
  if (header) return header.trim();
  const url = new URL(request.url);
  return url.searchParams.get("secret");
}

type ParsedPost = { title: string; body: string; author: string | null };

function extractPost(payload: Record<string, unknown>): ParsedPost | null {
  const embed = Array.isArray(payload.embeds)
    ? (payload.embeds[0] as Record<string, unknown> | undefined)
    : undefined;

  const title =
    str(payload.title) ??
    str(embed?.title) ??
    str(payload.subject) ??
    null;

  const body =
    str(payload.body) ??
    str(payload.content) ??
    str(payload.text) ??
    str(payload.description) ??
    str(embed?.description) ??
    null;

  if (!title || !body) return null;

  return {
    title: clip(title, MAX_TITLE),
    body: clip(body, MAX_BODY),
    author: str(payload.author) ? clip(str(payload.author)!, MAX_AUTHOR) : null,
  };
}

export async function POST(request: Request) {
  const secret = extractSecret(request);
  if (!secret || !secretMatches(secret)) {
    return NextResponse.json(
      { ok: false, error: "Invalid or missing webhook secret." },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured on the server." },
      { status: 503 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY is not set — the webhook needs it to insert posts. Add it to .env.local (Project Settings → API → service_role).",
      },
      { status: 503 }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const post = extractPost(payload);
  if (!post) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Missing title or body. Send { title, body } (content/text/description also accepted for the body).",
      },
      { status: 400 }
    );
  }

  const { data, error } = await admin
    .from("newsletters")
    .insert({
      title: post.title,
      body: post.body,
      author: post.author ?? "Command Team",
      published: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? "Insert failed." },
      { status: 500 }
    );
  }

  // Optional: mirror the post to the #announcements Discord webhook.
  let announced = false;
  if (payload.announce === true) {
    announced = await announceNewsletter(
      { title: post.title, body: post.body },
      payload.pingEveryone === true
    );
  }

  // Best-effort audit entry (service role bypasses RLS).
  void admin
    .from("audit_logs")
    .insert({
      actor: post.author ? `webhook (${post.author})` : "newsletter webhook",
      action: "Sitrep auto-posted via webhook",
      details: post.title,
    })
    .then(() => undefined, () => undefined);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const url = siteUrl ? `${siteUrl}/newsletter/${data.id}` : null;

  return NextResponse.json({ ok: true, id: data.id, url, announced });
}

export function GET() {
  return NextResponse.json(
    { ok: false, error: "POST a newsletter payload to this endpoint." },
    { status: 405 }
  );
}
