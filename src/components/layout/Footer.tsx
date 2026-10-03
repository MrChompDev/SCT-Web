import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube } from "lucide-react";
import type { SiteSettings } from "@/types";

const NAV = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Command", href: "/#command" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Updates", href: "/newsletter" },
  { label: "Apply", href: "/apply" },
];

const DIVISIONS = [
  "Roadside Recovery",
  "Heavy Recovery",
  "Flatbed Transport",
  "Scene Support",
];

export default function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="relative border-t border-white/10 bg-night-900/60">
      <div className="hazard h-1.5 w-full opacity-60" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src={settings.logo_url ?? "/logo.png"}
              alt="Southern Cross Towing"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-contain"
            />
            <div className="leading-none">
              <span className="block font-display text-xl font-bold uppercase tracking-wider text-white">
                Southern Cross
              </span>
              <span className="block font-display text-xs font-semibold uppercase tracking-[0.35em] text-brand-400">
                Towing
              </span>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            Virtual heavy recovery and incident management. First on scene,
            last to leave — keeping roleplay roads clear across New South Wales.
          </p>
          <div className="mt-5 flex gap-2">
            {[
              { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
              { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
              { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
            ].map(({ icon: Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-brand-500/50 hover:text-brand-400"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white">
            Navigate
          </h3>
          <ul className="mt-4 space-y-2.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-slate-400 transition hover:text-brand-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white">
            Divisions
          </h3>
          <ul className="mt-4 space-y-2.5">
            {DIVISIONS.map((d) => (
              <li key={d} className="flex items-center gap-2 text-sm text-slate-400">
                <span className="h-1 w-1 rounded-full bg-brand-500" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-white">
            Join The Crew
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Think you've got what it takes to run with the state's
            busiest virtual tow crew?
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            <Link
              href="/apply"
              className="rounded bg-brand-500 px-4 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition hover:bg-brand-400"
            >
              Apply Now
            </Link>
            {settings.discord_url && (
              <a
                href={settings.discord_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded border border-white/15 px-4 py-2.5 text-center font-display text-sm font-semibold uppercase tracking-wider text-slate-200 transition hover:border-brand-500/50 hover:text-brand-400"
              >
                Discord Community
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-xs text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>
            © {new Date().getFullYear()} Southern Cross Towing. All scenes,
            smiles and straightened rigs reserved.
          </p>
          <p className="max-w-xl leading-relaxed">
            Southern Cross Towing is a fictional towing and incident management
            crew operated for roleplay purposes. Not a real roadside service.
            References to FRNSW & NSWPF denote roleplay emergency service
            communities.
          </p>
        </div>
      </div>
    </footer>
  );
}
