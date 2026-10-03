import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import type { SiteSettings } from "@/types";

type HeroProps = {
  settings: SiteSettings;
  staffCount: number;
  galleryCount: number;
};

export default function Hero({ settings, staffCount, galleryCount }: HeroProps) {
  const heading = settings.hero_heading || "Keeping New South Wales Moving";

  return (
    <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden">
      <Image
        src="/images/header.webp"
        alt="Southern Cross Towing heavy recovery crew on scene"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-night-950/40 to-night-950/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-night-950/80 via-transparent to-night-950/30" />
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-brand-500/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-0 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 font-display text-xs font-semibold uppercase tracking-[0.25em] text-brand-400 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Virtual Heavy Recovery & Incident Management — NSW
          </p>

          <h1 className="mt-6 font-display text-6xl font-bold uppercase leading-[0.95] tracking-wide text-white drop-shadow-lg sm:text-7xl lg:text-8xl">
            {heading}
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            {settings.hero_subtext}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href="/apply" size="lg">
              Apply To Join <ArrowRight size={18} />
            </Button>
            <Button href="/#gallery" variant="outline" size="lg">
              See Us In Action <ChevronDown size={18} />
            </Button>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-white/10 backdrop-blur-md sm:grid-cols-4">
          {[
            { value: "24/7", label: "Dispatch Response" },
            { value: String(staffCount), label: "Command Staff" },
            { value: "4", label: "Service Divisions" },
            { value: `${galleryCount}+`, label: "Operations Logged" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-night-950/80 px-5 py-6 transition hover:bg-night-900/80"
            >
              <p className="font-display text-3xl font-bold text-brand-400">
                {stat.value}
              </p>
              <p className="mt-1 font-display text-xs font-semibold uppercase tracking-widest text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
