import type { Newsletter } from "@/types";

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
