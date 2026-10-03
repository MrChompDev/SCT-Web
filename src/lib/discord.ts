import type { Application, Newsletter } from "@/types";

const BRAND_COLOR = 0xf5a524;
const FOOTER = "Southern Cross Towing — Command";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

type EmbedField = { name: string; value: string; inline?: boolean };

type Embed = {
  title?: string;
  description?: string;
  color?: number;
  fields?: EmbedField[];
  footer?: { text: string };
  timestamp?: string;
};

async function postWebhook(
  url: string | undefined,
  payload: Record<string, unknown>
): Promise<boolean> {
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function clip(text: string | null | undefined, max: number): string {
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** Trigger 1 — new application submitted on /apply → #applications. */
export async function notifyApplication(app: Application): Promise<boolean> {
  return postWebhook(process.env.DISCORD_WEBHOOK_APPLICATIONS, {
    embeds: [
      {
        title: `🚨 New Application — ${app.roblox_username}`,
        color: BRAND_COLOR,
        fields: [
          { name: "Roblox", value: clip(app.roblox_username, 200), inline: true },
          { name: "Discord", value: clip(app.discord_username, 200), inline: true },
          { name: "Age", value: app.age ? String(app.age) : "—", inline: true },
          { name: "Timezone", value: clip(app.timezone, 200) ?? "—", inline: true },
          { name: "Availability", value: clip(app.availability, 200), inline: true },
          { name: "Submitted", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: "Prior Experience", value: clip(app.experience, 1024) },
          { name: "Why Southern Cross?", value: clip(app.why_join, 1024) },
        ],
        footer: { text: FOOTER },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/** Trigger 2 — newsletter published from the dashboard → #announcements. */
export async function announceNewsletter(
  post: Pick<Newsletter, "title" | "body">,
  pingEveryone = false
): Promise<boolean> {
  const link = SITE_URL ? `${SITE_URL}/newsletter` : "";
  return postWebhook(process.env.DISCORD_WEBHOOK_ANNOUNCEMENTS, {
    content: pingEveryone ? "@everyone" : "",
    embeds: [
      {
        title: `📰 ${clip(post.title, 250)}`,
        description: clip(post.body, 2000),
        color: BRAND_COLOR,
        ...(link ? { fields: [{ name: "Read online", value: link }] } : {}),
        footer: { text: FOOTER },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

/** Trigger 3 — silent audit log → #admin-logs. */
export async function logAdminAction(
  actor: string,
  action: string,
  details?: string
): Promise<boolean> {
  return postWebhook(process.env.DISCORD_WEBHOOK_ADMIN_LOGS, {
    embeds: [
      {
        title: "🛠️ Dashboard Activity",
        description: `**${actor}** — ${action}`,
        ...(details ? { fields: [{ name: "Details", value: clip(details, 1024) }] } : {}),
        color: 0x253046,
        footer: { text: FOOTER },
        timestamp: new Date().toISOString(),
      },
    ],
  });
}
