export type UsesItem = {
  name: string;
  description: string;
  url?: string;
  note?: string; // e.g. "primary", "daily"
  slug?: string; // Simple Icons CDN slug override (if name doesn't match)
};

export type UsesCategory = {
  index: string;
  name: string;
  items: UsesItem[];
};

export const uses: UsesCategory[] = [
  {
    index: "01",
    name: "Stack",
    items: [
      {
        name: "Next.js",
        description: "Full-stack React framework. Pages router with API routes.",
        url: "https://nextjs.org",
        slug: "nextdotjs",
      },
      {
        name: "TypeScript",
        description: "Typed JavaScript. Catches mistakes before they ship.",
        url: "https://typescriptlang.org",
      },
      {
        name: "Bun",
        description: "JavaScript runtime powering the VPS server and SQLite KV store via bun:sqlite.",
        url: "https://bun.sh",
        note: "primary",
      },
      {
        name: "Tailwind CSS",
        description: "Utility-first CSS. Design directly in markup.",
        url: "https://tailwindcss.com",
        slug: "tailwindcss",
      },
      {
        name: "Framer Motion",
        description: "Animation library for React. Used for all transitions on this site.",
        url: "https://framer.com/motion",
        slug: "framer",
      },
      {
        name: "SWR",
        description: "React hooks for remote data fetching with caching.",
        url: "https://swr.vercel.app",
      },
    ],
  },
  {
    index: "02",
    name: "Editor",
    items: [
      {
        name: "Zed",
        description: "Fast, minimal code editor written in Rust. My daily driver.",
        url: "https://zed.dev",
        note: "primary",
      },
      {
        name: "VS Code",
        description: "Microsoft's versatile editor. Fallback for extensions.",
        url: "https://code.visualstudio.com",
        slug: "visualstudiocode",
      },
    ],
  },
  {
    index: "03",
    name: "Hosting & infra",
    items: [
      {
        name: "Vercel",
        description: "Deploys this site. Zero-config Next.js hosting with edge functions.",
        url: "https://vercel.com",
      },
      {
        name: "Bun SQLite KV",
        description: "Local SQLite-backed key-value store via bun:sqlite. Persists badges, activity history, and cache across restarts.",
        url: "https://bun.sh/docs/api/sqlite",
        slug: "sqlite",
      },
      {
        name: "Cloudflare",
        description: "DNS, CDN, and proxy for abyn.xyz.",
        url: "https://cloudflare.com",
      },
    ],
  },
  {
    index: "04",
    name: "Services",
    items: [
      {
        name: "Last.fm",
        description: "Tracks every song I listen to. Powers the /music page.",
        url: "https://last.fm",
        note: "daily",
        slug: "lastdotfm",
      },
      {
        name: "Lanyard",
        description: "Exposes my Discord presence as a real-time API. Powers the live status on the home page.",
        url: "https://lanyard.rest",
      },
      {
        name: "Open-Meteo",
        description: "Free weather API with no key required. Fetched server-side.",
        url: "https://open-meteo.com",
      },
    ],
  },
  {
    index: "05",
    name: "Design",
    items: [
      {
        name: "Sen",
        description: "Display font for headings. Clean, geometric sans-serif.",
        url: "https://fonts.google.com/specimen/Sen",
        note: "display",
        slug: "googlefonts",
      },
      {
        name: "Jost",
        description: "Body font for UI text. Geometric and readable.",
        url: "https://fonts.google.com/specimen/Jost",
        note: "body",
        slug: "googlefonts",
      },
      {
        name: "Lucide",
        description: "Open-source icon library. Used throughout the site.",
        url: "https://lucide.dev",
      },
    ],
  },
  {
    index: "06",
    name: "Daily",
    items: [
      {
        name: "Discord",
        description: "Where I spend most of my online time.",
        url: "https://discord.com",
        note: "daily",
      },
      {
        name: "Spotify",
        description: "Primary music streaming. Linked to Last.fm for scrobbling.",
        url: "https://spotify.com",
        note: "daily",
      },
    ],
  },
];
