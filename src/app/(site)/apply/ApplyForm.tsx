"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, Loader2, Lock, Send } from "lucide-react";
import { fetchRobloxAvatar } from "@/lib/roblox";

type Mode = "full" | "db" | "webhook" | "demo";

const MODE_NOTES: Record<Mode, string> = {
  full: "Command has been notified on Discord and your application is saved for review.",
  db: "Your application has been saved and queued for Command review.",
  webhook: "Your application has been sent straight to Command on Discord.",
  demo:
    "Heads up — the site isn't connected to a database or Discord webhook yet, so this submission wasn't delivered. Site owners: see README.md to connect Supabase and webhooks.",
};

const AVAILABILITY = [
  "Weekdays",
  "Weekends",
  "Weeknights",
  "Whenever needed",
];

export default function ApplyForm({ recruitmentOpen }: { recruitmentOpen: boolean }) {
  const [form, setForm] = useState({
    roblox_username: "",
    discord_username: "",
    age: "",
    timezone: "",
    availability: AVAILABILITY[3],
    experience: "",
    why_join: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ mode: Mode; avatar: string | null } | null>(
    null
  );

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok: boolean; mode?: Mode; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Try again shortly.");
        return;
      }
      const avatar = await fetchRobloxAvatar(form.roblox_username);
      setDone({ mode: data.mode ?? "demo", avatar });
    } catch {
      setError("Network error — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="card flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
        <CheckCircle2 size={48} className="text-emerald-400" />
        <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-white">
          Application Received
        </h2>
        {done.avatar && (
          <Image
            src={done.avatar}
            alt={form.roblox_username}
            width={72}
            height={72}
            className="h-[72px] w-[72px] rounded-2xl ring-2 ring-brand-500/50"
          />
        )}
        <p className="max-w-sm text-sm leading-relaxed text-slate-400">
          Thanks, <span className="text-brand-400">{form.roblox_username}</span>.
          {" "}{MODE_NOTES[done.mode]}
        </p>
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Keep an eye on your Discord DMs
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">
        Application Form
      </h2>

      {!recruitmentOpen && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <Lock size={16} className="mt-0.5 shrink-0" />
          <p>
            Recruitment is currently <strong>closed</strong>. You can still
            submit — applications will be reviewed when the next intake opens.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="roblox_username" className="field-label">
            Roblox Username *
          </label>
          <input
            id="roblox_username"
            className="field"
            required
            maxLength={60}
            placeholder="e.g. TowMaster_04"
            value={form.roblox_username}
            onChange={(e) => set("roblox_username", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="discord_username" className="field-label">
            Discord Username *
          </label>
          <input
            id="discord_username"
            className="field"
            required
            maxLength={60}
            placeholder="e.g. towmaster04"
            value={form.discord_username}
            onChange={(e) => set("discord_username", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="age" className="field-label">
            Age
          </label>
          <input
            id="age"
            className="field"
            type="number"
            min={10}
            max={99}
            placeholder="—"
            value={form.age}
            onChange={(e) => set("age", e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="timezone" className="field-label">
            Timezone
          </label>
          <input
            id="timezone"
            className="field"
            maxLength={40}
            placeholder="e.g. AEST (UTC+10)"
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="availability" className="field-label">
            Availability
          </label>
          <select
            id="availability"
            className="field"
            value={form.availability}
            onChange={(e) => set("availability", e.target.value)}
          >
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="experience" className="field-label">
            Prior RP / Towing Experience
          </label>
          <textarea
            id="experience"
            className="field min-h-[96px] resize-y"
            maxLength={2000}
            placeholder="Any previous roleplay crews, towing experience, or relevant roles…"
            value={form.experience}
            onChange={(e) => set("experience", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="why_join" className="field-label">
            Why Southern Cross Towing?
          </label>
          <textarea
            id="why_join"
            className="field min-h-[96px] resize-y"
            maxLength={2000}
            placeholder="Tell Command why you'd be a good fit for the crew…"
            value={form.why_join}
            onChange={(e) => set("why_join", e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3.5 font-display text-base font-semibold uppercase tracking-wider text-night-950 shadow-lg shadow-brand-500/20 transition hover:bg-brand-400 disabled:opacity-60"
      >
        {busy ? (
          <>
            <Loader2 size={18} className="animate-spin" /> Submitting…
          </>
        ) : (
          <>
            <Send size={18} /> Submit Application
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-slate-500">
        By submitting you agree to be contacted by Command via Discord.
      </p>
    </form>
  );
}
