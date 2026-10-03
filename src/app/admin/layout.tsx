import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, ShieldX } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase-server";
import type { Profile } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-night-950 p-4">
        <div className="card max-w-md p-8 text-center">
          <Database size={32} className="mx-auto text-brand-400" />
          <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white">
            Dashboard Not Connected
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            The executive dashboard runs on Supabase. Create a free project
            at{" "}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:underline"
            >
              supabase.com
            </a>
            , run <code className="rounded bg-night-800 px-1.5 py-0.5 text-xs">supabase/schema.sql</code>{" "}
            in the SQL editor, and paste your keys into{" "}
            <code className="rounded bg-night-800 px-1.5 py-0.5 text-xs">.env.local</code>.
            Full walkthrough in the README.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg border border-white/15 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-white transition hover:border-brand-500/50 hover:text-brand-400"
          >
            Back To Public Site
          </Link>
        </div>
      </div>
    );
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile || !["executive", "admin"].includes(profile.role)) {
    // First user through the door bootstraps as executive (see README).
    const { data: claimed } = await supabase.rpc("claim_first_executive");
    if (claimed === "promoted") {
      redirect("/admin");
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-night-950 p-4">
        <div className="card max-w-md p-8 text-center">
          <ShieldX size={32} className="mx-auto text-red-400" />
          <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white">
            Access Denied
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Signed in as <span className="text-white">{user.email}</span>, but
            this account doesn't hold an executive role. Ask an existing
            executive to promote you from the database (see README —
            "Promoting additional executives").
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg border border-white/15 px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wider text-white transition hover:border-brand-500/50 hover:text-brand-400"
          >
            Back To Public Site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-950">
      <AdminSidebar email={user.email ?? "crew member"} role={profile.role} />
      <div className="lg:pl-64">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
