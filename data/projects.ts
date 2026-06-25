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
      "My personal site: a calm portfolio built around live presence, music, and small details from the web.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    github: "https://github.com/abyn365/abyndotxyz",
    link: "https://abyn.xyz",
    homepage: "https://abyn.xyz",
    image:
      "https://github.com/abyn365/abyndotxyz/raw/main/public/Darktheme.png",
    featured: true,
  },
];
