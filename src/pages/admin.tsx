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
  Shield,
  X,
  FileText,
  FolderOpen,
} from "lucide-react";
import { PageFooter } from "../components/PageFooter";
import { parseMarkdown } from "../lib/markdown";

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

interface Photo {
  id: string;
  url: string;
  description: string;
  aspectRatio: number;
  tags?: string[];
  createdAt: number;
  blurDataUrl?: string;
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

// Rich structural object blueprint for multi-file record persistent histories
interface UploadedFileRecord {
  url: string;
  name: string;
  type?: string;
  uploadedAt: number;
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
  const [activeTab, setActiveTab] = useState<
    "posts" | "status" | "uploader" | "moderation" | "photos"
  >("posts");
  const [editorTags, setEditorTags] = useState("");

  // Photos states
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [isCreatingPhoto, setIsCreatingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoDesc, setPhotoDesc] = useState("");
  const [photoTags, setPhotoTags] = useState("");
  const [photoAspectRatio, setPhotoAspectRatio] = useState("1.0");
  const [photoBlurDataUrl, setPhotoBlurDataUrl] = useState("");
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoSuccess, setPhotoSuccess] = useState("");

  // Moderation state
  const [blockedUsernames, setBlockedUsernames] = useState<string[]>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [blockedUsernameInput, setBlockedUsernameInput] = useState("");
  const [blockedWordInput, setBlockedWordInput] = useState("");
  const [moderationSaving, setModerationSaving] = useState(false);
  const [moderationError, setModerationError] = useState("");
  const [moderationSuccess, setModerationSuccess] = useState("");

  // Upgraded structural file record collections
  const [uploadUrls, setUploadUrls] = useState<UploadedFileRecord[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
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
        const parsed = JSON.parse(stored);
        // Clean migration normalization pipeline for backward compatibility maps
        const normalized: UploadedFileRecord[] = parsed.map((item: any) => {
          if (typeof item === "string") {
            return {
              url: item,
              name: item.split("/").pop() || "Legacy Uploaded File",
              uploadedAt: Date.now(),
            };
          }
          return item;
        });
        setUploadUrls(normalized);
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
            sitekey:
              process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
              "0x4AAAAAADv9KsIrMSbSARa-",
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
    fetchPhotos();
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
          blockedWords,
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

  const fetchPhotos = async () => {
    setPhotosLoading(true);
    try {
      const res = await fetch("/api/photos");
      const data = await res.json();
      if (data.success) {
        setPhotos(data.photos || []);
      }
    } catch (e) {
      console.error("Failed to load photos", e);
    } finally {
      setPhotosLoading(false);
    }
  };

  const handleOpenEditPhoto = (photo: Photo) => {
    setEditingPhoto(photo);
    setIsCreatingPhoto(false);
    setPhotoUrl(photo.url);
    setPhotoDesc(photo.description);
    setPhotoTags(photo.tags ? photo.tags.join(", ") : "");
    setPhotoAspectRatio(photo.aspectRatio.toString());
    setPhotoBlurDataUrl(photo.blurDataUrl || "");
    setPhotoError("");
    setPhotoSuccess("");
  };

  const handleOpenCreatePhoto = () => {
    setEditingPhoto(null);
    setIsCreatingPhoto(true);
    setPhotoUrl("");
    setPhotoDesc("");
    setPhotoTags("");
    setPhotoAspectRatio("1.0");
    setPhotoBlurDataUrl("");
    setPhotoError("");
    setPhotoSuccess("");
  };

  const handleClosePhotoEditor = () => {
    setEditingPhoto(null);
    setIsCreatingPhoto(false);
    setPhotoBlurDataUrl("");
    setPhotoError("");
    setPhotoSuccess("");
  };

  const autoDetectAspectRatio = (url: string) => {
    if (!url) return;
    
    // Support relative paths by resolving them to the current origin
    const resolvedUrl = url.startsWith("http") ? url : window.location.origin + url;
    
    const img = new Image();
    // Do not set crossOrigin initially to ensure the image loads even if CORS is restricted,
    // allowing us to always detect the aspect ratio.
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        const ratio = img.naturalWidth / img.naturalHeight;
        setPhotoAspectRatio(ratio.toFixed(3));

        // Attempt to generate the blur placeholder as a best effort (requires CORS)
        const corsImg = new Image();
        corsImg.crossOrigin = "anonymous";
        corsImg.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 8;
            canvas.height = 8;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(corsImg, 0, 0, 8, 8);
              const base64 = canvas.toDataURL("image/jpeg", 0.6);
              setPhotoBlurDataUrl(base64);
            }
          } catch (err) {
            console.warn("CORS limitation prevented client-side placeholder generation:", err);
          }
        };
        corsImg.src = resolvedUrl;
      }
    };
    img.onerror = (err) => {
      console.error("Failed to load image for aspect ratio detection:", err);
    };
    img.src = resolvedUrl;
  };


  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) {
      setPhotoError("Photo URL is required.");
      return;
    }

    setPhotoSaving(true);
    setPhotoError("");
    setPhotoSuccess("");

    const payload = {
      id: isCreatingPhoto ? undefined : editingPhoto?.id,
      url: photoUrl.trim(),
      description: photoDesc.trim(),
      aspectRatio: parseFloat(photoAspectRatio) || 1.0,
      tags: photoTags.split(",").map(t => t.trim()).filter(Boolean),
      createdAt: isCreatingPhoto ? Date.now() : editingPhoto?.createdAt,
      blurDataUrl: photoBlurDataUrl || editingPhoto?.blurDataUrl,
    };

    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setPhotoSuccess(isCreatingPhoto ? "Photo added successfully!" : "Photo updated successfully!");
        fetchPhotos();
        handleClosePhotoEditor();
      } else {
        setPhotoError(data.error || "Failed to save photo.");
      }
    } catch (err: any) {
      setPhotoError(err.message || "Error saving photo.");
    } finally {
      setPhotoSaving(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      const res = await fetch("/api/photos", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchPhotos();
      } else {
        alert(data.error || "Failed to delete photo.");
      }
    } catch (err: any) {
      alert("Error deleting photo.");
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
          token: turnstileToken,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUsernameInput("");
        setPasswordInput("");
        setAuthenticated(true);
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
    setEditorTags(post.tags ? post.tags.join(", ") : "");
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
    setEditorTags("");
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
      tags: editorTags.split(",").map((t) => t.trim()).filter(Boolean),
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

  const readFileAsBase64 = (
    file: File
  ): Promise<{ fileName: string; fileType: string; fileContent: string }> => {
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
      reader.onerror = () =>
        reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    setUploadLoading(true);
    setUploadError("");

    try {
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
        // Map raw S3 outputs directly into structural object blueprints
        const newRecords: UploadedFileRecord[] = data.files.map((f: any) => ({
          url: f.url,
          name: f.name || f.url.split("/").pop() || "Uploaded File",
          type: f.type,
          uploadedAt: Date.now(),
        }));

        setUploadUrls((prev) => {
          const updated = [...newRecords, ...prev];
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

  // Dedicated single index deletion interface for historical entries
  const handleDeleteHistoryItem = (indexToRemove: number) => {
    setUploadUrls((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      localStorage.setItem("admin_uploaded_urls", JSON.stringify(updated));
      return updated;
    });
  };

  // Synchronous string parser to isolate source extensions for high-performance media matching
  const getFileExtension = (url: string): string => {
    try {
      const cleanUrl = url.split("?")[0];
      return cleanUrl.split(".").pop()?.toLowerCase() || "";
    } catch {
      return "";
    }
  };

  const getStatusColor = (
    sStatus?: "online" | "offline" | "disabled" | "warning"
  ) => {
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
              className="space-y-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-8 shadow-[var(--card-shadow)]"
            >
              <div className="space-y-2 text-center">
                <Key className="mx-auto h-10 w-10 text-[var(--text-primary)]" />
                <h1 className="font-display text-2xl font-black text-[var(--text-primary)]">
                  Admin Access
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  Secure area for managing posts and reviewing health checks
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                    placeholder="e.g. admin"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex justify-center py-1">
                  <div
                    id="admin-turnstile-container"
                    ref={turnstileContainerRef}
                    className="flex w-full scale-90 justify-center sm:scale-100"
                  />
                </div>

                {loginError && (
                  <p className="text-xs font-semibold text-red-400">
                    {loginError}
                  </p>
                )}

                <Script
                  src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                  strategy="lazyOnload"
                />

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full rounded-xl bg-[var(--accent)] py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--accent-text)] transition-colors hover:opacity-90"
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

  return (
    <>
      <Head>
        <title>Admin Dashboard · abyn</title>
      </Head>

      <main className="relative min-h-screen pb-16">
        <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-black text-[var(--text-primary)]">
                Admin Panel
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                Signed in as {adminUser}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 transition-all hover:bg-red-500/15 sm:self-center"
            >
              <LogOut className="h-3.5 w-3.5" /> LOGOUT
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6 flex gap-6 border-b border-[var(--card-border)]">
            <button
              onClick={() => {
                setActiveTab("posts");
                handleCloseEditor();
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "posts"
                  ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Manage Posts
            </button>
            <button
              onClick={() => {
                setActiveTab("status");
                handleCloseEditor();
                fetchSystemStatus();
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "status"
                  ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Status Monitor
            </button>
            <button
              onClick={() => {
                setActiveTab("uploader");
                handleCloseEditor();
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "uploader"
                  ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Cloud Uploader
            </button>
            <button
              onClick={() => {
                setActiveTab("moderation");
                handleCloseEditor();
                fetchModerationSettings();
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "moderation"
                  ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Moderation
            </button>
            <button
              onClick={() => {
                setActiveTab("photos");
                handleCloseEditor();
                handleClosePhotoEditor();
                fetchPhotos();
              }}
              className={`pb-2.5 text-xs font-bold uppercase tracking-wider ${
                activeTab === "photos"
                  ? "border-b-2 border-[var(--accent)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)]"
              }`}
            >
              Photos Gallery
            </button>
          </div>

          {/* TAB 1: POSTS EDITOR AND MANAGEMENT */}
          {activeTab === "posts" && (
            <div className="space-y-6">
              {!isCreating && !editingPost ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      Blog articles
                    </h2>
                    <button
                      onClick={handleOpenCreate}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-text)] transition-opacity hover:opacity-90"
                    >
                      <PlusCircle className="h-4 w-4" /> Create Article
                    </button>
                  </div>

                  {postsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 animate-pulse"
                        >
                          <div className="min-w-0 flex-1 space-y-2">
                            <div className="h-4 w-1/3 rounded bg-white/5" />
                            <div className="h-3.5 w-1/2 rounded bg-white/5" />
                          </div>
                          <div className="h-8 w-24 rounded bg-white/5" />
                        </div>
                      ))}
                    </div>
                  ) : posts.length === 0 ? (
                    <div className="rounded-xl border border-[var(--card-border)] bg-black/10 p-12 text-center text-xs italic text-[var(--text-secondary)]">
                      No blog posts. Create one to begin!
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {posts.map((post) => (
                        <div
                          key={post.slug}
                          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 transition-all hover:shadow-[var(--card-shadow)]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-display text-sm font-bold text-[var(--text-primary)]">
                                {post.title}
                              </h3>
                              <span className="font-mono text-[10px] text-[var(--text-secondary)]">
                                ({post.slug})
                              </span>
                              {post.published ? (
                                <span className="py-0.2 flex items-center gap-0.5 rounded border border-green-500/20 bg-green-500/10 px-1 text-[8px] font-bold uppercase tracking-wider text-green-500">
                                  <Eye className="h-2 w-2" /> Live
                                </span>
                              ) : (
                                <span className="py-0.2 flex items-center gap-0.5 rounded border border-amber-500/20 bg-amber-500/10 px-1 text-[8px] font-bold uppercase tracking-wider text-amber-500">
                                  <EyeOff className="h-2 w-2" /> Draft
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                              {post.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(post)}
                              className="rounded-lg border border-[var(--card-border)] bg-black/10 p-1.5 text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                              title="Edit post"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.slug)}
                              className="rounded-lg border border-red-500/10 bg-red-500/5 p-1.5 text-red-400 transition-colors hover:bg-red-500/10"
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6"
                >
                  <div className="flex items-center justify-between border-b border-[var(--card-border)] pb-3">
                    <h2 className="font-display text-base font-bold text-[var(--text-primary)]">
                      {isCreating
                        ? "New Blog Article"
                        : `Edit Article: ${editingPost?.title}`}
                    </h2>
                    <button
                      onClick={handleCloseEditor}
                      className="text-xs font-bold uppercase text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleSavePost} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Title
                        </label>
                        <input
                          type="text"
                          required
                          value={editorTitle}
                          onChange={(e) => setEditorTitle(e.target.value)}
                          className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                          placeholder="e.g. My Coding Journey"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Slug (URL-friendly)
                        </label>
                        <input
                          type="text"
                          required
                          disabled={!isCreating}
                          value={editorSlug}
                          onChange={(e) => setEditorSlug(e.target.value)}
                          className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none disabled:opacity-50 sm:text-sm"
                          placeholder="e.g. my-coding-journey"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Description (Snippet)
                      </label>
                      <input
                        type="text"
                        value={editorDesc}
                        onChange={(e) => setEditorDesc(e.target.value)}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                        placeholder="Short summary of this article..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Cover Image URL
                      </label>
                      <input
                        type="text"
                        value={editorCover}
                        onChange={(e) => setEditorCover(e.target.value)}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                        placeholder="https://..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={editorTags}
                        onChange={(e) => setEditorTags(e.target.value)}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                        placeholder="e.g. tech, coding, news"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Markdown Content
                        </label>
                        <textarea
                          required
                          rows={12}
                          value={editorContent}
                          onChange={(e) => setEditorContent(e.target.value)}
                          className="w-full flex-1 resize-none rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 font-mono text-xs text-[var(--text-primary)] focus:outline-none"
                          placeholder="# Write article here..."
                        />
                      </div>

                      <div className="flex max-h-[300px] flex-col space-y-1.5 overflow-hidden sm:max-h-[370px]">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Live Render Preview
                        </label>
                        <div className="prose prose-neutral dark:prose-invert w-full max-w-none flex-1 overflow-y-auto rounded-xl border border-[var(--card-border)] bg-black/5 p-3 text-left">
                          {editorContent.trim() ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdown(editorContent),
                              }}
                            />
                          ) : (
                            <p className="text-xs italic text-[var(--text-secondary)]">
                              Type something in markdown to see preview...
                            </p>
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
                        className="h-4 w-4 rounded border-[var(--card-border)] bg-black/10 accent-[var(--accent)]"
                      />
                      <label
                        htmlFor="published"
                        className="cursor-pointer text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]"
                      >
                        Publish Immediately
                      </label>
                    </div>

                    {editorError && (
                      <p className="text-xs font-semibold text-red-400">
                        {editorError}
                      </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
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
                        className="rounded-xl bg-[var(--accent)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-text)] transition-colors hover:opacity-90"
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
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  <Activity className="h-4 w-4" /> Endpoint diagnostics
                </h2>
                <button
                  onClick={fetchSystemStatus}
                  className="rounded-lg border border-[var(--card-border)] bg-black/10 px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  Refresh Health Checks
                </button>
              </div>

              {statusLoading ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 animate-pulse h-28"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-1/3 rounded bg-white/5" />
                        <div className="h-4 w-12 rounded bg-white/5" />
                      </div>
                      <div className="h-3.5 w-1/2 rounded bg-white/5" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-sm font-bold text-[var(--text-primary)]">
                        <Database className="h-4 w-4 text-[var(--text-secondary)]" />{" "}
                        Local SQLite Database
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(
                          status.database?.status
                        )}`}
                      >
                        {status.database?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">
                        {status.database?.details}
                      </p>
                      {status.database?.latency !== undefined && (
                        <p className="font-mono text-[10px] text-green-400">
                          Response: {status.database.latency}ms
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-sm font-bold text-[var(--text-primary)]">
                        <Cloud className="h-4 w-4 text-[var(--text-secondary)]" />{" "}
                        Bun.s3 Cloud storage
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(
                          status.s3?.status
                        )}`}
                      >
                        {status.s3?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="overflow-hidden text-ellipsis text-xs text-[var(--text-secondary)]">
                        {status.s3?.details}
                      </p>
                      {status.s3?.latency !== undefined && (
                        <p className="font-mono text-[10px] text-green-400">
                          Response: {status.s3.latency}ms
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-sm font-bold text-[var(--text-primary)]">
                        <Layers className="h-4 w-4 text-[var(--text-secondary)]" />{" "}
                        Lanyard REST (Discord)
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(
                          status.lanyard?.status
                        )}`}
                      >
                        {status.lanyard?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">
                        {status.lanyard?.details}
                      </p>
                      {status.lanyard?.latency !== undefined && (
                        <p className="font-mono text-[10px] text-green-400">
                          Ping: {status.lanyard.latency}ms
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-sm font-bold text-[var(--text-primary)]">
                        <Music className="h-4 w-4 text-[var(--text-secondary)]" />{" "}
                        Last.fm API Endpoint
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(
                          status.lastfm?.status
                        )}`}
                      >
                        {status.lastfm?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">
                        {status.lastfm?.details}
                      </p>
                      {status.lastfm?.latency !== undefined && (
                        <p className="font-mono text-[10px] text-green-400">
                          Ping: {status.lastfm.latency}ms
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-sm font-bold text-[var(--text-primary)]">
                        <Disc className="h-4 w-4 text-[var(--text-secondary)]" />{" "}
                        Spotify Accounts Auth
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(
                          status.spotify?.status
                        )}`}
                      >
                        {status.spotify?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">
                        {status.spotify?.details}
                      </p>
                      {status.spotify?.latency !== undefined && (
                        <p className="font-mono text-[10px] text-green-400">
                          Ping: {status.spotify.latency}ms
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 font-display text-sm font-bold text-[var(--text-primary)]">
                        <Key className="h-4 w-4 text-[var(--text-secondary)]" />{" "}
                        Paxsenix Media Resolver
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${getStatusColor(
                          status.paxsenix?.status
                        )}`}
                      >
                        {status.paxsenix?.status}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[var(--text-secondary)]">
                        {status.paxsenix?.details}
                      </p>
                      {status.paxsenix?.latency !== undefined && (
                        <p className="font-mono text-[10px] text-green-400">
                          Ping: {status.paxsenix.latency}ms
                        </p>
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
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                S3 Bucket Asset Upload
              </h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
              >
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-[var(--card-border)] bg-black/5 p-8 text-center transition-colors hover:bg-black/10">
                    <input
                      type="file"
                      multiple
                      required
                      accept="image/*,image/svg+xml,video/*,audio/*,application/pdf"
                      onChange={(e) =>
                        setUploadFiles(Array.from(e.target.files || []))
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <Upload className="mx-auto mb-2 h-10 w-10 text-[var(--text-secondary)]" />
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {uploadFiles.length > 0
                        ? `${uploadFiles.length} file(s) selected: ${uploadFiles
                            .map((f) => f.name)
                            .join(", ")
                            .substring(0, 60)}${
                            uploadFiles.map((f) => f.name).join(", ").length >
                            60
                              ? "..."
                              : ""
                          }`
                        : "Click or drag files here to select"}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-secondary)]">
                      {uploadFiles.length > 0
                        ? `Total size: ${(
                            uploadFiles.reduce((acc, f) => acc + f.size, 0) /
                            1024 /
                            1024
                          ).toFixed(2)} MB`
                        : "Supports images, gifs, audio, videos, and PDFs up to 50MB (bulk allowed)"}
                    </p>
                  </div>

                  {uploadError && (
                    <p className="text-xs font-semibold text-red-400">
                      {uploadError}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={uploadLoading || uploadFiles.length === 0}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--accent-text)] transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {uploadLoading ? "Uploading to S3..." : "Upload Files"}
                    </button>
                  </div>
                </form>

                {uploadUrls.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 rounded-xl border border-green-500/10 bg-green-500/5 p-4"
                  >
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5 text-green-400">
                        <Check className="h-4 w-4" /> Persistent History Archive
                        ({uploadUrls.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(
                              "Clear all items from your persistent history?"
                            )
                          ) {
                            setUploadUrls([]);
                            localStorage.removeItem("admin_uploaded_urls");
                          }
                        }}
                        className="cursor-pointer text-[10px] text-red-400 transition-colors hover:text-red-300"
                      >
                        Clear All History
                      </button>
                    </div>

                    {/* Persistent Media History Feed Grid Stack */}
                    <div className="scrollbar-thin max-h-[500px] space-y-3 overflow-y-auto pr-1">
                      {uploadUrls.map((record, idx) => {
                        const fileExt = getFileExtension(record.url);
                        const isImg = [
                          "jpg",
                          "jpeg",
                          "png",
                          "webp",
                          "gif",
                          "svg",
                          "avif",
                        ].includes(fileExt);
                        const isVid = ["mp4", "webm", "ogg", "mov"].includes(
                          fileExt
                        );
                        const isAud = ["mp3", "wav", "flac", "m4a"].includes(
                          fileExt
                        );

                        return (
                          <div
                            key={`${record.url}-${idx}`}
                            className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-black/20 p-3 transition-colors hover:bg-black/30"
                          >
                            {/* Layout-Cropped Asset Thumbnail Media Blocks */}
                            <div className="relative flex h-14 w-14 shrink-0 select-none items-center justify-center overflow-hidden rounded-lg border border-white/5 bg-black/40 shadow-inner">
                              {isImg && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={record.url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              )}
                              {isVid && (
                                <video
                                  src={record.url}
                                  className="h-full w-full object-cover"
                                  muted
                                  playsInline
                                  preload="metadata"
                                />
                              )}
                              {isAud && (
                                <Music className="h-5 w-5 text-neutral-400" />
                              )}
                              {!isImg && !isVid && !isAud && (
                                <FileText className="h-5 w-5 text-neutral-400" />
                              )}
                            </div>

                            {/* Item Description Text Content Block */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div
                                className="truncate font-mono text-[10px] font-medium text-[var(--text-secondary)]"
                                title={record.name}
                              >
                                {record.name}
                              </div>
                              <input
                                type="text"
                                readOnly
                                value={record.url}
                                className="w-full select-all rounded border border-white/5 bg-black/30 px-2 py-1 font-mono text-[11px] text-[var(--text-primary)] focus:outline-none"
                              />
                            </div>

                            {/* Actions Group Row */}
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(record.url);
                                  setCopiedIndex(idx);
                                  setTimeout(() => setCopiedIndex(null), 2000);
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--card-border)] bg-black/10 p-2 text-[var(--text-secondary)] transition-all hover:bg-black/20 hover:text-[var(--text-primary)]"
                                title="Copy asset reference link"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteHistoryItem(idx)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/5 p-2 text-red-400 transition-all hover:bg-red-500/10"
                                title="Remove from tracking views"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* TAB 4: MODERATION BLOCKLISTS */}
          {activeTab === "moderation" && (
            <div className="space-y-6">
              <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                <Shield className="h-4 w-4" /> Content Moderation Control
              </h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
              >
                <form onSubmit={handleSaveModeration} className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Blocked Usernames */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Blocked Usernames / Reserved Terms
                      </label>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Usernames that visitors cannot register, or use as guest
                        names. Type a term and press Enter or comma.
                      </p>
                      <div className="align-content-start flex min-h-[160px] flex-wrap gap-1.5 rounded-xl border border-[var(--card-border)] bg-black/10 p-2.5 transition-colors focus-within:border-[var(--accent)]">
                        {blockedUsernames.map((username) => (
                          <div
                            key={username}
                            className="flex items-center gap-1 rounded-md border border-[var(--card-border)] bg-black/20 px-2 py-0.5 text-xs text-[var(--text-primary)]"
                          >
                            <span>{username}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setBlockedUsernames(
                                  blockedUsernames.filter((u) => u !== username)
                                );
                              }}
                              className="cursor-pointer text-[var(--text-secondary)] transition-colors hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={blockedUsernameInput}
                          onChange={(e) =>
                            setBlockedUsernameInput(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const trimmed = blockedUsernameInput
                                .trim()
                                .toLowerCase();
                              if (
                                trimmed &&
                                !blockedUsernames.includes(trimmed)
                              ) {
                                setBlockedUsernames([
                                  ...blockedUsernames,
                                  trimmed,
                                ]);
                              }
                              setBlockedUsernameInput("");
                            } else if (
                              e.key === "Backspace" &&
                              !blockedUsernameInput &&
                              blockedUsernames.length > 0
                            ) {
                              setBlockedUsernames(
                                blockedUsernames.slice(0, -1)
                              );
                            }
                          }}
                          className="min-w-[100px] flex-1 border-none bg-transparent py-0.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                          placeholder={
                            blockedUsernames.length === 0
                              ? "Type username and press Enter..."
                              : ""
                          }
                        />
                      </div>
                    </div>

                    {/* Blocked Words */}
                    <div className="flex flex-col space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Blocked Words / Prohibited Content
                      </label>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Submissions (guestbook entries, replies, comments)
                        containing these words will be blocked. Type a term and
                        press Enter or comma.
                      </p>
                      <div className="align-content-start flex min-h-[160px] flex-wrap gap-1.5 rounded-xl border border-[var(--card-border)] bg-black/10 p-2.5 transition-colors focus-within:border-[var(--accent)]">
                        {blockedWords.map((word) => (
                          <div
                            key={word}
                            className="flex items-center gap-1 rounded-md border border-[var(--card-border)] bg-black/20 px-2 py-0.5 text-xs text-[var(--text-primary)]"
                          >
                            <span>{word}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setBlockedWords(
                                  blockedWords.filter((w) => w !== word)
                                );
                              }}
                              className="cursor-pointer text-[var(--text-secondary)] transition-colors hover:text-red-400"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <input
                          type="text"
                          value={blockedWordInput}
                          onChange={(e) => setBlockedWordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === ",") {
                              e.preventDefault();
                              const trimmed = blockedWordInput
                                .trim()
                                .toLowerCase();
                              if (trimmed && !blockedWords.includes(trimmed)) {
                                setBlockedWords([...blockedWords, trimmed]);
                              }
                              setBlockedWordInput("");
                            } else if (
                              e.key === "Backspace" &&
                              !blockedWordInput &&
                              blockedWords.length > 0
                            ) {
                              setBlockedWords(blockedWords.slice(0, -1));
                            }
                          }}
                          className="min-w-[100px] flex-1 border-none bg-transparent py-0.5 text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-secondary)]"
                          placeholder={
                            blockedWords.length === 0
                              ? "Type word and press Enter..."
                              : ""
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {moderationError && (
                    <p className="text-xs font-semibold text-red-400">
                      {moderationError}
                    </p>
                  )}
                  {moderationSuccess && (
                    <p className="text-xs font-semibold text-green-400">
                      {moderationSuccess}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={moderationSaving}
                      className="rounded-xl bg-[var(--accent)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-text)] transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      {moderationSaving
                        ? "Saving blocklists..."
                        : "Save Blocklists"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* TAB 5: PHOTOS GALLERY */}
          {activeTab === "photos" && (
            <div className="space-y-6">
              {!isCreatingPhoto && !editingPhoto ? (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                      <FolderOpen className="h-4 w-4" /> Gallery Photo Items ({photos.length})
                    </h2>
                    <button
                      onClick={handleOpenCreatePhoto}
                      className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--accent-text)] transition-opacity hover:opacity-90"
                    >
                      <PlusCircle className="h-3.5 w-3.5" /> Add Photo
                    </button>
                  </div>

                  {photosLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 animate-pulse space-y-3"
                        >
                          <div className="aspect-video w-full rounded-lg bg-white/5" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-3 w-5/6 rounded bg-white/5" />
                            <div className="h-2.5 w-1/3 rounded bg-white/5" />
                          </div>
                          <div className="h-7 w-full rounded bg-white/5" />
                        </div>
                      ))}
                    </div>
                  ) : photos.length === 0 ? (
                    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-12 text-center text-sm text-[var(--text-secondary)] italic">
                      No photos added to your gallery yet. Click "Add Photo" to get started!
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-sm transition-all hover:bg-[var(--card-bg-mix)]"
                        >
                          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[var(--card-border)] bg-black/5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                            {photo.aspectRatio && (
                              <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-0.5 font-mono text-[9px] text-white">
                                {photo.aspectRatio} Aspect
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-3 flex-1 space-y-1.5">
                            <p className="line-clamp-2 text-xs text-[var(--text-primary)] font-medium">
                              {photo.description || <span className="italic text-[var(--text-secondary)]">No description</span>}
                            </p>
                            {photo.tags && photo.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {photo.tags.map((tag) => (
                                  <span key={tag} className="rounded bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[9px] text-[var(--text-secondary)]">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-[var(--card-border)] pt-2.5">
                            <button
                              onClick={() => handleOpenEditPhoto(photo)}
                              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--card-border)] bg-black/5 p-1.5 text-[var(--text-secondary)] transition-all hover:bg-black/10 hover:text-[var(--text-primary)]"
                              title="Edit photo info"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="flex h-7 w-7 items-center justify-center rounded border border-red-500/10 bg-red-500/5 p-1.5 text-red-400 transition-all hover:bg-red-500/10"
                              title="Delete photo"
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
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]"
                >
                  <form onSubmit={handleSavePhoto} className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">
                      {isCreatingPhoto ? "Add New Photo" : "Edit Photo"}
                    </h3>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Image Source URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={photoUrl}
                          onChange={(e) => setPhotoUrl(e.target.value)}
                          onBlur={() => autoDetectAspectRatio(photoUrl)}
                          className="w-full flex-1 rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                          placeholder="https://... or upload in Cloud Uploader first"
                        />
                        <button
                          type="button"
                          onClick={() => autoDetectAspectRatio(photoUrl)}
                          className="rounded-xl border border-[var(--card-border)] bg-black/5 px-3 text-xs text-[var(--text-secondary)] hover:bg-black/10"
                          title="Detect image dimensions"
                        >
                          Detect Ratio
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Aspect Ratio (Width / Height)
                        </label>
                        <input
                          type="text"
                          required
                          value={photoAspectRatio}
                          onChange={(e) => setPhotoAspectRatio(e.target.value)}
                          className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm font-mono"
                          placeholder="e.g. 1.5, 0.75, 1.0"
                        />
                        <span className="text-[9px] text-[var(--text-secondary)] block">
                          Tip: Portrait has ratio &lt; 1, Landscape &gt; 1, Square = 1. Auto-calculates on URL blur.
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={photoTags}
                          onChange={(e) => setPhotoTags(e.target.value)}
                          className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                          placeholder="e.g. landscape, travel, digital"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        Description / Caption
                      </label>
                      <textarea
                        rows={3}
                        value={photoDesc}
                        onChange={(e) => setPhotoDesc(e.target.value)}
                        className="w-full rounded-xl border border-[var(--card-border)] bg-black/10 px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none sm:text-sm"
                        placeholder="Caption shown on hover or full screen overlay..."
                      />
                    </div>

                    {photoError && (
                      <p className="text-xs font-semibold text-red-400">
                        {photoError}
                      </p>
                    )}
                    {photoSuccess && (
                      <p className="text-xs font-semibold text-green-400">
                        {photoSuccess}
                      </p>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleClosePhotoEditor}
                        className="rounded-xl border border-[var(--card-border)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:bg-black/5"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={photoSaving}
                        className="rounded-xl bg-[var(--accent)] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-text)] transition-colors hover:opacity-90 disabled:opacity-50"
                      >
                        {photoSaving ? "Saving..." : "Save Photo"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="mx-auto mt-12 max-w-4xl px-4 sm:px-6 lg:px-8">
          <PageFooter />
        </div>
      </main>
    </>
  );
}
