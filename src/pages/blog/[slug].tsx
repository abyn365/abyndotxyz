import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Heart,
  MessageSquare,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import { PageFooter } from "../../components/PageFooter";
import { parseMarkdown } from "../../lib/markdown";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

interface BlogComment {
  id: string;
  username: string;
  content: string;
  createdAt: number;
}

interface Props {
  post?: BlogPost | null;
  likes?: string[];
  comments?: BlogComment[];
  error?: string;
}

export default function BlogPostPage({
  post: initialPost,
  likes: initialLikes,
  comments: initialComments,
  error: initialError,
}: Props) {
  const router = useRouter();
  const { slug } = router.query;

  const [post, setPost] = useState<BlogPost | null>(initialPost || null);
  const [likes, setLikes] = useState<string[]>(initialLikes || []);
  const [comments, setComments] = useState<BlogComment[]>(initialComments || []);
  const [loading, setLoading] = useState(!initialPost && !initialError);
  const [error, setError] = useState(initialError || "");

  // Typography Scalar state (0 = sm, 1 = base, 2 = lg, 3 = xl)
  const [textSizeIndex, setTextSizeIndex] = useState<number>(1);

  // Visitor Auth states
  const [visitor, setVisitor] = useState<{ username: string } | null>(null);
  const [visitorToken, setVisitorToken] = useState("");
  const [showVisitorMenu, setShowVisitorMenu] = useState(false);
  const [visitorTab, setVisitorTab] = useState<"login" | "register">("login");
  const [visitorUsername, setVisitorUsername] = useState("");
  const [visitorPassword, setVisitorPassword] = useState("");
  const [visitorError, setVisitorError] = useState("");
  const [visitorSuccess, setVisitorSuccess] = useState("");
  const [authActionLoading, setAuthActionLoading] = useState(false);

  // Turnstile state for visitor auth
  const visitorTurnstileContainerRef = useRef<HTMLDivElement>(null);
  const [visitorTurnstileToken, setVisitorTurnstileToken] = useState("");

  // Comment submission state
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Admin status check
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);

  const headers = post ? getHeaders(post.content) : [];
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (headers.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -65% 0px" }
    );

    headers.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headers]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      setActiveId(window.location.hash.substring(1));
    }
  }, [post]);

  const handleCopyPage = () => {
    if (!post) return;
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetch("/api/visitor/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.authenticated && data.user) setVisitor(data.user);
          if (data.csrfToken) setVisitorToken(data.csrfToken);
        }
      })
      .catch(() => {});

    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.authenticated) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);



  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initVisitorWidget = () => {
      const win = window as any;
      if (win.turnstile && visitorTurnstileContainerRef.current) {
        try {
          visitorTurnstileContainerRef.current.innerHTML = "";
          win.turnstile.render(visitorTurnstileContainerRef.current, {
            sitekey:
              process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
              "0x4AAAAAADv9KsIrMSbSARa-",
            callback: (token: string) => {
              setVisitorTurnstileToken(token);
            },
          });
        } catch (e) {
          console.error("Visitor Turnstile render error:", e);
        }
      }
    };

    if (showVisitorMenu && !visitor) {
      const win = window as any;
      if (win.turnstile) {
        initVisitorWidget();
      } else {
        checkInterval = setInterval(() => {
          if (win.turnstile) {
            initVisitorWidget();
            clearInterval(checkInterval);
          }
        }, 500);
      }
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [showVisitorMenu, visitorTab, visitor]);

  useEffect(() => {
    if (!slug) return;

    if (initialPost) {
      fetch(`/api/blog/${slug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLikes(data.likes || []);
            setComments(data.comments || []);
          }
        })
        .catch(() => {});
      setLoading(false);
      return;
    }

    fetch(`/api/blog/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Blog post not found");
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setPost(data.post);
          setLikes(data.likes || []);
          setComments(data.comments || []);
        } else {
          setError(data.error || "Post load error");
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load blog post");
        setLoading(false);
      });
  }, [slug, initialPost]);

  const handleVisitorAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorUsername.trim() || !visitorPassword.trim()) {
      setVisitorError("Username and password are required.");
      return;
    }

    if (!visitorTurnstileToken) {
      setVisitorError("Please complete the security challenge.");
      return;
    }

    setAuthActionLoading(true);
    setVisitorError("");
    setVisitorSuccess("");

    const endpoint =
      visitorTab === "login"
        ? "/api/visitor/auth/login"
        : "/api/visitor/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": visitorToken,
        },
        body: JSON.stringify({
          username: visitorUsername,
          password: visitorPassword,
          token: visitorTurnstileToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVisitor(data.user);
        setVisitorSuccess(
          visitorTab === "login" ? "Logged in!" : "Registered & logged in!"
        );
        setVisitorUsername("");
        setVisitorPassword("");
        setVisitorTurnstileToken("");

        const statusRes = await fetch("/api/visitor/auth/status");
        const statusData = await statusRes.json();
        if (statusData.success && statusData.csrfToken) {
          setVisitorToken(statusData.csrfToken);
        }
        setTimeout(() => setShowVisitorMenu(false), 1500);
      } else {
        setVisitorError(data.error || "Auth failed");
        const win = window as any;
        if (win.turnstile) win.turnstile.reset();
        setVisitorTurnstileToken("");
      }
    } catch {
      setVisitorError("Server error");
      const win = window as any;
      if (win.turnstile) win.turnstile.reset();
      setVisitorTurnstileToken("");
    } finally {
      setAuthActionLoading(false);
    }
  };

  const handleVisitorLogout = async () => {
    try {
      await fetch("/api/visitor/auth/logout", {
        method: "POST",
        headers: { "x-csrf-token": visitorToken },
      });
      setVisitor(null);
      setVisitorSuccess("Logged out.");
      const statusRes = await fetch("/api/visitor/auth/status");
      const statusData = await statusRes.json();
      if (statusData.success && statusData.csrfToken) {
        setVisitorToken(statusData.csrfToken);
      }
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const handleLike = async () => {
    if (!visitor) {
      setVisitorError("Please login to like this post!");
      setShowVisitorMenu(true);
      return;
    }

    try {
      const res = await fetch("/api/blog/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": visitorToken,
        },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.success) {
        setLikes(data.likes);
      }
    } catch (e) {
      console.error("Failed to like post", e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    setCommentError("");

    try {
      const res = await fetch("/api/blog/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": visitorToken,
        },
        body: JSON.stringify({ slug, content: newComment }),
      });
      const data = await res.json();
      if (data.success) {
        setComments([...comments, data.comment]);
        setNewComment("");
      } else {
        setCommentError(data.error || "Failed to post comment");
      }
    } catch {
      setCommentError("Server error posting comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch("/api/blog/comment", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": visitorToken,
        },
        body: JSON.stringify({ slug, commentId }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (e) {
      console.error("Failed to delete comment", e);
    }
  };

  const getReadingTime = (content: string) => {
    const wordCount = content.split(/\s+/).length;
    const time = Math.max(1, Math.round(wordCount / 200));
    return `${time} min read`;
  };

  const isLiked = visitor ? likes.includes(visitor.username) : false;

  if (loading) {
    return (
      <main className="min-h-screen pb-16">
        <div className="mx-auto max-w-3xl px-4 pt-24 space-y-8 animate-pulse">
          {/* Back button skeleton */}
          <div className="h-4 w-20 rounded bg-white/5" />

          <div className="space-y-4">
            {/* Title skeleton */}
            <div className="h-10 w-5/6 rounded bg-white/5" />
            
            {/* Meta row skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-4 w-24 rounded bg-white/5" />
              <div className="h-4 w-20 rounded bg-white/5" />
            </div>
          </div>

          {/* Cover image skeleton */}
          <div className="h-[280px] w-full rounded-2xl bg-white/5" />

          {/* Article content skeleton paragraphs */}
          <div className="space-y-4 pt-4">
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-[95%] rounded bg-white/5" />
            <div className="h-4 w-[98%] rounded bg-white/5" />
            <div className="h-4 w-[90%] rounded bg-white/5" />
            <div className="h-4 w-[85%] rounded bg-white/5" />
          </div>

          <div className="space-y-4 pt-6">
            <div className="h-4 w-full rounded bg-white/5" />
            <div className="h-4 w-[96%] rounded bg-white/5" />
            <div className="h-4 w-[93%] rounded bg-white/5" />
            <div className="h-4 w-2/3 rounded bg-white/5" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 pt-24 text-center">
          <p className="mb-4 text-sm font-semibold text-red-400">
            {error || "Article not found."}
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
          </Link>
        </div>
      </main>
    );
  }

  const postDate = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Base font scalar sizing configurations
  const customFontSizeRem = ["0.875rem", "1rem", "1.125rem", "1.25rem"];

  return (
    <>
      <Head>
        <title>{`${post.title} · abyn`}</title>
        <meta name="description" content={post.description} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta
          property="og:image"
          content={`https://abyn.xyz/api/og/${post.slug}`}
        />
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Scoped style injector overrides Tailwind spec parameters cleanly */}
      <style>{`
        .dynamic-prose-container p,
        .dynamic-prose-container li,
        .dynamic-prose-container table,
        .dynamic-prose-container blockquote {
          font-size: var(--blog-base-size) !important;
          line-height: 1.75 !important;
        }
        .dynamic-prose-container h1 { font-size: calc(var(--blog-base-size) * 2.1) !important; }
        .dynamic-prose-container h2 { font-size: calc(var(--blog-base-size) * 1.65) !important; }
        .dynamic-prose-container h3 { font-size: calc(var(--blog-base-size) * 1.35) !important; }
        .dynamic-prose-container h4 { font-size: calc(var(--blog-base-size) * 1.15) !important; }
        .dynamic-prose-container code { font-size: calc(var(--blog-base-size) * 0.85) !important; }
      `}</style>

      <main className="relative min-h-screen pb-16">
        <div
          className={`mx-auto px-4 pt-8 sm:px-6 lg:px-8 ${
            headers.length > 0
              ? "max-w-5xl lg:grid lg:grid-cols-12 lg:gap-8"
              : "max-w-3xl"
          }`}
        >
          <div className={headers.length > 0 ? "lg:col-span-9" : ""}>
            {/* Back button */}
            <Link
              href="/blog"
              className="mb-8 inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
            </Link>

            {post.coverImage && (
              <div className="mb-8 h-64 w-full overflow-hidden rounded-2xl border border-[var(--card-border)] bg-black/10 sm:h-80">
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-10 space-y-4">
              <div className="flex flex-nowrap items-center justify-between gap-1.5 text-[10px] text-[var(--text-secondary)] sm:gap-3 sm:text-xs">
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> {postDate}
                  </span>
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                    {getReadingTime(post.content)}
                  </span>
                  {!post.published && (
                    <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-amber-500 whitespace-nowrap">
                      Draft
                    </span>
                  )}
                </div>

                {/* Action Control Panel */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Dynamic Text Scalar Slider */}
                  <div className="flex select-none items-center gap-1.5 rounded-lg border border-white/5 bg-black/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider sm:px-2.5 sm:py-1">
                    <span className="text-[8px] text-neutral-500">A</span>
                    <input
                      type="range"
                      min="0"
                      max="3"
                      step="1"
                      value={textSizeIndex}
                      onChange={(e) =>
                        setTextSizeIndex(parseInt(e.target.value, 10))
                      }
                      className="h-1 w-10 cursor-pointer appearance-none rounded-lg bg-neutral-700 accent-[var(--accent)] focus:outline-none sm:w-16"
                      title="Adjust read text sizing font scale"
                    />
                    <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                      A
                    </span>
                  </div>

                  {/* Copy Module Element */}
                  <button
                    onClick={handleCopyPage}
                    className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/5 bg-black/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider transition-colors hover:text-[var(--text-primary)] sm:px-2.5 sm:py-1"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-400" />
                        <span className="hidden sm:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span className="hidden sm:inline">Copy page</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <h1 className="font-display text-3xl font-black leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl">
                {post.title}
              </h1>
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1.5 pb-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[var(--bg-secondary)] px-2 py-0.5 text-xs text-[var(--text-secondary)] font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <p className="border-l-2 border-[var(--card-border)] pl-4 text-sm italic leading-relaxed text-[var(--text-secondary)] sm:text-base">
                {post.description}
              </p>
            </header>

            {/* Body Content Box — Binding size variables cleanly to ensure deep overrides function safely */}
            <article
              className="prose prose-neutral dark:prose-invert dynamic-prose-container mb-12 max-w-none border-b border-[var(--card-border)] pb-8"
              style={
                {
                  "--blog-base-size": customFontSizeRem[textSizeIndex],
                } as React.CSSProperties
              }
              dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
            />

            {/* Interactions (Likes) */}
            <div className="mb-12 flex items-center justify-between">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 transition-all ${
                  isLiked
                    ? "border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/15"
                    : "border-[var(--card-border)] text-[var(--text-secondary)] hover:border-red-500/30 hover:text-red-500"
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
                <span className="text-xs font-bold">
                  {likes.length} {likes.length === 1 ? "Like" : "Likes"}
                </span>
              </button>

              {/* Social Share Buttons */}
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://abyn.xyz/blog/${post.slug}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--card-bg-mix)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5"
                >
                  Twitter
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(`https://abyn.xyz/blog/${post.slug}`)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--card-bg-mix)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1.5"
                >
                  Telegram
                </a>
              </div>
            </div>



              {/* Collapsible Auth Dropdown for Likes/Comments */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowVisitorMenu(!showVisitorMenu)}
                  className="flex items-center gap-1 rounded-lg border border-white/5 bg-black/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 transition-colors hover:text-neutral-200"
                >
                  <span>
                    👤{" "}
                    {visitor ? visitor.username : "Login/Register (optional)"}
                  </span>
                  <span>{showVisitorMenu ? "▲" : "▼"}</span>
                </button>

                {showVisitorMenu && (
                  <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                    {visitor ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          Signed in as{" "}
                          <strong className="text-[var(--text-primary)]">
                            {visitor.username}
                          </strong>
                        </p>
                        <button
                          onClick={handleVisitorLogout}
                          className="w-full rounded border border-red-900/50 bg-red-950/40 py-1.5 text-[9px] font-bold uppercase text-red-300 transition-colors hover:bg-red-950/70"
                        >
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleVisitorAuth} className="space-y-3">
                        <div className="flex gap-3 border-b border-[var(--card-border)] pb-1.5">
                          <button
                            type="button"
                            onClick={() => setVisitorTab("login")}
                            className={`text-[9px] font-bold uppercase ${
                              visitorTab === "login"
                                ? "border-b border-[var(--accent)] text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)]"
                            }`}
                          >
                            Login
                          </button>
                          <button
                            type="button"
                            onClick={() => setVisitorTab("register")}
                            className={`text-[9px] font-bold uppercase ${
                              visitorTab === "register"
                                ? "border-b border-[var(--accent)] text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)]"
                            }`}
                          >
                            Register
                          </button>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            required
                            placeholder="Username"
                            value={visitorUsername}
                            onChange={(e) => setVisitorUsername(e.target.value)}
                            className="w-full rounded border border-[var(--card-border)] bg-black/10 px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                          />
                          <input
                            type="password"
                            required
                            placeholder="Password"
                            value={visitorPassword}
                            onChange={(e) => setVisitorPassword(e.target.value)}
                            className="w-full rounded border border-[var(--card-border)] bg-black/10 px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                          />

                          <div className="flex justify-center py-1">
                            <div
                              ref={visitorTurnstileContainerRef}
                              className="origin-center scale-90"
                            />
                          </div>

                          <Script
                            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                            strategy="lazyOnload"
                          />

                          <button
                            type="submit"
                            disabled={authActionLoading}
                            className="w-full rounded bg-[var(--accent)] py-1.5 text-[9px] font-bold uppercase text-[var(--accent-text)] transition-colors hover:opacity-90"
                          >
                            {authActionLoading
                              ? "..."
                              : visitorTab === "login"
                              ? "Login"
                              : "Sign Up"}
                          </button>
                        </div>
                      </form>
                    )}
                    {visitorError && (
                      <p className="mt-2 text-[10px] font-semibold text-red-400">
                        {visitorError}
                      </p>
                    )}
                    {visitorSuccess && (
                      <p className="mt-2 text-[10px] font-semibold text-green-400">
                        {visitorSuccess}
                      </p>
                    )}
                  </div>
                )}
              </div>

            {/* Comments Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-[var(--card-border)] pb-2">
                <MessageSquare className="h-4 w-4 text-[var(--text-secondary)]" />
                <h2 className="font-display text-lg font-bold text-[var(--text-primary)]">
                  Comments ({comments.length})
                </h2>
              </div>

              {/* Comment Form */}
              {visitor ? (
                <form onSubmit={handleAddComment} className="space-y-3">
                  <textarea
                    required
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Commenting as ${visitor.username}...`}
                    maxLength={500}
                    className="w-full resize-none rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none sm:text-sm"
                  />
                  {commentError && (
                    <p className="text-xs text-red-400">{commentError}</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={commentLoading || !newComment.trim()}
                      className="rounded-lg bg-[var(--accent)] px-4 py-1.5 text-xs font-bold text-[var(--accent-text)] transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      {commentLoading ? "Posting..." : "Post Comment"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-xl border border-[var(--card-border)] bg-black/10 p-4 text-center text-xs italic text-[var(--text-secondary)]">
                  Please use the account menu above to log in or sign up to
                  leave a comment.
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4 pt-2">
                {comments.length === 0 ? (
                  <p className="py-6 text-center text-xs italic text-[var(--text-secondary)] sm:text-sm">
                    No comments yet. Be the first to join the conversation!
                  </p>
                ) : (
                  comments.map((comment) => {
                    const date = new Date(comment.createdAt).toLocaleDateString(
                      undefined,
                      {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    const isAuthor =
                      visitor && visitor.username === comment.username;
                    const canDelete = isAdmin || isAuthor;

                    return (
                      <div
                        key={comment.id}
                        className="group relative flex flex-col justify-between space-y-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition-all hover:shadow-[var(--card-shadow)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[var(--text-primary)]">
                                {comment.username}
                              </span>
                              <span className="text-[10px] text-[var(--text-secondary)]">
                                {date}
                              </span>
                              {comment.username === "admin" && (
                                <span className="py-0.2 rounded border border-red-500/20 bg-red-500/10 px-1 text-[8px] font-bold uppercase tracking-wider text-red-500">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="whitespace-pre-wrap text-xs leading-relaxed text-[var(--text-secondary)] sm:text-sm">
                              {comment.content}
                            </p>
                          </div>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="shrink-0 rounded-full p-1 text-neutral-500 transition-colors hover:text-red-400"
                              title="Delete comment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Sidebar Column (Desktop only) */}
          {headers.length > 0 && (
            <div className="hidden lg:col-span-3 lg:block">
              <aside className="sticky top-24 space-y-4 self-start">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  On this page
                </h3>
                <nav className="relative space-y-2 border-l border-[var(--card-border)] pl-4">
                  {(() => {
                    const minLevel = Math.min(...headers.map(h => h.level));
                    return headers.map((header) => {
                      const isActive = header.id === activeId;
                      const indent =
                        header.level === minLevel
                          ? "text-xs font-semibold"
                          : header.level === minLevel + 1
                          ? "pl-3 text-[11px]"
                          : header.level === minLevel + 2
                          ? "pl-6 text-[10px]"
                          : "pl-8 text-[9px]";
                      return (
                        <a
                          key={header.id}
                          href={`#${header.id}`}
                          className={`relative block leading-relaxed transition-colors ${indent} ${
                            isActive
                              ? "font-semibold text-[var(--accent)]"
                              : "text-[var(--text-secondary)] hover:text-[var(--accent)]"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-toc-indicator"
                              className="absolute bottom-0 left-[-17px] top-0 w-[2px] bg-[var(--accent)]"
                              transition={{
                                type: "spring",
                                stiffness: 350,
                                damping: 25,
                              }}
                            />
                          )}
                          {header.text}
                        </a>
                      );
                    });
                  })()}
                </nav>
              </aside>
            </div>
          )}
        </div>

        <div className="mx-auto mt-12 max-w-3xl px-4 sm:px-6 lg:px-8">
          <PageFooter />
        </div>
      </main>
    </>
  );
}

interface HeaderItem {
  id: string;
  text: string;
  level: number;
}

function getHeaders(content: string): HeaderItem[] {
  if (!content) return [];
  const lines = content.split("\n");
  const headers: HeaderItem[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("##") ||
      trimmed.startsWith("###") ||
      trimmed.startsWith("####")
    ) {
      const match = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        let text = match[2].trim();
        text = text.replace(/\s+#+$/, "");

        // Replicate parseMarkdown's sanitization:
        // 1. replace '&' with '&amp;' to match the HTML encoder
        let processedText = text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        // 2. strip markdown tags to match HTML generation
        processedText = processedText.replace(/\[(.*?)\]\(.*?\)/g, "$1");
        processedText = processedText.replace(/`(.*?)`/g, "$1");
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, "$1");
        processedText = processedText.replace(/__(.*?)__/g, "$1");
        processedText = processedText.replace(/\*(.*?)\*/g, "$1");
        processedText = processedText.replace(/_(.*?)_/g, "$1");

        const id = processedText
          .toLowerCase()
          .replace(/<[^>]*>/g, "")
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();

        // Clean up markdown syntax from the human-readable display text
        let displayText = text;
        displayText = displayText.replace(/\[(.*?)\]\(.*?\)/g, "$1");
        displayText = displayText.replace(/`(.*?)`/g, "$1");
        displayText = displayText.replace(/\*\*(.*?)\*\*/g, "$1");
        displayText = displayText.replace(/__(.*?)__/g, "$1");
        displayText = displayText.replace(/\*(.*?)\*/g, "$1");
        displayText = displayText.replace(/_(.*?)_/g, "$1");

        headers.push({ id, text: displayText, level });
      }
    }
  }
  return headers;
}

export const getStaticPaths = async () => {
  const { getPosts } = require("../../lib/blog");
  const posts = await getPosts();
  const paths = posts.map((post: any) => ({
    params: { slug: post.slug },
  }));
  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps = async ({ params }: any) => {
  const { getPostBySlug, getLikes, getComments } = require("../../lib/blog");
  try {
    const post = await getPostBySlug(params.slug);
    if (!post || !post.published) {
      return {
        notFound: true,
      };
    }
    const likes = await getLikes(params.slug);
    const comments = await getComments(params.slug);
    return {
      props: {
        post,
        likes,
        comments: comments.sort((a: any, b: any) => a.createdAt - b.createdAt),
      },
      revalidate: 60,
    };
  } catch (err) {
    return {
      props: {
        error: "Failed to load blog post",
      },
      revalidate: 60,
    };
  }
};
