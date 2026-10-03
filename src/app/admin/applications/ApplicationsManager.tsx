"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Application, ApplicationStatus } from "@/types";

const FILTERS: Array<{ key: "all" | ApplicationStatus; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "denied", label: "Denied" },
  { key: "all", label: "All" },
];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  pending: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  denied: "bg-red-500/10 text-red-400 ring-red-500/30",
};

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

export default function ApplicationsManager({
  initial,
}: {
  initial: Application[];
}) {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>(initial);
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("pending");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const visible = apps.filter((a) => filter === "all" || a.status === filter);

  async function review(app: Application, status: Exclude<ApplicationStatus, "pending">) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", app.id);
    if (error) return;
    setApps((list) =>
      list.map((a) => (a.id === app.id ? { ...a, status } : a))
    );
    setConfirm(null);
    void audit(
      status === "approved" ? "Application approved" : "Application denied",
      `${app.roblox_username} (@${app.discord_username})`
    );
    router.refresh();
  }

  return (
    <div>
      <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
        Recruitment
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
        Applications
      </h1>

      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => {
          const count =
            f.key === "all"
              ? apps.length
              : apps.filter((a) => a.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-4 py-2 font-display text-xs font-semibold uppercase tracking-widest transition",
                filter === f.key
                  ? "bg-brand-500 text-night-950"
                  : "border border-white/10 text-slate-400 hover:border-brand-500/40 hover:text-brand-400"
              )}
            >
              {f.label}
              <span className="ml-2 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        {visible.map((app) => {
          const open = expanded === app.id;
          return (
            <div key={app.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(open ? null : app.id)}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/[0.02]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div>
                    <p className="font-display text-lg font-semibold uppercase tracking-wide text-white">
                      {app.roblox_username}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{app.discord_username} · {timeAgo(app.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      "rounded-md px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest ring-1",
                      STATUS_STYLES[app.status]
                    )}
                  >
                    {app.status}
                  </span>
                  <ChevronDown
                    size={18}
                    className={cn(
                      "text-slate-500 transition",
                      open && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {open && (
                <div className="border-t border-white/10 p-5">
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="field-label">Age</dt>
                      <dd className="text-slate-200">{app.age ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="field-label">Timezone</dt>
                      <dd className="text-slate-200">{app.timezone ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="field-label">Availability</dt>
                      <dd className="text-slate-200">{app.availability ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="field-label">Discord</dt>
                      <dd className="text-slate-200">{app.discord_username}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="field-label">Prior Experience</dt>
                      <dd className="whitespace-pre-line leading-relaxed text-slate-300">
                        {app.experience ?? "—"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="field-label">Why Southern Cross?</dt>
                      <dd className="whitespace-pre-line leading-relaxed text-slate-300">
                        {app.why_join ?? "—"}
                      </dd>
                    </div>
                  </dl>

                  {app.status === "pending" ? (
                    <div className="mt-6 flex gap-3">
                      {confirm === `approve-${app.id}` ? (
                        <button
                          onClick={() => void review(app, "approved")}
                          className="rounded-lg bg-emerald-500 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition hover:bg-emerald-400"
                        >
                          Confirm Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirm(`approve-${app.id}`)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/10 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-emerald-400 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/20"
                        >
                          <Check size={15} /> Approve
                        </button>
                      )}
                      {confirm === `deny-${app.id}` ? (
                        <button
                          onClick={() => void review(app, "denied")}
                          className="rounded-lg bg-red-500 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-red-400"
                        >
                          Confirm Deny
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirm(`deny-${app.id}`)}
                          className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-red-400 ring-1 ring-red-500/30 transition hover:bg-red-500/20"
                        >
                          <X size={15} /> Deny
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-6 text-xs uppercase tracking-widest text-slate-600">
                      Reviewed — status locked as {app.status}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="card p-12 text-center text-slate-500">
            No {filter === "all" ? "" : filter} applications right now.
          </div>
        )}
      </div>
    </div>
  );
}
