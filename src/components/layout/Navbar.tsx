"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { APPLY_FORM_URL } from "@/lib/constants";

const LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Command", href: "/#command" },
  { label: "Gallery", href: "/#gallery" },
  { label: "Updates", href: "/newsletter" },
];

type NavbarProps = {
  recruitmentOpen: boolean;
};

export default function Navbar({ recruitmentOpen }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled || open
          ? "border-b border-white/10 bg-night-950"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Southern Cross Towing"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-contain"
            priority
          />
          <div className="leading-none">
            <span className="block font-display text-lg font-bold uppercase tracking-wider text-white">
              Southern Cross
            </span>
            <span className="block font-display text-[11px] font-semibold uppercase tracking-[0.35em] text-brand-400">
              Towing
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded px-3.5 py-2 font-display text-sm font-semibold uppercase tracking-widest text-slate-300 transition hover:bg-white/5 hover:text-brand-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded border border-white/15 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-slate-300 transition hover:border-brand-500/50 hover:text-brand-400"
          >
            <LogIn size={15} /> Staff Login
          </Link>
          <span
            className={cn(
              "flex items-center gap-2 rounded-sm border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest",
              recruitmentOpen
                ? "border-emerald-500 text-emerald-400"
                : "border-red-500 text-red-400"
            )}
          >
            <span
              className={cn(
                "h-2 w-2",
                recruitmentOpen ? "bg-emerald-400" : "bg-red-400"
              )}
            />
            {recruitmentOpen ? "Recruitment Open" : "Recruitment Closed"}
          </span>
          <a
            href={APPLY_FORM_URL}
            className="rounded-sm bg-brand-500 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition-colors hover:bg-brand-400"
          >
            Apply Now
          </a>
        </div>

        <button
          className="rounded p-2 text-slate-300 transition hover:bg-white/5 hover:text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-night-950 px-4 pb-6 pt-2 lg:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded px-3 py-3 font-display text-base font-semibold uppercase tracking-widest text-slate-200 transition hover:bg-white/5 hover:text-brand-400"
              >
                {link.label}
              </Link>
            ))}
            <span className="my-1 h-px bg-white/10" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded px-3 py-3 font-display text-base font-semibold uppercase tracking-widest text-brand-400 transition hover:bg-white/5"
            >
              <LogIn size={16} /> Staff Login
            </Link>
          </nav>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span
              className={cn(
                "text-[11px] font-semibold uppercase tracking-widest",
                recruitmentOpen ? "text-emerald-400" : "text-red-400"
              )}
            >
              {recruitmentOpen ? "● Recruitment Open" : "● Recruitment Closed"}
            </span>
            <a
              href={APPLY_FORM_URL}
              onClick={() => setOpen(false)}
              className="rounded bg-brand-500 px-4 py-2 font-display text-sm font-semibold uppercase tracking-wider text-night-950"
            >
              Apply Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
