import { kv } from "./kv";
import {
  isS3Enabled,
  uploadFile,
  downloadFileAsJson,
  deleteFile
} from "./s3";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string; // Markdown text
  coverImage?: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BlogMetadata {
  slug: string;
  title: string;
  description: string;
  coverImage?: string;
  published: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BlogComment {
  id: string;
  username: string;
  content: string;
  createdAt: number;
}

const INDEX_PATH = "blog/posts.json";

// Helper to filter metadata from a BlogPost
function getMetadata(post: BlogPost): BlogMetadata {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    coverImage: post.coverImage,
    published: post.published,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   POSTS MANAGEMENT (CRUD)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export async function getPosts(): Promise<BlogPost[]> {
  // Try to load the index
  let index: BlogMetadata[] = [];
  
  if (isS3Enabled()) {
    try {
      const s3Index = await downloadFileAsJson<BlogMetadata[]>(INDEX_PATH);
      if (s3Index) index = s3Index;
    } catch {
      index = [];
    }
  } else {
    index = (await kv.get<BlogMetadata[]>("blog:posts")) || [];
  }

  // Load full content for each post (we need content for list rendering or public view,
  // or we can load just metadata. Let's write getPosts as returning full posts.
  // In practice, since posts are small, returning full posts is fine, but let's resolve them.)
  const posts: BlogPost[] = [];
  for (const meta of index) {
    const post = await getPostBySlug(meta.slug);
    if (post) {
      posts.push(post);
    }
  }

  // Sort newest first
  return posts.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  if (isS3Enabled()) {
    try {
      return await downloadFileAsJson<BlogPost>(`blog/posts/${slug}.json`);
    } catch {
      return null;
    }
  } else {
    return await kv.get<BlogPost>(`blog:post:${slug}`);
  }
}

export async function savePost(post: BlogPost): Promise<void> {
  // Get all existing posts
  const posts = await getPosts();
  const existingIndex = posts.findIndex((p) => p.slug === post.slug);
  
  if (existingIndex > -1) {
    posts[existingIndex] = post;
  } else {
    posts.push(post);
  }

  // Re-build metadata index
  const index = posts.map(getMetadata);

  if (isS3Enabled()) {
    // Write full post JSON
    await uploadFile(`blog/posts/${post.slug}.json`, JSON.stringify(post), "application/json");
    // Write index JSON
    await uploadFile(INDEX_PATH, JSON.stringify(index), "application/json");
  } else {
    // Write full post in SQLite
    await kv.set(`blog:post:${post.slug}`, post);
    // Write index in SQLite
    await kv.set("blog:posts", index);
  }
}

export async function deletePost(slug: string): Promise<void> {
  const posts = await getPosts();
  const filteredPosts = posts.filter((p) => p.slug !== slug);
  const index = filteredPosts.map(getMetadata);

  if (isS3Enabled()) {
    // Delete files
    try {
      await deleteFile(`blog/posts/${slug}.json`);
      await deleteFile(`blog/comments/${slug}.json`);
      await deleteFile(`blog/likes/${slug}.json`);
    } catch (e) {
      // Ignore delete errors if files didn't exist
    }
    // Write updated index
    await uploadFile(INDEX_PATH, JSON.stringify(index), "application/json");
  } else {
    await kv.del(`blog:post:${slug}`);
    await kv.del(`blog:comments:${slug}`);
    await kv.del(`blog:likes:${slug}`);
    await kv.set("blog:posts", index);
  }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LIKES MANAGEMENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export async function getLikes(slug: string): Promise<string[]> {
  if (isS3Enabled()) {
    try {
      const data = await downloadFileAsJson<string[]>(`blog/likes/${slug}.json`);
      return data || [];
    } catch {
      return [];
    }
  } else {
    return (await kv.get<string[]>(`blog:likes:${slug}`)) || [];
  }
}

export async function toggleLike(slug: string, username: string): Promise<string[]> {
  const likes = await getLikes(slug);
  const index = likes.indexOf(username);
  
  if (index > -1) {
    likes.splice(index, 1); // Unlike
  } else {
    likes.push(username); // Like
  }

  if (isS3Enabled()) {
    await uploadFile(`blog/likes/${slug}.json`, JSON.stringify(likes), "application/json");
  } else {
    await kv.set(`blog:likes:${slug}`, likes);
  }

  return likes;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   COMMENTS MANAGEMENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export async function getComments(slug: string): Promise<BlogComment[]> {
  if (isS3Enabled()) {
    try {
      const data = await downloadFileAsJson<BlogComment[]>(`blog/comments/${slug}.json`);
      return data || [];
    } catch {
      return [];
    }
  } else {
    return (await kv.get<BlogComment[]>(`blog:comments:${slug}`)) || [];
  }
}

export async function addComment(slug: string, username: string, content: string): Promise<BlogComment> {
  const comments = await getComments(slug);
  const newComment: BlogComment = {
    id: crypto.randomUUID(),
    username,
    content: content.trim(),
    createdAt: Date.now(),
  };

  comments.push(newComment);

  // Keep up to 500 comments to prevent performance issues
  if (comments.length > 500) {
    comments.shift();
  }

  if (isS3Enabled()) {
    await uploadFile(`blog/comments/${slug}.json`, JSON.stringify(comments), "application/json");
  } else {
    await kv.set(`blog:comments:${slug}`, comments);
  }

  return newComment;
}

export async function deleteComment(slug: string, commentId: string): Promise<void> {
  const comments = await getComments(slug);
  const filtered = comments.filter((c) => c.id !== commentId);

  if (isS3Enabled()) {
    await uploadFile(`blog/comments/${slug}.json`, JSON.stringify(filtered), "application/json");
  } else {
    await kv.set(`blog:comments:${slug}`, filtered);
  }
}
