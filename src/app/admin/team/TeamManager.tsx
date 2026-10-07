"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, UserCog } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { Profile, ProfileRole } from "@/types";

const ROLES: Array<{ value: ProfileRole; label: string }> = [
  { value: "user", label: "User" },
  { value: "executive", label: "Executive" },
  { value: "admin", label: "Admin" },
];

const PERMS: Array<{
  key: keyof Pick<
    Profile,
    | "can_manage_gallery"
    | "can_manage_staff"
    | "can_manage_settings"
    | "can_publish_newsletter"
    | "can_review_applications"
  >;
  label: string;
  hint: string;
}> = [
  {
    key: "can_manage_gallery",
    label: "Gallery",
    hint: "Swap gallery photos + edit their captions",
  },
  {
    key: "can_manage_staff",
    label: "Staff",
    hint: "Change command names, photos and ranks",
  },
  {
    key: "can_manage_settings",
    label: "Settings",
    hint: "Change the logo, hero text and toggles",
  },
  {
    key: "can_publish_newsletter",
    label: "Newsletters",
    hint: "Publish sitreps to the site + Discord",
  },
  {
    key: "can_review_applications",
    label: "Applications",
    hint: "See and approve/deny the application queue",
  },
];

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

export default function TeamManager({
  initialMembers,
  selfId,
}: {
  initialMembers: Profile[];
  selfId: string;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<Profile[]>(initialMembers);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function apply(id: string, patch: Partial<Profile>) {
    setMembers((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  async function persist(member: Profile, patch: Partial<Profile>, note: string) {
    setSaving(member.id);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", member.id);
      if (error) throw error;
      apply(member.id, patch);
      void audit(note, member.email ?? member.id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
        Access Control
      </p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
        Team & Permissions
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-400">
        Anyone on the team can create an account at{" "}
        <code className="rounded bg-night-800 px-1.5 py-0.5 text-xs">/login</code>{" "}
        — but they see nothing until you flip on permissions here.
        Executives and admins automatically get <em>everything</em>.
      </p>

      {error && (
        <p className="mt-6 rounded-sm border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-3">
        {members.map((member) => {
          const isSelf = member.id === selfId;
          const full = member.role === "executive" || member.role === "admin";
          return (
            <div key={member.id} className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-night-800 text-brand-400 ring-1 ring-white/10">
                    <UserCog size={18} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold uppercase tracking-wide text-white">
                      {member.email ?? "unknown email"}
                      {isSelf && (
                        <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                          You
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      Joined {member.created_at ? formatDate(member.created_at) : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      disabled={saving === member.id || isSelf}
                      onClick={() =>
                        persist(member, { role: role.value }, `Role set to ${role.value}`)
                      }
                      className={cn(
                        "rounded-lg px-3 py-1.5 font-display text-xs font-semibold uppercase tracking-widest transition",
                        member.role === role.value
                          ? "bg-brand-500 text-night-950"
                          : "border border-white/10 text-slate-400 hover:border-brand-500/40 hover:text-brand-400 disabled:opacity-40"
                      )}
                      title={
                        isSelf
                          ? "You can't change your own role"
                          : `Set role to ${role.label}`
                      }
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-white/5 pt-5">
                {full && (
                  <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                    <ShieldCheck size={14} /> Full access — all permissions
                  </p>
                )}
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {PERMS.map((perm) => {
                    const on = full || Boolean(member[perm.key]);
                    return (
                      <button
                        key={perm.key}
                        disabled={full || saving === member.id}
                        onClick={() =>
                          persist(
                            member,
                            { [perm.key]: !member[perm.key] },
                            `${perm.label} access ${member[perm.key] ? "revoked" : "granted"}`
                          )
                        }
                        title={full ? "Executives always have every permission" : perm.hint}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition disabled:cursor-not-allowed",
                          on
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : "border-white/10 hover:border-white/20",
                          full && "opacity-70"
                        )}
                      >
                        <span>
                          <span className="block font-display text-xs font-semibold uppercase tracking-widest text-white">
                            {perm.label}
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                            {perm.hint}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition",
                            on ? "justify-end bg-emerald-500" : "justify-start bg-night-600"
                          )}
                        >
                          <span className="h-5 w-5 rounded-full bg-white" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {saving === member.id && (
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 size={12} className="animate-spin" /> Saving…
                </p>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <div className="card p-12 text-center text-sm text-slate-500">
            No accounts yet — staff can create one at <code>/login</code>.
          </div>
        )}
      </div>

      <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-600">
        <Check size={14} className="mt-0.5 shrink-0" />
        Changes save instantly and are enforced by the database (RLS), not
        just hidden in the UI. Users need to sign out and back in for revoked
        sessions to fully expire.
      </p>
    </div>
  );
}
