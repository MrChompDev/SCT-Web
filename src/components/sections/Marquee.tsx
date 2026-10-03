const ITEMS = [
  "24/7 Heavy Recovery",
  "Flatbed Transport",
  "Winch-Outs",
  "Rollover UpRighting",
  "Scene Support",
  "FRNSW & NSWPF Joint Ops",
  "Impound Transport",
  "Jump Starts",
];

export default function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="relative">
      <div className="hazard h-2 w-full" />
      <div className="overflow-hidden border-y border-white/5 bg-night-900 py-3.5">
        <div className="marquee-track items-center gap-0">
          {row.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="flex shrink-0 items-center gap-6 pr-6 font-display text-sm font-bold uppercase tracking-[0.25em] text-slate-400"
            >
              {item}
              <span className="text-brand-500">◆</span>
            </span>
          ))}
        </div>
      </div>
      <div className="hazard h-2 w-full" />
    </div>
  );
}
