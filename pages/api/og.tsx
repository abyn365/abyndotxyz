// This route runs on Vercel's Edge Runtime.
// @vercel/og requires edge — it cannot be required in standard Node.js.
import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const config = { runtime: "edge" };

export default function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "abyn";
  const sub   = searchParams.get("sub")   ?? "student developer · indonesia";

  return new ImageResponse(
    (
      <div
        style={{
          width:           "100%",
          height:          "100%",
          background:      "#0a0a0f",
          display:         "flex",
          flexDirection:   "column",
          justifyContent:  "space-between",
          padding:         "72px 80px",
          fontFamily:      "sans-serif",
          position:        "relative",
          overflow:        "hidden",
        }}
      >
        {/* Subtle dot grid overlay */}
        <div
          style={{
            position:        "absolute",
            inset:           0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize:  "28px 28px",
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position:     "absolute",
            top:          -120,
            right:        -80,
            width:        480,
            height:       480,
            borderRadius: "50%",
            background:   "radial-gradient(circle, rgba(56,189,248,0.12), transparent 70%)",
          }}
        />

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
          <div style={{ fontSize: 14, color: "#888899", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            abyn.xyz
          </div>
          <div style={{ fontSize: 88, fontWeight: 700, color: "#ededf0", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#888899", marginTop: 8 }}>
            {sub}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            position:       "relative",
          }}
        >
          <div
            style={{
              fontSize:    14,
              color:       "#38bdf8",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            abyn.xyz
          </div>
          <div style={{ fontSize: 13, color: "#888899" }}>
            student developer
          </div>
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    }
  );
}
