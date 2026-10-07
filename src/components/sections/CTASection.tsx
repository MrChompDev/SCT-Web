import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { APPLY_FORM_URL } from "@/lib/constants";
import type { SiteSettings } from "@/types";

export default function CTASection({ settings }: { settings: SiteSettings }) {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="hazard absolute inset-x-0 top-0 h-2 opacity-70" />
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="font-display text-4xl font-bold uppercase leading-tight tracking-wide text-white sm:text-6xl">
          Ready To Run With{" "}
          <span className="text-brand-400">The Best?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
          We're always on the lookout for dependable hands behind the
          wheel and on the radio. If you've got comms discipline and cool
          under pressure, Command wants to hear from you.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href={APPLY_FORM_URL} size="lg">
            Apply To Join <ArrowRight size={18} />
          </Button>
          <span
            className={`rounded-sm border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${
              settings.recruitment_open
                ? "border-emerald-500 text-emerald-400"
                : "border-red-500 text-red-400"
            }`}
          >
            {settings.recruitment_open
              ? "Applications Open"
              : "Applications Closed"}
          </span>
        </div>
      </div>
      <div className="hazard absolute inset-x-0 bottom-0 h-2 opacity-70" />
    </section>
  );
}
