import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getNewsletters } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const posts = await getNewsletters();
  const post = posts.find((p) => p.id === params.id);
  return { title: post ? post.title : "Sitrep" };
}

export default async function NewsletterDetailPage({ params }: Props) {
  const posts = await getNewsletters();
  const post = posts.find((p) => p.id === params.id);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <Link
        href="/newsletter"
        className="inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-widest text-slate-400 transition hover:text-brand-400"
      >
        <ArrowLeft size={14} /> All Updates
      </Link>

      <p className="mt-8 font-display text-xs font-semibold uppercase tracking-[0.3em] text-brand-400">
        The Weekly Sitrep
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold uppercase leading-tight tracking-wide text-white sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        {formatDate(post.created_at)}
        {post.author ? ` — by ${post.author}` : ""}
      </p>
      <div className="mt-6 h-1 w-16 rounded-full bg-gradient-to-r from-brand-500 to-transparent" />

      <div className="prose-invert mt-10 whitespace-pre-line text-base leading-relaxed text-slate-300">
        {post.body}
      </div>

      <div className="hazard mt-14 h-2 rounded-full opacity-60" />
    </article>
  );
}
