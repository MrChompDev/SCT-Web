import Image from "next/image";
import SectionHeading from "@/components/ui/SectionHeading";
import { initials } from "@/lib/utils";
import type { StaffMember } from "@/types";

export default function StaffGrid({ staff }: { staff: StaffMember[] }) {
  return (
    <section
      id="command"
      className="relative scroll-mt-24 border-y border-white/5 bg-night-900/40 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Command & Leadership"
          title="The People Running The Show"
          sub="Seven leaders, one crew, zero scenes left unattended — the command structure behind every Southern Cross callout."
        />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {staff.map((member) => (
            <div
              key={member.id}
              className="group rounded-2xl border border-white/10 bg-night-900/80 p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/10"
            >
              <div className="relative mx-auto h-24 w-24">
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.name}
                    fill
                    sizes="96px"
                    className="rounded-2xl object-cover ring-2 ring-white/10 transition group-hover:ring-brand-500/50"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-night-700 to-night-800 font-display text-3xl font-bold text-brand-400 ring-2 ring-white/10 transition group-hover:ring-brand-500/50">
                    {initials(member.name)}
                  </div>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-white">
                {member.name}
              </h3>
              <p className="mt-1.5 inline-block rounded-md bg-brand-500/10 px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-widest text-brand-400 ring-1 ring-brand-500/25">
                {member.rank}
              </p>
              <p className="mt-2 text-xs uppercase tracking-widest text-slate-500">
                {member.division} Division
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
