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
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export default function BlogIndex({ posts: initialPosts }: { posts?: BlogPost[] }) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialPosts);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");

  useEffect(() => {
    // 1. Check admin status to know if we can see drafts
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.authenticated) {
          setIsAdmin(true);
          // Admin can see drafts, fetch from API
          fetch("/api/blog")
            .then((res) => res.json())
            .then((d) => {
              if (d.success) setPosts(d.posts);
            });
        }
      })
      .catch(() => {});

    // 2. Fetch posts if static props are empty
    if (!initialPosts || initialPosts.length === 0) {
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
    } else {
      setLoading(false);
    }
  }, [initialPosts]);

  // Get unique list of tags across posts
  const tagsList = ["All", ...Array.from(new Set(posts.flatMap((p) => p.tags || [])))];

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesTag = selectedTag === "All" || post.tags?.includes(selectedTag);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      post.title.toLowerCase().includes(searchLower) ||
      post.description.toLowerCase().includes(searchLower) ||
      (post.tags && post.tags.some((t) => t.toLowerCase().includes(searchLower)));
    return matchesTag && matchesSearch;
  });

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

          {/* Search & Tags Filtering */}
          <div className="mb-8 space-y-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts by title, snippet, or tag..."
              className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-2.5 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none sm:text-sm shadow-sm"
            />
            {tagsList.length > 1 && (
              <div className="scrollbar-none flex flex-wrap gap-1.5 pt-1">
                {tagsList.map((tag) => {
                  const active = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className={`rounded-full px-3.5 py-1 text-[11px] font-semibold transition-all ${
                        active
                          ? "bg-[var(--accent)] text-[var(--accent-text)]"
                          : "border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--card-bg-mix)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
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
          ) : filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center text-sm text-[var(--text-secondary)] italic">
              No matching blog posts found.
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredPosts.map((post, idx) => {
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
                    className="group relative rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5 transition-all flex flex-col md:flex-row gap-5 overflow-hidden"
                    style={{
                      transformStyle: "preserve-3d",
                      willChange: "transform",
                      boxShadow: "var(--card-shadow)",
                    }}
                    onMouseMove={(e) => {
                      const card = e.currentTarget;
                      const rect = card.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const rotateX = ((y / rect.height) - 0.5) * -4;
                      const rotateY = ((x / rect.width) - 0.5) * 4;
                      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                      card.style.boxShadow = "var(--card-shadow), 0 12px 32px var(--accent-glow)";
                    }}
                    onMouseLeave={(e) => {
                      const card = e.currentTarget;
                      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
                      card.style.transition = "transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 400ms ease";
                      card.style.boxShadow = "var(--card-shadow)";
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transition = "transform 80ms ease-out, box-shadow 80ms ease-out";
                    }}
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

                        {/* Tags display */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1 relative z-20">
                            {post.tags.map((tag) => (
                              <button
                                key={tag}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedTag(tag);
                                }}
                                className="rounded bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)] font-medium hover:text-[var(--accent)] transition-colors"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}
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

export const getStaticProps = async () => {
  const { getPosts } = require("../../lib/blog");
  const posts = await getPosts();
  const published = posts.filter((p: any) => p.published);
  return {
    props: {
      posts: published,
    },
    revalidate: 60,
  };
};
