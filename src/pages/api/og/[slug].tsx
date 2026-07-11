import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const config = { runtime: "edge" };

export default async function handler(req: NextRequest) {
  const url = new URL(req.url);
  
  // Extract slug from path (e.g., /api/og/hello -> hello)
  const pathname = url.pathname;
  const slug = pathname.split("/").pop() || "";

  let title = "abyn";
  let sub = "student developer · indonesia";
  let coverImage = "";

  if (slug && slug !== "og" && slug !== "index") {
    try {
      const host = req.headers.get("host") || "localhost:3000";
      const protocol = host.includes("localhost") ? "http" : "https";
      
      const apiRes = await fetch(`${protocol}://${host}/api/blog/${slug}`);
      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data.success && data.post) {
          title = data.post.title;
          sub = data.post.description || "";
          coverImage = data.post.coverImage || "";
        }
      }
    } catch (err) {
      console.error("Failed to load post data for dynamic OG image:", err);
    }
  }

  // Resolve cover image to absolute URL
  let resolvedCoverUrl = "";
  if (coverImage) {
    resolvedCoverUrl = coverImage.startsWith("http")
      ? coverImage
      : `https://${req.headers.get("host") || "abyn.xyz"}${coverImage}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0f",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle dot grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            zIndex: 1,
          }}
        />

        {/* Accent glow top-right */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%)",
            zIndex: 1,
          }}
        />

        {/* Dynamic Split Screen Layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: "100%",
            justifyContent: "space-between",
            alignItems: "stretch",
            zIndex: 2,
            gap: 48,
          }}
        >
          {/* Left Column: Metadata Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: resolvedCoverUrl ? 6 : 10,
              height: "100%",
            }}
          >
            {/* Top brand */}
            <div
              style={{
                fontSize: 14,
                color: "#888899",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              abyn.xyz · blog
            </div>

            {/* Middle Title & Description */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div
                style={{
                  fontSize: title.length > 30 ? 64 : 76,
                  fontWeight: 800,
                  color: "#ededf0",
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: "#a1a1aa",
                  lineHeight: 1.4,
                  marginTop: 8,
                }}
              >
                {sub}
              </div>
            </div>

            {/* Bottom brand signature */}
            <div
              style={{
                fontSize: 14,
                color: "#38bdf8",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              abyn.xyz
            </div>
          </div>

          {/* Right Column: Cover Image (Only rendered if present) */}
          {resolvedCoverUrl && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                flex: 4,
                height: "100%",
              }}
            >
              <img
                src={resolvedCoverUrl}
                alt="Blog post cover"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.5)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
