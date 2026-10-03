import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Images,
  Newspaper,
  Users,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { timeAgo } from "@/lib/utils";
import type { Application } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  denied: "bg-red-500/10 text-red-400 ring-red-500/30",
};

export default async function AdminDashboard() {
  if (!isSupabaseConfigured) return null; // layout renders the setup notice
  const supabase = await getSupabaseServerClient();

  const [appsPending, appsTotal, staff, gallery, posts, settings, recent] =
    await Promise.all([
      supabase
        .from("applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("applications").select("id", { count: "exact", head: true }),
      supabase.from("staff_members").select("id", { count: "exact", head: true }),
      supabase.from("gallery").select("id", { count: "exact", head: true }),
      supabase.from("newsletters").select("id", { count: "exact", head: true }),
      supabase.from("site_settings").select("recruitment_open").eq("id", 1).maybeSingle(),
      supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const schemaReady = appsPending.error === null;
  const recruitmentOpen = settings.data?.recruitment_open ?? true;

  const stats = [
    {
      label: "Pending Applications",
      value: appsPending.count ?? 0,
      icon: ClipboardList,
      href: "/admin/applications",
      accent: (appsPending.count ?? 0) > 0,
    },
    { label: "Command Staff", value: staff.count ?? 0, icon: Users, href: "/admin/staff" },
    { label: "Gallery Images", value: gallery.count ?? 0, icon: Images, href: "/admin/gallery" },
    { label: "Sitreps Published", value: posts.count ?? 0, icon: Newspaper, href: "/admin/newsletter" },
  ];

  const recentApps = (recent.data ?? []) as Application[];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
            Executive Dashboard
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-wide text-white">
            Sitrep Overview
          </h1>
        </div>
        <span
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${
            recruitmentOpen
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          Recruitment {recruitmentOpen ? "Open" : "Closed"}
        </span>
      </div>

      {!schemaReady && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            Couldn't read the database — make sure you've run{" "}
            <code className="rounded bg-night-800 px-1.5 py-0.5 text-xs">supabase/schema.sql</code>{" "}
            in the Supabase SQL editor. Until then, numbers may read as zero.
          </p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`card p-5 transition hover:-translate-y-0.5 hover:border-brand-500/40 ${
              stat.accent ? "border-brand-500/40 bg-brand-500/[0.06]" : ""
            }`}
          >
            <stat.icon size={20} className="text-brand-400" />
            <p className="mt-3 font-display text-4xl font-bold text-white">
              {stat.value}
            </p>
            <p className="mt-1 font-display text-xs font-semibold uppercase tracking-widest text-slate-400">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
              Latest Applications
            </h2>
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1 font-display text-xs font-semibold uppercase tracking-widest text-brand-400 hover:underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              No applications yet. When crew hopefuls hit /apply, they'll land here.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-white/5">
              {recentApps.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold uppercase tracking-wide text-white">
                      {app.roblox_username}
                    </p>
                    <p className="text-xs text-slate-500">
                      @{app.discord_username} · {timeAgo(app.created_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-widest ring-1 ${
                      STATUS_STYLES[app.status]
                    }`}
                  >
                    {app.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
            Quick Actions
          </h2>
          <div className="mt-5 space-y-2.5">
            {[
              { label: "Publish a weekly sitrep", href: "/admin/newsletter" },
              { label: "Add a command member", href: "/admin/staff" },
              { label: "Upload on-the-job shots", href: "/admin/gallery" },
              { label: "Toggle recruitment / hero text", href: "/admin/settings" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-lg border border-white/10 px-4 py-3 text-sm text-slate-300 transition hover:border-brand-500/40 hover:text-brand-400"
              >
                {action.label}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
