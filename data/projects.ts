export interface Project {
  name: string;
  description: string;
  tech: string[];
  github?: string;
  link?: string;
  image?: string;
  featured?: boolean;
  popular?: boolean;
  stars?: number;
  homepage?: string | null;
  languages?: Array<{ name: string; percentage: number }>;
}

export const projects: Project[] = [
  {
    name: "abyn.xyz",
    description:
      "A modern, responsive personal bio/link-in-bio website with Spotify, Discord, and visitor analytics integrations.",
    tech: ["Next.js", "TypeScript", "TailwindCSS", "Framer Motion"],
    github: "https://github.com/abyn365/abyndotxyz",
    link: "https://abyn.xyz",
    image: "https://github.com/abyn365/abyndotxyz/raw/main/public/Darktheme.png",
    featured: true,
  },
  {
    name: "Cloud Infrastructure",
    description:
      "Scalable cloud infrastructure projects leveraging modern DevOps practices and automation tooling.",
    tech: ["AWS", "Terraform", "Docker", "CI/CD"],
    github: "https://github.com/abyn365",
    featured: false,
  },
  {
    name: "Discord Bot Suite",
    description:
      "A collection of Discord bots for community management, music playback, and server moderation.",
    tech: ["Node.js", "Discord.js", "Redis", "PostgreSQL"],
    github: "https://github.com/abyn365",
    featured: false,
    popular: false,
  },
  {
    name: "Portfolio Site",
    description:
      "Personal portfolio and biolink page with real-time activity tracking and modern UI/UX design.",
    tech: ["Next.js", "TypeScript", "TailwindCSS", "Vercel"],
    link: "https://abyn.xyz",
    image: "https://abyn.xyz/banner.png",
    featured: false,
  },
];