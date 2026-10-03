"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { getSupabaseBrowserClient, supabaseStorageUrl } from "@/lib/supabase";
import { initials, resizeImage } from "@/lib/utils";
import type { StaffMember } from "@/types";

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

async function uploadAvatar(file: File): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const resized = await resizeImage(file, 512, 0.9);
  const path = `avatars/${crypto.randomUUID()}.${resized.name.split(".").pop() ?? "webp"}`;
  const { error } = await supabase.storage
    .from("site-assets")
    .upload(path, resized, { contentType: resized.type });
  if (error) throw error;
  return supabaseStorageUrl(`site-assets/${path}`);
}

type FormState = { name: string; rank: string; division: string; avatar_url: string | null };

export default function StaffManager({ initialStaff }: { initialStaff: StaffMember[] }) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState<FormState>({ name: "", rank: "", division: "", avatar_url: null });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function openAdd() {
    setEditing(null);
    setForm({ name: "", rank: "", division: "", avatar_url: null });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(member: StaffMember) {
    setEditing(member);
    setForm({
      name: member.name,
      rank: member.rank,
      division: member.division,
      avatar_url: member.avatar_url,
    });
    setError(null);
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.rank.trim()) {
      setError("Name and rank are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (editing) {
        const { error } = await supabase
          .from("staff_members")
          .update({
            name: form.name.trim(),
            rank: form.rank.trim(),
            division: form.division.trim() || "Operations",
            avatar_url: form.avatar_url,
          })
          .eq("id", editing.id);
        if (error) throw error;
        setStaff((list) =>
          list.map((m) =>
            m.id === editing.id
              ? { ...m, name: form.name.trim(), rank: form.rank.trim(), division: form.division.trim() || "Operations", avatar_url: form.avatar_url }
              : m
          )
        );
        void audit("Staff updated", `${form.name} (${form.rank})`);
      } else {
        const sortOrder = staff.length ? Math.max(...staff.map((m) => m.sort_order)) + 1 : 1;
        const { data, error } = await supabase
          .from("staff_members")
          .insert({
            name: form.name.trim(),
            rank: form.rank.trim(),
            division: form.division.trim() || "Operations",
            avatar_url: form.avatar_url,
            sort_order: sortOrder,
          })
          .select()
          .single();
        if (error) throw error;
        setStaff((list) => [...list, data as StaffMember]);
        void audit("Staff added", `${form.name} (${form.rank})`);
      }
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(member: StaffMember) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("staff_members").delete().eq("id", member.id);
      if (error) throw error;
      setStaff((list) => list.filter((m) => m.id !== member.id));
      setConfirmDelete(null);
      void audit("Staff removed", member.name);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function move(member: StaffMember, dir: -1 | 1) {
    const idx = staff.findIndex((m) => m.id === member.id);
    const swapWith = staff[idx + dir];
    if (!swapWith) return;
    const supabase = getSupabaseBrowserClient();
    await Promise.all([
      supabase.from("staff_members").update({ sort_order: swapWith.sort_order }).eq("id", member.id),
      supabase.from("staff_members").update({ sort_order: member.sort_order }).eq("id", swapWith.id),
    ]);
    const next = [...staff];
    next[idx] = { ...member, sort_order: swapWith.sort_order };
    next[idx + dir] = { ...swapWith, sort_order: member.sort_order };
    setStaff(next.sort((a, b) => a.sort_order - b.sort_order));
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
            Command & Leadership
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
            Staff Manager
          </h1>
        </div>
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Member
        </Button>
      </div>

      <div className="card mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left font-display text-xs font-semibold uppercase tracking-widest text-slate-500">
              <th className="px-5 py-4">Order</th>
              <th className="px-5 py-4">Member</th>
              <th className="px-5 py-4">Rank</th>
              <th className="px-5 py-4">Division</th>
              <th className="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {staff.map((member, i) => (
              <tr key={member.id} className="transition hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => void move(member, -1)}
                      disabled={i === 0}
                      className="rounded px-1.5 text-slate-500 transition hover:text-brand-400 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => void move(member, 1)}
                      disabled={i === staff.length - 1}
                      className="rounded px-1.5 text-slate-500 transition hover:text-brand-400 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="h-10 w-10 rounded-lg object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-night-800 font-display text-sm font-bold text-brand-400 ring-1 ring-white/10">
                        {initials(member.name)}
                      </span>
                    )}
                    <span className="font-display font-semibold uppercase tracking-wide text-white">
                      {member.name}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3 text-slate-300">{member.rank}</td>
                <td className="px-5 py-3 text-slate-400">{member.division}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(member)}
                      className="rounded p-2 text-slate-400 transition hover:bg-white/5 hover:text-brand-400"
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    {confirmDelete === member.id ? (
                      <button
                        onClick={() => void remove(member)}
                        className="rounded bg-red-500/20 px-2.5 py-1 font-display text-xs font-bold uppercase text-red-300"
                      >
                        Sure?
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(member.id)}
                        className="rounded p-2 text-slate-400 transition hover:bg-white/5 hover:text-red-400"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  No command members yet — add your first above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Member" : "Add Member"}
      >
        <div className="space-y-4">
          <div>
            <label className="field-label">Roblox / Display Name *</label>
            <input
              className="field"
              value={form.name}
              maxLength={60}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Lil_J765"
            />
          </div>
          <div>
            <label className="field-label">Rank *</label>
            <input
              className="field"
              value={form.rank}
              maxLength={80}
              onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}
              placeholder="e.g. Chief Operations Officer"
            />
          </div>
          <div>
            <label className="field-label">Division</label>
            <input
              className="field"
              value={form.division}
              maxLength={40}
              onChange={(e) => setForm((f) => ({ ...f, division: e.target.value }))}
              placeholder="e.g. Operations"
            />
          </div>
          <div>
            <label className="field-label">Avatar</label>
            <div className="flex items-center gap-4">
              {form.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.avatar_url}
                  alt="avatar preview"
                  className="h-16 w-16 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-night-800 font-display text-xl font-bold text-brand-400 ring-1 ring-white/10">
                  {initials(form.name) || "?"}
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-lg border border-white/15 px-3.5 py-2 font-display text-xs font-semibold uppercase tracking-wider text-slate-200 transition hover:border-brand-500/50 hover:text-brand-400">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadAvatar(file);
                        setForm((f) => ({ ...f, avatar_url: url }));
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Upload failed");
                      }
                    }}
                  />
                </label>
                {form.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatar_url: null }))}
                    className="rounded-lg border border-red-500/30 px-3.5 py-2 font-display text-xs font-semibold uppercase tracking-wider text-red-400 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Tip — leave blank to auto-generate an initials avatar.
            </p>
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? "Saving…" : editing ? "Save Changes" : "Add Member"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
