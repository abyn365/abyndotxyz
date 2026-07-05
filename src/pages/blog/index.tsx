import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight, EyeOff } from "lucide-react";
import { PageFooter } from "../../components/PageFooter";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  published: boolean;
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 1. Check admin status to know if we can see drafts
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.authenticated) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});

    // 2. Fetch posts
    fetch("/api/blog")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPosts(data.posts);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load blog posts:", err);
        setLoading(false);
      });
  }, []);

  // Helper to estimate reading time (approx 200 words per minute)
  const getReadingTime = (post: any) => {
    const wordCount = (post.content || "").split(/\s+/).length || 50;
    const time = Math.max(1, Math.round(wordCount / 200));
    return `${time} min read`;
  };

  return (
    <>
      <Head>
        <title>Blog · abyn</title>
        <meta name="description" content="Thoughts, articles, and guides by abyn on programming, web development, and design." />
      </Head>

      <main className="relative min-h-screen pb-16">
        <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="font-display text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
              Blog
            </h1>
            <p className="max-w-xl text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
              Writing about software engineering, security, and random things in my life.
            </p>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 space-y-3"
                >
                  <div className="h-4 w-1/4 rounded bg-white/10" />
                  <div className="h-6 w-3/4 rounded bg-white/10" />
                  <div className="h-4 w-5/6 rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center text-sm text-[var(--text-secondary)] italic">
              No blog posts published yet. Check back later!
            </div>
          ) : (
            <div className="grid gap-6">
              {posts.map((post, idx) => {
                const date = new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });

                return (
                  <motion.article
                    key={post.slug}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.08 }}
                    className="group relative rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-all hover:bg-[var(--card-bg-mix)] hover:shadow-[var(--card-shadow)] flex flex-col md:flex-row gap-5 overflow-hidden"
                  >
                    {/* Cover image if available */}
                    {post.coverImage && (
                      <div className="relative w-full md:w-40 h-28 rounded-lg overflow-hidden shrink-0 border border-[var(--card-border)] bg-black/10">
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Meta info & drafts tag */}
                        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {getReadingTime(post)}
                          </span>
                          {!post.published && (
                            <span className="flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                              <EyeOff className="h-2.5 w-2.5" /> Draft
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-display text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                          <Link href={`/blog/${post.slug}`} className="focus:outline-none">
                            <span className="absolute inset-0" aria-hidden="true" />
                            {post.title}
                          </Link>
                        </h2>

                        {/* Description */}
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                          {post.description}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                        Read post <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>

        <div className="mx-auto max-w-3xl px-4 mt-12 sm:px-6 lg:px-8">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
