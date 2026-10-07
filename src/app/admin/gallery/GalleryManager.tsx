"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { resizeImage } from "@/lib/utils";
import { getSupabaseBrowserClient, supabaseStorageUrl } from "@/lib/supabase";
import type { GalleryItem } from "@/types";

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

export default function GalleryManager({
  initialItems,
}: {
  initialItems: GalleryItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setError(null);
    setUploading(list.length);

    const supabase = getSupabaseBrowserClient();
    let nextOrder = items.length
      ? Math.max(...items.map((i) => i.sort_order)) + 1
      : 1;

    for (const file of list) {
      try {
        const resized = await resizeImage(file, 1600, 0.85);
        const path = `gallery/${crypto.randomUUID()}.${resized.name.split(".").pop() ?? "webp"}`;
        const { error: upErr } = await supabase.storage
          .from("site-assets")
          .upload(path, resized, { contentType: resized.type });
        if (upErr) throw upErr;

        const { data, error: dbErr } = await supabase
          .from("gallery")
          .insert({
            image_url: supabaseStorageUrl(`site-assets/${path}`),
            caption: "",
            sort_order: nextOrder++,
          })
          .select()
          .single();
        if (dbErr) throw dbErr;
        setItems((cur) => [...cur, data as GalleryItem]);
      } catch (err) {
        setError(
          err instanceof Error
            ? `${file.name}: ${err.message}`
            : `${file.name} failed to upload`
        );
      } finally {
        setUploading((n) => n - 1);
      }
    }

    void audit("Gallery images uploaded", `${list.length} file(s)`);
    router.refresh();
  }

  async function saveCaption(item: GalleryItem, caption: string) {
    if (caption === (item.caption ?? "")) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.from("gallery").update({ caption }).eq("id", item.id);
    setItems((cur) =>
      cur.map((i) => (i.id === item.id ? { ...i, caption } : i))
    );
    router.refresh();
  }

  async function remove(item: GalleryItem) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.from("gallery").delete().eq("id", item.id);
      if (error) throw error;
      setItems((cur) => cur.filter((i) => i.id !== item.id));
      setConfirmDelete(null);
      void audit("Gallery image removed", item.caption ?? undefined);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
            On The Job
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
            Gallery Manager
          </h1>
          <p className="mt-2 max-w-lg text-sm text-slate-400">
            Drag-and-drop your best on-scene screenshots. They appear on the
            public gallery instantly.
          </p>
        </div>
        <label className="cursor-pointer rounded-sm bg-brand-500 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition-colors hover:bg-brand-400">
          <UploadCloud size={16} className="mr-2 inline" />
          Browse Files
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && void uploadFiles(e.target.files)}
          />
        </label>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "mt-8 flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-10 text-center transition-colors",
          dragging
            ? "border-brand-500 bg-brand-500/5"
            : "border-white/15 bg-night-900/40"
        )}
      >
        {uploading > 0 ? (
          <Loader2 size={28} className="animate-spin text-brand-400" />
        ) : (
          <ImagePlus size={28} className="text-slate-500" />
        )}
        <p className="font-display text-base font-semibold uppercase tracking-widest text-slate-300">
          {uploading > 0
            ? `Uploading ${uploading} image${uploading > 1 ? "s" : ""}…`
            : "Drop screenshots here"}
        </p>
        <p className="text-xs text-slate-500">
          PNG / JPG / WebP — auto-optimised on upload
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-sm border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="card group overflow-hidden transition hover:border-brand-500/40"
          >
            <div className="relative aspect-[16/10] bg-night-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.caption ?? "gallery image"}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() =>
                  confirmDelete === item.id
                    ? void remove(item)
                    : setConfirmDelete(item.id)
                }
                onBlur={() => setConfirmDelete(null)}
                className={cn(
                  "absolute right-2.5 top-2.5 rounded-sm p-2 transition",
                  confirmDelete === item.id
                    ? "bg-red-500 text-white"
                    : "bg-night-950/70 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-400"
                )}
                aria-label="Delete image"
              >
                {confirmDelete === item.id ? (
                  <span className="px-1 font-display text-xs font-bold uppercase">Sure?</span>
                ) : (
                  <Trash2 size={15} />
                )}
              </button>
            </div>
            <div className="p-3.5">
              <input
                className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 hover:border-white/10 focus:border-brand-500/50 focus:bg-night-800"
                placeholder="Add a caption…"
                defaultValue={item.caption ?? ""}
                onBlur={(e) => void saveCaption(item, e.target.value.trim())}
              />
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && uploading === 0 && (
        <p className="mt-8 text-center text-sm text-slate-500">
          Gallery is empty. The public site shows the starter gallery until
          you upload your own shots — anything you add here replaces it.
        </p>
      )}
    </div>
  );
}
