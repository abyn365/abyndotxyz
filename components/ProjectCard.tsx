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
          "block overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-0.5",
          isFeatured ? "sm:grid sm:grid-cols-[1.1fr_0.9fr]" : "",
        ].join(" ")}
        style={{
          borderColor: "var(--card-border)",
          background: "var(--card-bg)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {/* Content side */}
        <div
          className={
            isFeatured ? "flex flex-col justify-between p-6 sm:p-7" : "p-5"
          }
        >
          <div>
            {/* Meta row */}
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-[var(--text-secondary)]">
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
                "font-display font-bold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent)]",
                isFeatured ? "text-2xl sm:text-3xl" : "text-lg",
              ].join(" ")}
            >
              {project.name}
            </h3>

            {project.description && (
              <p
                className={[
                  "mt-2 leading-relaxed text-[var(--text-secondary)]",
                  isFeatured
                    ? "text-sm sm:text-base"
                    : "mt-2 line-clamp-3 text-sm",
                ].join(" ")}
              >
                {project.description}
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                style={{
                  borderColor: "var(--card-border)",
                  color: "var(--text-secondary)",
                  background: "var(--bg-secondary)",
                }}
              >
                {tag}
              </span>
            ))}
            <span className="ml-auto">
              <ArrowUpRight className="h-4 w-4 text-[var(--text-secondary)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>

        {/* Image side (featured only) */}
        {isFeatured && (
          <div
            className="relative min-h-56 border-t sm:min-h-full sm:border-l sm:border-t-0"
            style={{ borderColor: "var(--card-border)" }}
          >
            {imageSrc ? (
              <>
                <img
                  src={imageSrc}
                  alt={project.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/20 dark:to-black/40" />
              </>
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)]">
                  <ImageOff className="h-6 w-6" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
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
