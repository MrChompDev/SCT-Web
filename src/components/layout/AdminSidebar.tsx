"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permissions } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  perm?: keyof Permissions | null;
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true, perm: null },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList, perm: "applications" },
  { href: "/admin/staff", label: "Staff Manager", icon: Users, perm: "staff" },
  { href: "/admin/gallery", label: "Gallery", icon: Images, perm: "gallery" },
  { href: "/admin/newsletter", label: "Sitrep Editor", icon: Newspaper, perm: "newsletter" },
  { href: "/admin/settings", label: "Site Settings", icon: Settings, perm: "settings" },
  { href: "/admin/team", label: "Team & Perms", icon: UserCog, perm: "team" },
];

type AdminSidebarProps = {
  email: string;
  role: string;
  perms: Permissions;
};

export default function AdminSidebar({ email, role, perms }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    try {
      const { getSupabaseBrowserClient } = await import("@/lib/supabase");
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore — session cookie will expire naturally
    }
    router.push("/");
    router.refresh();
  }

  const nav = (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <Image
          src="/logo.png"
          alt="Southern Cross Towing"
          width={36}
          height={36}
          className="h-9 w-9 rounded-md object-contain"
        />
        <div className="leading-none">
          <span className="block font-display text-base font-bold uppercase tracking-wider text-white">
            Southern Cross
          </span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.3em] text-brand-400">
            Command Panel
          </span>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.filter((item) => !item.perm || perms[item.perm]).map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-3 py-2.5 font-display text-sm font-semibold uppercase tracking-widest transition-colors",
                  active
                    ? "bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
              <item.icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          <ExternalLink size={16} /> View Public Site
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400/80 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={16} /> Sign Out
        </button>
        <p className="truncate px-3 pt-2 text-xs text-slate-600" title={email}>
          {email} · <span className="uppercase">{role}</span>
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-night-950 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-contain"
          />
          <span className="font-display text-base font-bold uppercase tracking-wider text-white">
            Command Panel
          </span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded p-2 text-slate-300 hover:bg-white/5"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex bg-night-950/90 lg:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-white/10 bg-night-900">
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-night-900 lg:flex">
        {nav}
      </aside>
    </>
  );
}
