import type { Metadata } from "next";
import { ClipboardCheck, MessageSquare, ShieldCheck } from "lucide-react";
import ApplyForm from "./ApplyForm";
import { getSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join The Crew",
  description:
    "Apply to join Southern Cross Towing — New South Wales' virtual heavy recovery and incident management crew.",
};

const REQUIREMENTS = [
  "Reliable attendance and clear comms discipline",
  "Calm and professional under pressure on-scene",
  "Willingness to train across multiple divisions",
  "Respect for crew, partner agencies and the public",
];

const PROCESS = [
  {
    icon: ClipboardCheck,
    title: "Submit Application",
    text: "Fill in the form — takes two minutes. Command reviews every application.",
  },
  {
    icon: MessageSquare,
    title: "Command Review",
    text: "We reach out on Discord to run through your application and answer questions.",
  },
  {
    icon: ShieldCheck,
    title: "Trial Shift",
    text: "Run a supervised shift with a training officer. Pass, and you're issued keys and a radio.",
  },
];

export default async function ApplyPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
            Recruitment
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold uppercase leading-tight tracking-wide text-white sm:text-6xl">
            Join Southern Cross
            <br />
            <span className="text-brand-400">Towing</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
            Whether you want to run the heavy wreckers, escort flatbeds or
            hold down scene support with our FRNSW and NSWPF partners — there's
            a seat for you in the truck.
          </p>

          <div className="mt-10">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">
              What We Look For
            </h2>
            <ul className="mt-4 space-y-2.5">
              {REQUIREMENTS.map((r) => (
                <li key={r} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rotate-45 bg-brand-500" />
                  {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 space-y-4">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-white">
              The Process
            </h2>
            {PROCESS.map((step, i) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/25">
                    <step.icon size={18} />
                  </span>
                  {i < PROCESS.length - 1 && (
                    <span className="mt-1 h-full w-px bg-gradient-to-b from-brand-500/40 to-transparent" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="font-display text-base font-semibold uppercase tracking-wide text-white">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ApplyForm recruitmentOpen={settings.recruitment_open} />
      </div>
    </div>
  );
}
