"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageUploaderProps = {
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  onRemove?: () => void;
  /** Label above the preview (e.g. "Staff Avatar"). */
  label: string;
  /** Called with the picked file — perform the actual upload here, return the public URL. */
  upload: (file: File) => Promise<string>;
  className?: string;
  rounded?: boolean;
};

export default function ImageUploader({
  currentUrl,
  onUploaded,
  onRemove,
  label,
  upload,
  className,
  rounded,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      const url = await upload(file);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <span className="field-label">{label}</span>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden border border-dashed border-white/15 bg-night-800/60 p-3 text-center transition hover:border-brand-500/50",
          dragging && "border-brand-500 bg-brand-500/5",
          rounded ? "rounded-full" : "rounded-md",
          rounded ? "aspect-square w-28" : "h-40",
          !rounded && "py-6"
        )}
      >
        {currentUrl ? (
          <div className={cn("relative h-full w-full", rounded && "rounded-full")}>
            <Image
              src={currentUrl}
              alt={label}
              fill
              sizes={rounded ? "112px" : "384px"}
              className={cn("object-cover", rounded && "rounded-full")}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-night-950/70 opacity-0 transition group-hover:opacity-100">
              <RefreshCw size={18} className="text-brand-400" />
            </div>
          </div>
        ) : busy ? (
          <Loader2 size={20} className="animate-spin text-brand-400" />
        ) : (
          <>
            <ImagePlus size={20} className="text-slate-500" />
            <span className="font-display text-xs uppercase tracking-widest text-slate-500">
              Drop / click to upload
            </span>
          </>
        )}
        {busy && currentUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-night-950/70">
            <Loader2 size={20} className="animate-spin text-brand-400" />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {currentUrl && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-red-400"
        >
          <Trash2 size={12} /> Remove
        </button>
      )}
    </div>
  );
}
