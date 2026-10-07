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
              className="group rounded-md border border-white/10 bg-night-900 p-6 text-center transition-colors hover:border-brand-500/40"
            >
              <div className="relative mx-auto h-24 w-24">
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={member.name}
                    fill
                    sizes="96px"
                    className="rounded-md object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-md bg-night-800 font-display text-3xl font-bold text-brand-400 ring-1 ring-white/10">
                    {initials(member.name)}
                  </div>
                )}
              </div>
              <h3 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-white">
                {member.name}
              </h3>
              <p className="mt-1.5 inline-block rounded-sm border border-brand-500/40 px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-widest text-brand-400">
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
