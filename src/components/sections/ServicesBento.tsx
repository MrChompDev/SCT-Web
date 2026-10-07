import Image from "next/image";
import {
  BatteryCharging,
  Clock,
  Siren,
  Truck,
  Container,
  type LucideIcon,
} from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

type Service = {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: boolean;
  wide?: boolean;
  accent?: boolean;
};

const SERVICES: Service[] = [
  {
    icon: Truck,
    title: "Heavy Recovery",
    description:
      "Heavy division operations for uprighting semi-trucks, buses and overturned rigs — with full scene control from chocks to clean-up.",
    image: true,
    wide: true,
  },
  {
    icon: BatteryCharging,
    title: "Roadside Recovery",
    description:
      "Quick response for winch-outs, jump starts and minor rollovers to keep traffic moving.",
  },
  {
    icon: Container,
    title: "Flatbed Transport",
    description:
      "Safe hauling of damaged, seized or exotic vehicles to impound yards — strapped, covered and delivered.",
  },
  {
    icon: Siren,
    title: "Scene Support",
    description:
      "Collaborative traffic and collision clearance working alongside virtual emergency services like FRNSW and NSWPF.",
  },
  {
    icon: Clock,
    title: "24/7 Dispatch",
    description:
      "Night or day, highway or back street — dispatch never sleeps and neither does the crew.",
    accent: true,
  },
];

export default function ServicesBento() {
  return (
    <section id="services" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="What We Do"
          title="Full-Service Recovery, Around The Clock"
          sub="From a battery jump on the shoulder to a fully controlled semi rollover — Southern Cross handles the scene so the state keeps flowing."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {SERVICES.map((service) => (
            <div
              key={service.title}
              className={`group relative overflow-hidden rounded-md border transition-colors ${
                service.wide ? "md:col-span-2" : ""
              } ${
                service.accent
                  ? "border-brand-500/40 bg-brand-500/10"
                  : "border-white/10 bg-night-900 hover:border-brand-500/40"
              }`}
            >
              {service.image && (
                <>
                  <Image
                    src="/images/gallery-1.webp"
                    alt="Heavy recovery operation"
                    fill
                    sizes="(min-width: 768px) 66vw, 100vw"
                    className="object-cover opacity-45"
                  />
                  <div className="absolute inset-0 bg-night-950/60" />
                </>
              )}
              <div className="relative flex h-full flex-col p-6 sm:p-8">
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-sm ${
                    service.accent || service.image
                      ? "bg-brand-500 text-night-950"
                      : "bg-night-800 text-brand-400 ring-1 ring-white/10 transition group-hover:bg-brand-500 group-hover:text-night-950"
                  }`}
                >
                  <service.icon size={22} />
                </span>
                <h3 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide text-white">
                  {service.title}
                </h3>
                <p
                  className={`mt-2.5 text-sm leading-relaxed text-slate-400 ${
                    service.wide ? "max-w-md" : ""
                  }`}
                >
                  {service.description}
                </p>
                {service.image && (
                  <span className="mt-4 inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-brand-400">
                    <span className="hazard h-1 w-10" />
                    Heavy Division
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
