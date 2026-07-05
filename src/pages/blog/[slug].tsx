import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowLeft, Heart, MessageSquare, Trash2 } from "lucide-react";
import { PageFooter } from "../../components/PageFooter";
import { parseMarkdown } from "../../lib/markdown";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  coverImage?: string;
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

export default function BlogPostPage() {
  const router = useRouter();
  const { slug } = router.query;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // Admin status check (for deleting any comment)
  const [isAdmin, setIsAdmin] = useState(false);

  // Fetch visitor auth status & admin status
  useEffect(() => {
    // Visitor status
    fetch("/api/visitor/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.authenticated && data.user) setVisitor(data.user);
          if (data.csrfToken) setVisitorToken(data.csrfToken);
        }
      })
      .catch(() => {});

    // Admin status
    fetch("/api/auth/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.authenticated) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize Turnstile widget for visitor auth
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;
    
    const initVisitorWidget = () => {
      const win = window as any;
      if (win.turnstile && visitorTurnstileContainerRef.current) {
        try {
          visitorTurnstileContainerRef.current.innerHTML = "";
          win.turnstile.render(visitorTurnstileContainerRef.current, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADv9KsIrMSbSARa-",
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

  // Fetch blog data
  useEffect(() => {
    if (!slug) return;

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
  }, [slug]);

  // Visitor Auth Handlers
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

    const endpoint = visitorTab === "login" ? "/api/visitor/auth/login" : "/api/visitor/auth/register";

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
          token: visitorTurnstileToken
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVisitor(data.user);
        setVisitorSuccess(visitorTab === "login" ? "Logged in!" : "Registered & logged in!");
        setVisitorUsername("");
        setVisitorPassword("");
        setVisitorTurnstileToken("");
        
        // Refresh token & likes/comments
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

  // Toggle Like Handler
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

  // Add Comment Handler
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

  // Delete Comment Handler
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
      <main className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 pt-24 text-center text-sm text-[var(--text-secondary)]">
          Loading article...
        </div>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 pt-24 text-center">
          <p className="text-red-400 font-semibold text-sm mb-4">{error || "Article not found."}</p>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--accent)]">
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

  return (
    <>
      <Head>
        <title>{post.title} · abyn</title>
        <meta name="description" content={post.description} />
      </Head>

      <main className="relative min-h-screen pb-16">
        <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 lg:px-8">
          {/* Back button */}
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to blog
          </Link>

          {/* Cover image */}
          {post.coverImage && (
            <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden border border-[var(--card-border)] bg-black/10 mb-8">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Article Header */}
          <header className="space-y-4 mb-10">
            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {postDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {getReadingTime(post.content)}
              </span>
              {!post.published && (
                <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 uppercase tracking-wider">
                  Draft
                </span>
              )}
            </div>
            
            <h1 className="font-display text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-4xl leading-tight">
              {post.title}
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed italic border-l-2 border-[var(--card-border)] pl-4">
              {post.description}
            </p>
          </header>

          {/* Body Content */}
          <article 
            className="prose prose-neutral dark:prose-invert max-w-none mb-12 border-b border-[var(--card-border)] pb-8"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
          />

          {/* Interactions (Likes) */}
          <div className="flex items-center justify-between mb-12">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 rounded-full px-4 py-2 border transition-all ${
                isLiked 
                  ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/15" 
                  : "border-[var(--card-border)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30"
              }`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-red-500" : ""}`} />
              <span className="text-xs font-bold">{likes.length} {likes.length === 1 ? "Like" : "Likes"}</span>
            </button>

            {/* Collapsible Auth Dropdown for Likes/Comments */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowVisitorMenu(!showVisitorMenu)}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-neutral-200 transition-colors border border-white/5 rounded-lg px-2.5 py-1 bg-black/10"
              >
                <span>👤 {visitor ? visitor.username : "Login/Register (optional)"}</span>
                <span>{showVisitorMenu ? "▲" : "▼"}</span>
              </button>

              {showVisitorMenu && (
                <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                  {visitor ? (
                    <div className="space-y-3">
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Signed in as <strong className="text-[var(--text-primary)]">{visitor.username}</strong>
                      </p>
                      <button
                        onClick={handleVisitorLogout}
                        className="w-full rounded bg-red-950/40 hover:bg-red-950/70 border border-red-900/50 py-1.5 text-[9px] font-bold text-red-300 transition-colors uppercase"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVisitorAuth} className="space-y-3">
                      <div className="flex border-b border-[var(--card-border)] pb-1.5 gap-3">
                        <button
                          type="button"
                          onClick={() => setVisitorTab("login")}
                          className={`text-[9px] font-bold uppercase ${
                            visitorTab === "login" ? "text-[var(--text-primary)] border-b border-[var(--accent)]" : "text-[var(--text-secondary)]"
                          }`}
                        >
                          Login
                        </button>
                        <button
                          type="button"
                          onClick={() => setVisitorTab("register")}
                          className={`text-[9px] font-bold uppercase ${
                            visitorTab === "register" ? "text-[var(--text-primary)] border-b border-[var(--accent)]" : "text-[var(--text-secondary)]"
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
                          className="w-full rounded bg-black/10 border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                        />
                        <input
                          type="password"
                          required
                          placeholder="Password"
                          value={visitorPassword}
                          onChange={(e) => setVisitorPassword(e.target.value)}
                          className="w-full rounded bg-black/10 border border-[var(--card-border)] px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none"
                        />

                        {/* Visitor Turnstile Challenge */}
                        <div className="flex justify-center py-1">
                          <div
                            ref={visitorTurnstileContainerRef}
                            className="scale-90 origin-center"
                          />
                        </div>

                        <Script
                          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                          strategy="lazyOnload"
                        />

                        <button
                          type="submit"
                          disabled={authActionLoading}
                          className="w-full rounded bg-[var(--accent)] hover:opacity-90 py-1.5 text-[9px] font-bold text-[var(--accent-text)] transition-colors uppercase"
                        >
                          {authActionLoading ? "..." : visitorTab === "login" ? "Login" : "Sign Up"}
                        </button>
                      </div>
                    </form>
                  )}
                  {visitorError && <p className="mt-2 text-[10px] font-semibold text-red-400">{visitorError}</p>}
                  {visitorSuccess && <p className="mt-2 text-[10px] font-semibold text-green-400">{visitorSuccess}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <section className="space-y-6">
            <div className="border-b border-[var(--card-border)] pb-2 flex items-center gap-2">
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
                  className="w-full rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
                {commentError && <p className="text-xs text-red-400">{commentError}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentLoading || !newComment.trim()}
                    className="rounded-lg bg-[var(--accent)] hover:opacity-90 px-4 py-1.5 text-xs font-bold text-[var(--accent-text)] transition-all disabled:opacity-50"
                  >
                    {commentLoading ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-[var(--card-border)] bg-black/10 p-4 text-center text-xs text-[var(--text-secondary)] italic">
                Please use the account menu above to log in or sign up to leave a comment.
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4 pt-2">
              {comments.length === 0 ? (
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] italic text-center py-6">
                  No comments yet. Be the first to join the conversation!
                </p>
              ) : (
                comments.map((comment) => {
                  const date = new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const isAuthor = visitor && visitor.username === comment.username;
                  const canDelete = isAdmin || isAuthor;

                  return (
                    <div
                      key={comment.id}
                      className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 space-y-2 flex flex-col justify-between group relative hover:shadow-[var(--card-shadow)] transition-all"
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
                              <span className="rounded bg-red-500/10 border border-red-500/20 px-1 py-0.2 text-[8px] font-bold text-red-500 uppercase tracking-wider">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
                            {comment.content}
                          </p>
                        </div>

                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-neutral-500 hover:text-red-400 p-1 rounded-full transition-colors shrink-0"
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

        <div className="mx-auto max-w-3xl px-4 mt-12 sm:px-6 lg:px-8">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
