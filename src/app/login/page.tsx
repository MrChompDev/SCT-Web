"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, ShieldAlert } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | "discord" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Is the site connected to Supabase?"
      );
    } finally {
      setBusy(null);
    }
  }

  async function signInWithDiscord() {
    setBusy("discord");
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Discord sign-in failed. Has the Discord provider been enabled in Supabase?"
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,165,36,0.08),transparent_55%)]" />
      <div className="card relative w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Southern Cross Towing"
            width={56}
            height={56}
            className="h-14 w-14 rounded-xl object-contain"
          />
          <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wider text-white">
            Command Login
          </h1>
          <p className="mt-1.5 text-xs uppercase tracking-widest text-slate-500">
            Executive dashboard access only
          </p>
        </div>

        <form onSubmit={signIn} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field"
              required
              autoComplete="email"
              placeholder="command@…"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy !== null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition hover:bg-brand-400 disabled:opacity-60"
          >
            {busy === "email" ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            Sign In
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-widest text-slate-600">or</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          onClick={signInWithDiscord}
          disabled={busy !== null}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-60"
        >
          {busy === "discord" ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
              <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.27 18.27 0 0 0-5.5 0 12.6 12.6 0 0 0-.62-1.25.08.08 0 0 0-.08-.04 19.74 19.74 0 0 0-4.88 1.52.07.07 0 0 0-.03.03C.53 9.05-.32 13.58.1 18.06a.08.08 0 0 0 .03.05 19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.1 13.1 13.1 0 0 1-1.87-.9.08.08 0 0 1-.01-.13c.13-.09.25-.19.37-.29a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.3a.08.08 0 0 1-.01.12c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.1c.36.7.77 1.37 1.22 2a.08.08 0 0 0 .08.03 19.84 19.84 0 0 0 6.02-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.68-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
            </svg>
          )}
          Continue with Discord
        </button>

        <p className="mt-6 flex items-start gap-2 text-center text-xs leading-relaxed text-slate-500">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          The first account to sign in after setup is automatically promoted
          to executive. Everyone else needs approval from an existing
          executive.
        </p>
        <p className="mt-4 text-center">
          <Link href="/" className="text-xs text-slate-500 transition hover:text-brand-400">
            ← Back to the public site
          </Link>
        </p>
      </div>
    </div>
  );
}
