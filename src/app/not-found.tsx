import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-bold text-brand-500">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-wide text-white">
        This Scene Is Clear
      </h1>
      <p className="mt-3 max-w-md text-slate-400">
        The page you're looking for has been towed. Nothing to see here —
        dispatch has moved on.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-night-950 transition hover:bg-brand-400"
      >
        <AlertTriangle size={16} /> Back To Base
      </Link>
    </div>
  );
}
