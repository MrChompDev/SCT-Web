"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Newspaper, Send, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Newsletter } from "@/types";

async function audit(action: string, details?: string) {
  try {
    await fetch("/api/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "audit", action, details }),
    });
  } catch {
    // best-effort
  }
}

export default function NewsletterEditor({
  initialPosts,
}: {
  initialPosts: Newsletter[];
}) {
  const router = useRouter();
  const [posts, setPosts] = useState<Newsletter[]>(initialPosts);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ping, setPing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function publish() {
    if (!title.trim() || !body.trim()) {
      setError("Give the sitrep a title and a body.");
      return;
    }
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: dbErr } = await supabase
        .from("newsletters")
        .insert({ title: title.trim(), body: body.trim(), author: "Command Team", published: true })
        .select()
        .single();
      if (dbErr) throw dbErr;

      // Trigger 2 — fire the #announcements webhook.
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "announce", title: title.trim(), body: body.trim(), pingEveryone: ping }),
      });
      const delivered = res.ok;

      setPosts((cur) => [data as Newsletter, ...cur]);
      setTitle("");
      setBody("");
      setStatus(
        delivered
          ? "Published to the site and announced on Discord."
          : "Published to the site — but the Discord announcement couldn't be delivered. Check the webhook URL in your env settings."
      );
      void audit("Sitrep published", title.trim());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(post: Newsletter) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("newsletters").delete().eq("id", post.id);
      if (error) throw error;
      setPosts((cur) => cur.filter((p) => p.id !== post.id));
      setConfirmDelete(null);
      void audit("Sitrep deleted", post.title);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
        Community Updates
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
        Sitrep Editor
      </h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">
        Write the weekly newsletter. Publishing pushes it to the public site
        and fires the #announcements Discord webhook simultaneously.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            New Sitrep
          </h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="field-label">Title *</label>
              <input
                className="field"
                value={title}
                maxLength={150}
                placeholder="e.g. Weekly Sitrep — New Fleet Arrivals"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Body *</label>
              <textarea
                className="field min-h-[220px] resize-y"
                value={body}
                maxLength={4000}
                placeholder={"Write the update…\n\nLine breaks are preserved on the site and in the Discord embed."}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={ping}
                onChange={(e) => setPing(e.target.checked)}
                className="h-4 w-4 accent-brand-500"
              />
              Ping <span className="font-semibold text-brand-400">@everyone</span> on Discord
            </label>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </p>
            )}
            {status && (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                {status}
              </p>
            )}

            <button
              onClick={() => void publish()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-sm bg-brand-500 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition-colors hover:bg-brand-400 disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Publish Sitrep
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            Published Sitreps
          </h2>
          <div className="mt-5 space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="card group p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                      <Newspaper size={12} /> {formatDate(post.created_at)}
                    </p>
                    <h3 className="mt-2 font-display text-base font-semibold uppercase leading-snug tracking-wide text-white">
                      {post.title}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-sm text-slate-400">
                      {post.body}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      confirmDelete === post.id
                        ? void remove(post)
                        : setConfirmDelete(post.id)
                    }
                    onBlur={() => setConfirmDelete(null)}
                    className={`shrink-0 rounded-lg p-2 transition ${
                      confirmDelete === post.id
                        ? "bg-red-500 px-2 font-display text-xs font-bold uppercase text-white"
                        : "text-slate-500 opacity-0 hover:text-red-400 group-hover:opacity-100"
                    }`}
                    aria-label="Delete sitrep"
                  >
                    {confirmDelete === post.id ? "Sure?" : <Trash2 size={15} />}
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="card p-10 text-center text-sm text-slate-500">
                No sitreps yet — your first one will appear on the site and
                Discord at the same time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
