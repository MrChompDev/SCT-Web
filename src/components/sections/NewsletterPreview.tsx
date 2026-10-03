import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { formatDate } from "@/lib/utils";
import type { Newsletter } from "@/types";

export default function NewsletterPreview({ posts }: { posts: Newsletter[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="border-t border-white/5 bg-night-900/40 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Community Updates"
          title="The Weekly Sitrep"
          sub="Operational milestones, fleet news and crew announcements — straight from Command."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/newsletter/${post.id}`}
              className="group rounded-2xl border border-white/10 bg-night-900/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-xl hover:shadow-brand-500/10 sm:p-7"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-brand-500/10 p-2 text-brand-400 ring-1 ring-brand-500/25">
                  <Newspaper size={16} />
                </span>
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {formatDate(post.created_at)}
                  {post.author ? ` — ${post.author}` : ""}
                </p>
              </div>
              <h3 className="mt-4 font-display text-xl font-bold uppercase leading-snug tracking-wide text-white transition group-hover:text-brand-400">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-relaxed text-slate-400">
                {post.body}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-widest text-brand-400">
                Read Sitrep <ArrowRight size={14} className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/newsletter"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-6 py-3 font-display text-sm font-semibold uppercase tracking-wider text-white transition hover:border-brand-500/60 hover:text-brand-400"
          >
            All Updates <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
