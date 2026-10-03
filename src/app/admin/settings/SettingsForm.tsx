"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { resizeImage } from "@/lib/utils";
import { getSupabaseBrowserClient, supabaseStorageUrl } from "@/lib/supabase";
import type { SiteSettings } from "@/types";

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

export default function SettingsForm({ initial }: { initial: SiteSettings }) {
  const router = useRouter();
  const [form, setForm] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function uploadLogo(file: File): Promise<string> {
    const supabase = getSupabaseBrowserClient();
    const resized = await resizeImage(file, 512, 0.9);
    const path = `logos/${crypto.randomUUID()}.${resized.name.split(".").pop() ?? "webp"}`;
    const { error } = await supabase.storage
      .from("site-assets")
      .upload(path, resized, { contentType: resized.type });
    if (error) throw error;
    return supabaseStorageUrl(`site-assets/${path}`);
  }

  async function save() {
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("site_settings").upsert({
        id: 1,
        hero_heading: form.hero_heading.trim() || null,
        hero_subtext: form.hero_subtext.trim() || null,
        logo_url: form.logo_url,
        recruitment_open: form.recruitment_open,
        discord_url: form.discord_url?.trim() || null,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setStatus("Settings saved — the public site has been updated.");
      void audit("Site settings updated");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
        Configuration
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
        Site Settings
      </h1>

      <div className="card mt-8 space-y-6 p-6 sm:p-8">
        <div>
          <span className="field-label">Site Logo</span>
          <div className="flex items-center gap-4">
            {form.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logo_url}
                alt="site logo"
                className="h-16 w-16 rounded-xl bg-night-800 object-contain ring-1 ring-white/10"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-night-800 font-display text-xs font-bold uppercase tracking-widest text-slate-500 ring-1 ring-white/10">
                Default
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-lg border border-white/15 px-3.5 py-2 font-display text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-brand-500/50 hover:text-brand-400">
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadLogo(file);
                      setForm((f) => ({ ...f, logo_url: url }));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Upload failed");
                    }
                  }}
                />
              </label>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, logo_url: null }))}
                  className="rounded-lg border border-red-500/30 px-3.5 py-2 font-display text-xs font-semibold uppercase tracking-wider text-red-400 transition hover:bg-red-500/10"
                >
                  Reset To Default
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-600">
            Square PNG/WebP works best. Blank = the bundled Southern Cross logo.
          </p>
        </div>

        <div>
          <label className="field-label">Hero Heading</label>
          <input
            className="field"
            maxLength={90}
            value={form.hero_heading}
            placeholder="Keeping New South Wales Moving"
            onChange={(e) => setForm((f) => ({ ...f, hero_heading: e.target.value }))}
          />
        </div>

        <div>
          <label className="field-label">Hero Subtext</label>
          <textarea
            className="field min-h-[90px] resize-y"
            maxLength={300}
            value={form.hero_subtext}
            placeholder="Shown under the hero heading on the homepage…"
            onChange={(e) => setForm((f) => ({ ...f, hero_subtext: e.target.value }))}
          />
        </div>

        <div>
          <label className="field-label">Discord Invite URL</label>
          <input
            className="field"
            type="url"
            maxLength={200}
            value={form.discord_url ?? ""}
            placeholder="https://discord.gg/…"
            onChange={(e) => setForm((f) => ({ ...f, discord_url: e.target.value }))}
          />
          <p className="mt-2 text-xs text-slate-600">
            Shown as the "Discord Community" button in the footer.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-night-800/50 p-4">
          <div>
            <p className="font-display text-sm font-semibold uppercase tracking-wider text-white">
              Recruitment Status
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Controls the status pill on the site and the /apply page banner.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, recruitment_open: !f.recruitment_open }))}
            className={`relative h-7 w-14 rounded-full transition ${
              form.recruitment_open ? "bg-emerald-500" : "bg-night-600"
            }`}
            aria-label="Toggle recruitment"
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
                form.recruitment_open ? "left-8" : "left-1"
              }`}
            />
          </button>
        </div>

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
          onClick={() => void save()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-night-950 shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Settings
        </button>
      </div>
    </div>
  );
}
