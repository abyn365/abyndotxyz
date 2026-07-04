export type UsesItem = {
  name: string;
  description: string;
  url?: string;
  note?: string; // e.g. "primary", "daily"
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
      },
      {
        name: "TypeScript",
        description: "Typed JavaScript. Catches mistakes before they ship.",
        url: "https://typescriptlang.org",
      },
      {
        name: "Tailwind CSS",
        description: "Utility-first CSS. Design directly in markup.",
        url: "https://tailwindcss.com",
      },
      {
        name: "Framer Motion",
        description: "Animation library for React. Used for all transitions on this site.",
        url: "https://framer.com/motion",
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
        name: "Vercel KV",
        description: "Redis-backed key-value store. Used to cache Last.fm, Spotify, and weather responses.",
        url: "https://vercel.com/storage/kv",
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
      },
      {
        name: "Jost",
        description: "Body font for UI text. Geometric and readable.",
        url: "https://fonts.google.com/specimen/Jost",
        note: "body",
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
