import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper } from "lucide-react";
import { getNewsletters } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Community Updates",
  description:
    "Weekly newsletters and operational milestones from Southern Cross Towing Command.",
};

export default async function NewsletterPage() {
  const posts = await getNewsletters();

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.3em] text-brand-400">
        Community Updates
      </p>
      <h1 className="mt-3 font-display text-5xl font-bold uppercase tracking-wide text-white">
        The Weekly Sitrep
      </h1>
      <p className="mt-4 max-w-xl text-slate-400">
        Operational milestones, fleet news and crew announcements — published
        by Command and mirrored to our Discord.
      </p>
      <div className="mt-8 h-1 w-16 bg-brand-500" />

      {posts.length === 0 ? (
        <div className="card mt-12 flex flex-col items-center gap-3 p-12 text-center">
          <Newspaper size={32} className="text-brand-400" />
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">
            First sitrep coming soon
          </h2>
          <p className="max-w-sm text-sm text-slate-400">
            Command hasn't published any updates yet. Check back soon — or
            hit the Discord for day-to-day chatter.
          </p>
        </div>
      ) : (
        <div className="mt-12 space-y-4">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/newsletter/${post.id}`}
              className="group block rounded-md border border-white/10 bg-night-900 p-6 transition-colors hover:border-brand-500 sm:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-sm bg-night-800 p-2 text-brand-400">
                  <Newspaper size={15} />
                </span>
                <p className="font-display text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {formatDate(post.created_at)}
                  {post.author ? ` — ${post.author}` : ""}
                </p>
              </div>
              <h2 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide text-white transition group-hover:text-brand-400">
                {post.title}
              </h2>
              <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-slate-400">
                {post.body}
              </p>
              <span className="mt-4 inline-block font-display text-xs font-semibold uppercase tracking-widest text-brand-400">
                Read Sitrep →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
