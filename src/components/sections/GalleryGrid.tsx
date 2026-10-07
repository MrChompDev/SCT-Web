"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import type { GalleryItem } from "@/types";

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (dir: 1 | -1) => {
      setActive((cur) =>
        cur === null ? null : (cur + dir + items.length) % items.length
      );
    },
    [items.length]
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, close, step]);

  const current = active !== null ? items[active] : null;

  return (
    <section id="gallery" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="On The Job"
          title="Scenes From The Field"
          sub="Heavy wrecker ops, flatbed hauls, night-time hazmat control and multi-agency coordination — captured on the job."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActive(i)}
              className="group relative aspect-[4/3] overflow-hidden rounded-md border border-white/10 text-left transition-colors hover:border-brand-500/40"
            >
              <Image
                src={item.image_url}
                alt={item.caption ?? "Southern Cross Towing operation"}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-night-950/80 p-4">
                <p className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                  {item.caption ?? "On the job"}
                </p>
                <span className="shrink-0 rounded-sm bg-night-800 p-2 text-brand-400 opacity-0 transition group-hover:opacity-100">
                  <Expand size={14} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {current && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-night-950/95 p-4"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-4 top-4 rounded-sm border border-white/10 bg-night-900 p-2.5 text-slate-300 transition-colors hover:border-brand-500/50 hover:text-brand-400"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-sm border border-white/10 bg-night-900 p-3 text-slate-200 transition-colors hover:border-brand-500/50 hover:text-brand-400"
                aria-label="Previous"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm border border-white/10 bg-night-900 p-3 text-slate-200 transition-colors hover:border-brand-500/50 hover:text-brand-400"
                aria-label="Next"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          <figure
            className="max-h-full w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image_url}
              alt={current.caption ?? "Southern Cross Towing operation"}
              className="mx-auto max-h-[82vh] w-auto max-w-full rounded-sm border border-white/10 object-contain"
            />
            <figcaption className="mt-4 flex items-center justify-between gap-4">
              <p className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                {current.caption ?? "On the job"}
              </p>
              <span className="rounded-sm border border-white/10 px-2.5 py-1 font-display text-xs font-semibold text-brand-400">
                {(active ?? 0) + 1} / {items.length}
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </section>
  );
}
