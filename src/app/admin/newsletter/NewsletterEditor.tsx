"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Loader2,
  Newspaper,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { cn, formatDate, resizeImage } from "@/lib/utils";
import { getSupabaseBrowserClient, supabaseStorageUrl } from "@/lib/supabase";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<Newsletter[]>(initialPosts);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ping, setPing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function uploadImage(file: File | undefined) {
    if (!file || uploading || busy) return;
    if (!file.type.startsWith("image/")) {
      setError("That's not an image file — PNG, JPG or WebP please.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const resized = await resizeImage(file, 1600, 0.85);
      const path = `newsletters/${crypto.randomUUID()}.${
        resized.name.split(".").pop() ?? "webp"
      }`;
      const { error: upErr } = await supabase.storage
        .from("site-assets")
        .upload(path, resized, { contentType: resized.type });
      if (upErr) throw upErr;
      setImageUrl(supabaseStorageUrl(`site-assets/${path}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function publish() {
    if (!imageUrl) {
      setError("Upload the newsletter image first — that's the post.");
      return;
    }
    const finalTitle =
      title.trim() || `Weekly Sitrep — ${formatDate(new Date())}`;
    const finalBody = body.trim();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: dbErr } = await supabase
        .from("newsletters")
        .insert({
          title: finalTitle,
          body: finalBody,
          author: "Command Team",
          image_url: imageUrl,
          published: true,
        })
        .select()
        .single();
      if (dbErr) throw dbErr;

      // Trigger 2 — fire the #announcements webhook.
      const res = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "announce",
          title: finalTitle,
          body: finalBody,
          image_url: imageUrl,
          pingEveryone: ping,
        }),
      });
      const delivered = res.ok;

      setPosts((cur) => [data as Newsletter, ...cur]);
      setImageUrl(null);
      setTitle("");
      setBody("");
      setStatus(
        delivered
          ? "Published to the site and announced on Discord."
          : "Published to the site — but the Discord announcement couldn't be delivered. Check the webhook URL in your env settings."
      );
      void audit("Sitrep published", finalTitle);
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
      const { error } = await supabase
        .from("newsletters")
        .delete()
        .eq("id", post.id);
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
        Upload the newsletter image and publish it — it goes straight to the
        public site and the #announcements Discord webhook with the image
        attached. Title and description are optional extras.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            New Sitrep
          </h2>
          <div className="mt-5 space-y-4">
            <div>
              <label className="field-label">Newsletter image *</label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  void uploadImage(e.dataTransfer.files?.[0]);
                }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "group relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed p-4 text-center transition",
                  dragging
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-white/15 bg-night-800/60 hover:border-brand-500/50"
                )}
              >
                {uploading ? (
                  <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-brand-400" />
                  </div>
                ) : imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Newsletter preview"
                      className="max-h-96 w-full rounded-sm object-contain"
                    />
                    <span className="inline-flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-brand-400">
                      <RefreshCw size={12} /> Click to replace
                    </span>
                  </>
                ) : (
                  <>
                    <ImagePlus size={24} className="text-slate-500" />
                    <span className="font-display text-sm font-semibold uppercase tracking-widest text-slate-300">
                      Drop the newsletter image here
                    </span>
                    <span className="text-xs text-slate-500">
                      PNG / JPG / WebP — auto-optimised on upload
                    </span>
                  </>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void uploadImage(e.target.files?.[0])}
              />
              {imageUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUrl(null);
                  }}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-red-400"
                >
                  <Trash2 size={12} /> Remove image
                </button>
              )}
            </div>
            <div>
              <label className="field-label">Title — optional</label>
              <input
                className="field"
                value={title}
                maxLength={150}
                placeholder="Defaults to “Weekly Sitrep — {today's date}”"
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Description — optional</label>
              <textarea
                className="field min-h-[110px] resize-y"
                value={body}
                maxLength={4000}
                placeholder="Short text for the Discord announcement and sitrep cards (optional)."
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
              disabled={busy || uploading || !imageUrl}
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
                  <div className="flex min-w-0 items-start gap-3">
                    {post.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.image_url}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-sm border border-white/10 object-cover"
                      />
                    ) : (
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-night-800 text-slate-500">
                        <Newspaper size={18} />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-xs uppercase tracking-widest text-slate-500">
                        {formatDate(post.created_at)}
                      </p>
                      <h3 className="mt-1 font-display text-base font-semibold uppercase leading-snug tracking-wide text-white">
                        {post.title}
                      </h3>
                      {post.body && (
                        <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-sm text-slate-400">
                          {post.body}
                        </p>
                      )}
                    </div>
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
