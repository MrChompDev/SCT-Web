"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, MailCheck, ShieldAlert, UserPlus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginClient({ discordEnabled }: { discordEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | "discord" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setConfirmSent(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy("email");
    setError(null);
    setConfirmSent(false);
    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === "signin") {
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
      } else {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
          return;
        }
        // Email confirmation enabled — ask them to verify before signing in.
        if (!data.session) {
          setConfirmSent(true);
          return;
        }
        router.push("/admin");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Is the site connected to Supabase?"
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
      <div className="card relative w-full max-w-sm p-8">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Southern Cross Towing"
            width={56}
            height={56}
            className="h-14 w-14 rounded-md object-contain"
          />
          <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wider text-white">
            {mode === "signin" ? "Command Login" : "Create Account"}
          </h1>
          <p className="mt-1.5 text-xs uppercase tracking-widest text-slate-500">
            {mode === "signin"
              ? "Executive dashboard access only"
              : "Staff sign-up — permissions granted by Command"}
          </p>
        </div>

        {confirmSent ? (
          <div className="mt-8 text-center">
            <MailCheck size={32} className="mx-auto text-emerald-400" />
            <h2 className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-white">
              Check your inbox
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              We sent a confirmation link to{" "}
              <span className="text-white">{email}</span>. Click it, then come
              back and sign in.
            </p>
            <p className="mt-3 rounded-sm border border-amber-500/40 bg-amber-500/10 p-3 text-left text-xs leading-relaxed text-amber-300">
              The link only works once, and requesting a new email invalidates
              older ones — always open the <strong>newest</strong> message.
              Getting <em>&ldquo;link is invalid or expired&rdquo;</em>? Sign
              up again to trigger a fresh email, or ask the site owner to turn
              off email confirmation in Supabase (see README).
            </p>
            <button
              onClick={() => switchMode("signin")}
              className="mt-5 text-xs text-brand-400 transition hover:underline"
            >
              ← Back to sign in
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="mt-8 space-y-4">
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
                  minLength={6}
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === "signup" && (
                  <p className="mt-1.5 text-xs text-slate-600">
                    At least 6 characters. Hashed with bcrypt — never stored in
                    plain text.
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-sm border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy !== null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-brand-500 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition-colors hover:bg-brand-400 disabled:opacity-60"
              >
                {busy === "email" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : mode === "signin" ? (
                  <LogIn size={16} />
                ) : (
                  <UserPlus size={16} />
                )}
                {mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-500">
              {mode === "signin" ? (
                <>
                  New staff member?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="font-semibold text-brand-400 transition hover:underline"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("signin")}
                    className="font-semibold text-brand-400 transition hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>

            {discordEnabled && (
              <>
                <div className="my-5 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-xs uppercase tracking-widest text-slate-600">
                    or
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <button
                  onClick={signInWithDiscord}
                  disabled={busy !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-sm border border-indigo-400/40 bg-indigo-500/10 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wider text-indigo-300 transition-colors hover:bg-indigo-500/20 disabled:opacity-60"
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
              </>
            )}
          </>
        )}

        <p className="mt-6 flex items-start gap-2 text-center text-xs leading-relaxed text-slate-500">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          The first account created after setup is automatically promoted to
          executive. Everyone else needs an executive to grant permissions from
          the dashboard.
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
