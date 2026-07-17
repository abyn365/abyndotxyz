import { motion } from "framer-motion";
import { ArrowUpRight, Globe, ImageOff } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import type { Project } from "../data/projects";

interface ProjectCardProps {
  project: Project;
  index: number;
  variant?: "grid" | "featured";
}

export default function ProjectCard({
  project,
  index,
  variant = "grid",
}: ProjectCardProps) {
  const href = project.homepage ?? project.link ?? project.github ?? "#";
  const imageSrc = project.image?.trim();
  const tags = (project.languages?.map((l) => l.name) ?? project.tech).slice(
    0,
    4
  );
  const isFeatured = variant === "featured";

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={[
          "block p-5 rounded-2xl border transition-all duration-300 bg-[var(--card-bg)] backdrop-blur-md hover:bg-white/[0.02] dark:hover:bg-white/[0.01]",
          isFeatured ? "sm:grid sm:grid-cols-[1.2fr_0.8fr] sm:gap-6 items-center" : "",
        ].join(" ")}
        style={{
          borderColor: "var(--card-border)",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        onMouseMove={(e) => {
          const card = e.currentTarget;
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const rotateX = ((y / rect.height) - 0.5) * -4; // subtle 3d tilt
          const rotateY = ((x / rect.width) - 0.5) * 4;
          card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
          e.currentTarget.style.transition = "transform 400ms cubic-bezier(0.25, 0.8, 0.25, 1)";
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transition = "transform 80ms ease-out";
        }}
      >
        {/* Content Side */}
        <div className="px-2">
          {/* Meta row */}
          <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[var(--text-secondary)]">
            {project.github ? (
              <FaGithub className="h-3 w-3" />
            ) : project.homepage ? (
              <Globe className="h-3 w-3" />
            ) : null}
            {project.homepage
              ? "Live"
              : project.github
              ? "Open source"
              : "Project"}
            {project.stars ? (
              <span>· {project.stars.toLocaleString()} ★</span>
            ) : null}
          </div>

          <h3
            className={[
              "font-display font-bold tracking-tight text-[var(--text-primary)] transition-all duration-300 group-hover:translate-x-0.5",
              isFeatured ? "text-xl sm:text-2xl" : "text-base sm:text-lg",
            ].join(" ")}
          >
            <span className="relative inline-block">
              {project.name}
              <span className="absolute left-0 bottom-0.5 h-0.5 w-0 bg-[var(--text-primary)] transition-all duration-300 group-hover:w-full" />
            </span>
          </h3>

          {project.description && (
            <p
              className={[
                "mt-2 leading-relaxed text-[var(--text-secondary)] font-medium",
                isFeatured
                  ? "text-xs sm:text-sm"
                  : "text-xs line-clamp-3",
              ].join(" ")}
            >
              {project.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest"
                style={{
                  borderColor: "var(--card-border)",
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                }}
              >
                {tag}
              </span>
            ))}
            <span className="ml-auto opacity-40 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowUpRight className="h-4 w-4 text-[var(--text-secondary)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>

        {/* Media Preview Side (featured only) */}
        {isFeatured && (
          <div
            className="relative mt-4 sm:mt-0 aspect-video sm:aspect-square md:aspect-video rounded-xl overflow-hidden border shrink-0"
            style={{ borderColor: "var(--card-border)" }}
          >
            {imageSrc ? (
              <>
                <img
                  src={imageSrc}
                  alt={project.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/10 dark:to-black/20" />
              </>
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                  <ImageOff className="h-6 w-6" />
                  <span className="font-mono text-[9px] uppercase tracking-widest">
                    No preview
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </a>
    </motion.article>
  );
}
