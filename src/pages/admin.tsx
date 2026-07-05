import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/router";
import {
  Activity,
  PlusCircle,
  Database,
  Cloud,
  Layers,
  Music,
  Disc,
  Key,
  Trash2,
  Edit,
  LogOut,
  Upload,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Shield
} from "lucide-react";
import { PageFooter } from "../components/PageFooter";
import { parseMarkdown } from "../lib/markdown";

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

interface ServiceStatus {
  status: "online" | "offline" | "disabled" | "warning";
  latency?: number;
  details?: string;
}

interface SystemStatus {
  database?: ServiceStatus;
  s3?: ServiceStatus;
  lanyard?: ServiceStatus;
  lastfm?: ServiceStatus;
  spotify?: ServiceStatus;
  paxsenix?: ServiceStatus;
}

export default function AdminDashboard() {
  const router = useRouter();

  // Auth states
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState("");
  const [adminUser, setAdminUser] = useState("");
  
  // Login form states
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard content states
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatus>({});
  const [statusLoading, setStatusLoading] = useState(true);

  // Editor states
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorSlug, setEditorSlug] = useState("");
  const [editorDesc, setEditorDesc] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorCover, setEditorCover] = useState("");
  const [editorPublished, setEditorPublished] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [editorSaving, setEditorSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "status" | "uploader" | "moderation">("posts");

  // Moderation state
  const [blockedUsernames, setBlockedUsernames] = useState<string[]>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderationError, setModerationError] = useState("");
  const [moderationSuccess, setModerationSuccess] = useState("");

  // File Upload states (Bulk support)
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadUrls, setUploadUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Turnstile state for admin brute force protection
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

  // Check auth status
  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (data.success) {
        setCsrfToken(data.csrfToken || "");
        if (data.authenticated && data.user) {
          setAuthenticated(true);
          setAdminUser(data.user.username);
          loadDashboardData();
        } else {
          setAuthenticated(false);
        }
      }
    } catch (e) {
      console.error("Auth check error:", e);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    try {
      const stored = localStorage.getItem("admin_uploaded_urls");
      if (stored) {
        setUploadUrls(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load uploaded urls:", e);
    }
  }, []);

  // Initialize Turnstile widget for Admin Login screen
  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initWidget = () => {
      const win = window as any;
      if (win.turnstile && turnstileContainerRef.current) {
        try {
          turnstileContainerRef.current.innerHTML = "";
          win.turnstile.render(turnstileContainerRef.current, {
            sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADv9KsIrMSbSARa-",
            callback: (token: string) => {
              setTurnstileToken(token);
            },
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
        }
      }
    };

    if (authenticated) return;

    const win = window as any;
    if (win.turnstile) {
      initWidget();
    } else {
      checkInterval = setInterval(() => {
        if (win.turnstile) {
          initWidget();
          clearInterval(checkInterval);
        }
      }, 500);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [authenticated]);

  const loadDashboardData = () => {
    fetchPosts();
    fetchSystemStatus();
    fetchModerationSettings();
  };

  const fetchModerationSettings = async () => {
    try {
      const res = await fetch("/api/admin/moderation");
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setBlockedUsernames(data.blockedUsernames || []);
        setBlockedWords(data.blockedWords || []);
      }
    } catch (e) {
      console.error("Failed to load moderation settings:", e);
    }
  };

  const handleSaveModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    setModerationSaving(true);
    setModerationError("");
    setModerationSuccess("");

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          blockedUsernames,
          blockedWords
        }),
      });
      const data = await res.json();
      if (data.success) {
        setModerationSuccess("Moderation lists updated successfully!");
      } else {
        setModerationError(data.error || "Failed to save blocklists.");
      }
    } catch (err) {
      setModerationError("Server connection error during moderation save.");
    } finally {
      setModerationSaving(false);
    }
  };

  const fetchPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch("/api/blog");
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Failed to load posts", e);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch("/api/admin/status");
      const data = await res.json();
      if (data.success) {
        setStatus(data.status);
      }
    } catch (e) {
      console.error("Failed to load status details", e);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput) {
      setLoginError("Please enter username and password.");
      return;
    }

    if (!turnstileToken) {
      setLoginError("Please complete the security challenge.");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput,
          token: turnstileToken
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsernameInput("");
        setPasswordInput("");
        setAuthenticated(true);
        // Re-check auth status to get new CSRF token bound to logged-in session ID
        await checkAuth();
      } else {
        setLoginError(data.error || "Authentication failed.");
        const win = window as any;
        if (win.turnstile) win.turnstile.reset();
        setTurnstileToken("");
      }
    } catch {
      setLoginError("Connection error.");
      const win = window as any;
      if (win.turnstile) win.turnstile.reset();
      setTurnstileToken("");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
      });
      const data = await res.json();
      if (data.success) {
        setAuthenticated(false);
        setCsrfToken(data.csrfToken || "");
      }
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setIsCreating(false);
    setEditorTitle(post.title);
    setEditorSlug(post.slug);
    setEditorDesc(post.description);
    setEditorContent(post.content);
    setEditorCover(post.coverImage || "");
    setEditorPublished(post.published);
    setEditorError("");
  };

  const handleOpenCreate = () => {
    setEditingPost(null);
    setIsCreating(true);
    setEditorTitle("");
    setEditorSlug("");
    setEditorDesc("");
    setEditorContent("");
    setEditorCover("");
    setEditorPublished(false);
    setEditorError("");
  };

  const handleCloseEditor = () => {
    setEditingPost(null);
    setIsCreating(false);
    setEditorError("");
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle.trim() || !editorSlug.trim() || !editorContent.trim()) {
      setEditorError("Title, Slug, and Content are required.");
      return;
    }

    setEditorSaving(true);
    setEditorError("");

    const url = isCreating ? "/api/blog" : `/api/blog/${editingPost?.slug}`;
    const method = isCreating ? "POST" : "PUT";

    const payload = {
      title: editorTitle.trim(),
      slug: editorSlug.trim().toLowerCase(),
      description: editorDesc.trim(),
      content: editorContent.trim(),
      coverImage: editorCover.trim(),
      published: editorPublished,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        fetchPosts();
        handleCloseEditor();
      } else {
        setEditorError(data.error || "Failed to save post");
      }
    } catch {
      setEditorError("Network error. Please try again.");
    } finally {
      setEditorSaving(false);
    }
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm(`Are you sure you want to delete post "${slug}"?`)) return;

    try {
      const res = await fetch(`/api/blog/${slug}`, {
        method: "DELETE",
        headers: {
          "x-csrf-token": csrfToken,
        },
      });
      const data = await res.json();
      if (data.success) {
        fetchPosts();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Network error deleting post");
    }
  };

  // Helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<{ fileName: string; fileType: string; fileContent: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Content = (reader.result as string).split(",")[1];
        resolve({
          fileName: file.name,
          fileType: file.type,
          fileContent: base64Content,
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  // S3 File Upload Handler (Bulk support)
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setUploadLoading(true);
    setUploadError("");
    setUploadUrls([]);

    try {
      // Read all selected files in parallel
      const base64Files = await Promise.all(uploadFiles.map(readFileAsBase64));
      
      const res = await fetch("/api/blog/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          files: base64Files,
        }),
      });
      const data = await res.json();
      if (data.success && data.files) {
        const urls = data.files.map((f: any) => f.url);
        setUploadUrls((prev) => {
          const updated = [...urls, ...prev];
          localStorage.setItem("admin_uploaded_urls", JSON.stringify(updated));
          return updated;
        });
        setUploadFiles([]);
      } else {
        setUploadError(data.error || "File upload failed");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Server connection error during upload");
    } finally {
      setUploadLoading(false);
    }
  };

  // Status Badge Colors mapping
  const getStatusColor = (sStatus?: "online" | "offline" | "disabled" | "warning") => {
    switch (sStatus) {
      case "online":
        return "bg-green-500 text-green-100 border-green-500/20";
      case "warning":
        return "bg-amber-500 text-amber-100 border-amber-500/20";
      case "offline":
        return "bg-red-500 text-red-100 border-red-500/20";
      case "disabled":
      default:
        return "bg-neutral-600 text-neutral-300 border-neutral-600/10";
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-3xl px-4 pt-24 text-center text-sm text-[var(--text-secondary)]">
          Checking administrator status...
        </div>
      </main>
    );
  }

  // Render Login Form if unauthorized
  if (!authenticated) {
    return (
      <>
        <Head>
          <title>Admin Login · abyn</title>
        </Head>
        <main className="min-h-screen pb-16">
          <div className="mx-auto max-w-md px-4 pt-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)] space-y-6"
            >
              <div className="text-center space-y-2">
                <Key className="h-10 w-10 mx-auto text-[var(--text-primary)]" />
                <h1 className="font-display text-2xl font-black text-[var(--text-primary)]">Admin Access</h1>
                <p className="text-xs text-[var(--text-secondary)]">Secure area for managing posts and reviewing health checks</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Username</label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none"
                    placeholder="e.g. admin"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Password</label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2.5 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                {/* Cloudflare Turnstile Verification */}
                <div className="flex justify-center py-1">
                  <div
                    id="admin-turnstile-container"
                    ref={turnstileContainerRef}
                    className="w-full flex justify-center scale-90 sm:scale-100"
                  />
                </div>

                {loginError && <p className="text-xs font-semibold text-red-400">{loginError}</p>}

                <Script
                  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                  strategy="lazyOnload"
                />

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-[var(--accent)] hover:opacity-90 py-2.5 text-xs font-bold text-[var(--accent-text)] transition-colors uppercase tracking-wider"
                >
                  {loginLoading ? "Verifying..." : "Access Dashboard"}
                </button>
              </form>
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  // Render Admin Dashboard
  return (
    <>
      <Head>
        <title>Admin Dashboard · abyn</title>
      </Head>

      <main className="relative min-h-screen pb-16">
        <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-black text-[var(--text-primary)]">Admin Panel</h1>
              <p className="text-xs text-[var(--text-secondary)]">Signed in as {adminUser}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/15 transition-all shrink-0 self-start sm:self-center"
            >
              <LogOut className="h-3.5 w-3.5" /> LOGOUT
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 flex border-b border-[var(--card-border)] gap-6">
            <button
              onClick={() => { setActiveTab("posts"); handleCloseEditor(); }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "posts" ? "text-[var(--text-primary)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)]"
              }`}
            >
              Manage Posts
            </button>
            <button
              onClick={() => { setActiveTab("status"); handleCloseEditor(); fetchSystemStatus(); }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "status" ? "text-[var(--text-primary)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)]"
              }`}
            >
              Status Monitor
            </button>
            <button
              onClick={() => { setActiveTab("uploader"); handleCloseEditor(); }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "uploader" ? "text-[var(--text-primary)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)]"
              }`}
            >
              Cloud Uploader
            </button>
            <button
              onClick={() => { setActiveTab("moderation"); handleCloseEditor(); fetchModerationSettings(); }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "moderation" ? "text-[var(--text-primary)] border-b-2 border-[var(--accent)]" : "text-[var(--text-secondary)]"
              }`}
            >
              Moderation
            </button>
          </div>

          {/* TAB 1: POSTS EDITOR AND MANAGEMENT */}
          {activeTab === "posts" && (
            <div className="space-y-6">
              {!isCreating && !editingPost ? (
                <>
                  <div className="flex justify-between items-center">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">Blog articles</h2>
                    <button
                      onClick={handleOpenCreate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-text)] hover:opacity-90 transition-opacity"
                    >
                      <PlusCircle className="h-4 w-4" /> Create Article
                    </button>
                  </div>

                  {postsLoading ? (
                    <div className="text-center py-10 text-xs text-[var(--text-secondary)]">Loading articles...</div>
                  ) : posts.length === 0 ? (
                    <div className="rounded-xl border border-[var(--card-border)] bg-black/10 p-12 text-center text-xs text-[var(--text-secondary)] italic">
                      No blog posts. Create one to begin!
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {posts.map((post) => (
                        <div
                          key={post.slug}
                          className="flex items-center justify-between rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 hover:shadow-[var(--card-shadow)] transition-all gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display font-bold text-sm text-[var(--text-primary)] truncate">{post.title}</h3>
                              <span className="text-[10px] text-[var(--text-secondary)] font-mono">({post.slug})</span>
                              {post.published ? (
                                <span className="rounded bg-green-500/10 border border-green-500/20 px-1 py-0.2 text-[8px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-0.5"><Eye className="h-2 w-2" /> Live</span>
                              ) : (
                                <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 text-[8px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-0.5"><EyeOff className="h-2 w-2" /> Draft</span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{post.description}</p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenEdit(post)}
                              className="p-1.5 rounded-lg border border-[var(--card-border)] bg-black/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                              title="Edit post"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.slug)}
                              className="p-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Delete post"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Editor Form */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-5"
                >
                  <div className="flex justify-between items-center border-b border-[var(--card-border)] pb-3">
                    <h2 className="font-display font-bold text-base text-[var(--text-primary)]">
                      {isCreating ? "New Blog Article" : `Edit Article: ${editingPost?.title}`}
                    </h2>
                    <button
                      onClick={handleCloseEditor}
                      className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleSavePost} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Title</label>
                        <input
                          type="text"
                          required
                          value={editorTitle}
                          onChange={(e) => setEditorTitle(e.target.value)}
                          className="w-full rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none"
                          placeholder="e.g. My Coding Journey"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Slug (URL-friendly)</label>
                        <input
                          type="text"
                          required
                          disabled={!isCreating}
                          value={editorSlug}
                          onChange={(e) => setEditorSlug(e.target.value)}
                          className="w-full rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none disabled:opacity-50"
                          placeholder="e.g. my-coding-journey"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Description (Snippet)</label>
                      <input
                        type="text"
                        value={editorDesc}
                        onChange={(e) => setEditorDesc(e.target.value)}
                        className="w-full rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none"
                        placeholder="Short summary of this article..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Cover Image URL</label>
                      <input
                        type="text"
                        value={editorCover}
                        onChange={(e) => setEditorCover(e.target.value)}
                        className="w-full rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Markdown Editor */}
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Markdown Content</label>
                        <textarea
                          required
                          rows={12}
                          value={editorContent}
                          onChange={(e) => setEditorContent(e.target.value)}
                          className="w-full flex-1 rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none resize-none"
                          placeholder="# Write article here..."
                        />
                      </div>

                      {/* Live Preview */}
                      <div className="space-y-1.5 flex flex-col max-h-[300px] sm:max-h-[370px] overflow-hidden">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Live Render Preview</label>
                        <div className="w-full flex-1 overflow-y-auto rounded-xl bg-black/5 border border-[var(--card-border)] p-3 prose prose-neutral dark:prose-invert max-w-none text-left">
                          {editorContent.trim() ? (
                            <div dangerouslySetInnerHTML={{ __html: parseMarkdown(editorContent) }} />
                          ) : (
                            <p className="text-xs text-[var(--text-secondary)] italic">Type something in markdown to see preview...</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="published"
                        checked={editorPublished}
                        onChange={(e) => setEditorPublished(e.target.checked)}
                        className="rounded border-[var(--card-border)] bg-black/10 h-4 w-4 accent-[var(--accent)]"
                      />
                      <label htmlFor="published" className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] cursor-pointer">
                        Publish Immediately
                      </label>
                    </div>

                    {editorError && <p className="text-xs font-semibold text-red-400">{editorError}</p>}

                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        type="button"
                        onClick={handleCloseEditor}
                        className="rounded-xl border border-[var(--card-border)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editorSaving}
                        className="rounded-xl bg-[var(--accent)] hover:opacity-90 px-5 py-2 text-xs font-bold text-[var(--accent-text)] transition-colors uppercase tracking-wider"
                      >
                        {editorSaving ? "Saving..." : "Save Post"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          )}

          {/* TAB 2: SYSTEM HEALTH MONITOR */}
          {activeTab === "status" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Activity className="h-4 w-4" /> Endpoint diagnostics
                </h2>
                <button
                  onClick={fetchSystemStatus}
                  className="rounded-lg border border-[var(--card-border)] bg-black/10 px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Refresh Health Checks
                </button>
              </div>

              {statusLoading ? (
                <div className="text-center py-10 text-xs text-[var(--text-secondary)]">Running system-wide health checks...</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Database check */}
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col justify-between gap-3 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
                        <Database className="h-4 w-4 text-[var(--text-secondary)]" /> Local SQLite Database
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(status.database?.status)}`}>
                        {status.database?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">{status.database?.details}</p>
                      {status.database?.latency !== undefined && (
                        <p className="text-[10px] text-green-400 font-mono">Response: {status.database.latency}ms</p>
                      )}
                    </div>
                  </div>

                  {/* S3 check */}
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col justify-between gap-3 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
                        <Cloud className="h-4 w-4 text-[var(--text-secondary)]" /> Bun.s3 Cloud storage
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(status.s3?.status)}`}>
                        {status.s3?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)] text-ellipsis overflow-hidden">{status.s3?.details}</p>
                      {status.s3?.latency !== undefined && (
                        <p className="text-[10px] text-green-400 font-mono">Response: {status.s3.latency}ms</p>
                      )}
                    </div>
                  </div>

                  {/* Lanyard check */}
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col justify-between gap-3 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
                        <Layers className="h-4 w-4 text-[var(--text-secondary)]" /> Lanyard REST (Discord)
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(status.lanyard?.status)}`}>
                        {status.lanyard?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">{status.lanyard?.details}</p>
                      {status.lanyard?.latency !== undefined && (
                        <p className="text-[10px] text-green-400 font-mono">Ping: {status.lanyard.latency}ms</p>
                      )}
                    </div>
                  </div>

                  {/* Last.fm check */}
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col justify-between gap-3 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
                        <Music className="h-4 w-4 text-[var(--text-secondary)]" /> Last.fm API Endpoint
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(status.lastfm?.status)}`}>
                        {status.lastfm?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">{status.lastfm?.details}</p>
                      {status.lastfm?.latency !== undefined && (
                        <p className="text-[10px] text-green-400 font-mono">Ping: {status.lastfm.latency}ms</p>
                      )}
                    </div>
                  </div>

                  {/* Spotify check */}
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col justify-between gap-3 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
                        <Disc className="h-4 w-4 text-[var(--text-secondary)]" /> Spotify Accounts Auth
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(status.spotify?.status)}`}>
                        {status.spotify?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">{status.spotify?.details}</p>
                      {status.spotify?.latency !== undefined && (
                        <p className="text-[10px] text-green-400 font-mono">Ping: {status.spotify.latency}ms</p>
                      )}
                    </div>
                  </div>

                  {/* Paxsenix check */}
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 flex flex-col justify-between gap-3 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display font-bold text-sm text-[var(--text-primary)]">
                        <Key className="h-4 w-4 text-[var(--text-secondary)]" /> Paxsenix Media Resolver
                      </span>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(status.paxsenix?.status)}`}>
                        {status.paxsenix?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">{status.paxsenix?.details}</p>
                      {status.paxsenix?.latency !== undefined && (
                        <p className="text-[10px] text-green-400 font-mono">Ping: {status.paxsenix.latency}ms</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CLOUD UPLOADER */}
          {activeTab === "uploader" && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">S3 Bucket Asset Upload</h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-6 shadow-[var(--card-shadow)]"
              >
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="border-2 border-dashed border-[var(--card-border)] rounded-xl p-8 text-center bg-black/5 hover:bg-black/10 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      multiple
                      required
                      accept="image/*,video/*,application/pdf"
                      onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="h-10 w-10 mx-auto text-[var(--text-secondary)] mb-2" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {uploadFiles.length > 0
                        ? `${uploadFiles.length} file(s) selected: ${uploadFiles.map(f => f.name).join(", ").substring(0, 60)}${uploadFiles.map(f => f.name).join(", ").length > 60 ? "..." : ""}`
                        : "Click or drag files here to select"}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                      {uploadFiles.length > 0
                        ? `Total size: ${(uploadFiles.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2)} MB`
                        : "Supports images, videos, and PDFs up to 50MB (bulk allowed)"}
                    </p>
                  </div>

                  {uploadError && <p className="text-xs font-semibold text-red-400">{uploadError}</p>}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={uploadLoading || uploadFiles.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-text)] hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {uploadLoading ? "Uploading to S3..." : "Upload Files"}
                    </button>
                  </div>
                </form>

                {uploadUrls.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-green-500/5 border border-green-500/10 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-green-400">
                        <Check className="h-4 w-4" /> Uploaded Links ({uploadUrls.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadUrls([]);
                          localStorage.removeItem("admin_uploaded_urls");
                        }}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      >
                        Clear History
                      </button>
                    </div>
                    
                    <div className="space-y-2.5">
                      {uploadUrls.map((url, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0 w-12 truncate">
                            File {idx + 1}:
                          </span>
                          <input
                            type="text"
                            readOnly
                            value={url}
                            className="flex-1 rounded bg-black/20 border border-[var(--card-border)] p-2 text-xs text-[var(--text-primary)] focus:outline-none select-all"
                          />
                          
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(url);
                              setCopiedIndex(idx);
                              setTimeout(() => setCopiedIndex(null), 2000);
                            }}
                            className="rounded-lg border border-[var(--card-border)] bg-black/10 hover:bg-black/20 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shrink-0 flex items-center justify-center"
                            title="Copy link"
                          >
                            {copiedIndex === idx ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* TAB 4: MODERATION BLOCKLISTS */}
          {activeTab === "moderation" && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Content Moderation Control
              </h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 space-y-6 shadow-[var(--card-shadow)]"
              >
                <form onSubmit={handleSaveModeration} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    
                    {/* Blocked Usernames */}
                    <div className="space-y-2 flex flex-col">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Blocked Usernames / Reserved Terms
                      </label>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Usernames that visitors cannot register, or use as guest names. Put each word/phrase on a new line.
                      </p>
                      <textarea
                        rows={8}
                        value={blockedUsernames.join("\n")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlockedUsernames(val.split("\n").map(s => s.trim()).filter(s => s.length > 0));
                        }}
                        className="w-full flex-1 rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none min-h-[160px]"
                        placeholder="admin&#10;owner&#10;moderator"
                      />
                    </div>

                    {/* Blocked Words */}
                    <div className="space-y-2 flex flex-col">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Blocked Words / Prohibited Content
                      </label>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Submissions (guestbook entries, replies, comments) containing these words will be blocked. Put each term on a new line.
                      </p>
                      <textarea
                        rows={8}
                        value={blockedWords.join("\n")}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlockedWords(val.split("\n").map(s => s.trim()).filter(s => s.length > 0));
                        }}
                        className="w-full flex-1 rounded-xl bg-black/10 border border-[var(--card-border)] px-3 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none min-h-[160px]"
                        placeholder="blocked_word_1&#10;blocked_word_2"
                      />
                    </div>

                  </div>

                  {moderationError && <p className="text-xs font-semibold text-red-400">{moderationError}</p>}
                  {moderationSuccess && <p className="text-xs font-semibold text-green-400">{moderationSuccess}</p>}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={moderationSaving}
                      className="rounded-xl bg-[var(--accent)] hover:opacity-90 px-5 py-2 text-xs font-bold text-[var(--accent-text)] transition-colors uppercase tracking-wider disabled:opacity-50"
                    >
                      {moderationSaving ? "Saving blocklists..." : "Save Blocklists"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </div>

        <div className="mx-auto max-w-4xl px-4 mt-12 sm:px-6 lg:px-8">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
