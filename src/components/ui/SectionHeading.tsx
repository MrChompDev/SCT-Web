type SectionHeadingProps = {
  kicker: string;
  title: string;
  sub?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  kicker,
  title,
  sub,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"
      }
    >
      <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
        {kicker}
      </p>
      <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-tight tracking-wide text-white sm:text-5xl">
        {title}
      </h2>
      {sub && (
        <p className="mt-4 text-base leading-relaxed text-slate-400">{sub}</p>
      )}
      <div
        className={
          align === "center"
            ? "mx-auto mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-transparent via-brand-500 to-transparent"
            : "mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-transparent"
        }
      />
    </div>
  );
}
