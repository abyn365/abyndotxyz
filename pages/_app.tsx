import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Analytics } from "@vercel/analytics/react";
import { NextSeo } from "next-seo";
import Head from "next/head";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";

import { ThemeProvider } from "../components/ThemeProvider";
import Navbar from "../components/Navbar";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import Squares from "../components/Squares";

import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/sen/400.css";
import "@fontsource/sen/700.css";
import "../styles/globals.css";
import "../components/ClickSpark/ClickSpark";

declare global {
  interface Console {
    load: (url?: string, size?: number) => Promise<void>;
  }

  interface Window {
    __consoleMessageShown?: boolean;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const el = document.createElement("click-spark");
    document.body.appendChild(el);

    if (!window.__consoleMessageShown) {
      window.__consoleMessageShown = true;

      // Safe binary converter to bypass network security blocks on console assets
      const convertToBase64 = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };

      // FIXED: Defined console.load to match your chaining template layout perfectly
      console.load = (url?: string, size = 88) => {
        const target = url || "https://cloud.abyn.xyz/file/test/1782454424220_bc47713a5d54a6a9f506adbebe661273.jpg";
        return convertToBase64(target).then((base64) => {
          if (base64) {
            console.log(
              "%c ",
              `
                font-size: 1px;
                padding: ${size / 2}px;
                background: url(${base64}) center/cover no-repeat;
                border-radius: 0px;
              `
            );
          }
        });
      };

      const bannerUrl = "https://cloud.abyn.xyz/file/img/1783016431295_light1of4your3life_pindown.io_1783016178.gif";

      // EXECUTION: Chains exactly like your example snippet to keep execution output unified
      console
        .load("https://cloud.abyn.xyz/file/test/1782454424220_bc47713a5d54a6a9f506adbebe661273.jpg", 88)
        .then(() => {
          console.log(
            "%c> hello, explorer.",
            "color:#60a5fa;font-size:18px;font-weight:bold;"
          );

          console.log(
            "%cYou weren't supposed to find anything interesting here :p",
            "color:#9ca3af;font-size:13px;"
          );

          console.log(
            "%cIf you discovered a bug, have feedback, or want to collaborate,",
            "color:#e5e7eb;font-size:13px;"
          );

          console.log(
            "%cmy inbox is always open → abyn@abyn.xyz",
            "color:#22c55e;font-size:13px;font-weight:600;"
          );

          // Loads the background banner asset seamlessly right underneath the text logs
          convertToBase64(bannerUrl).then((bannerBase64) => {
            if (bannerBase64) {
              console.log(
                "%c ",
                `
                  font-size: 1px;
                  /* FIXED: Scaled padding dimensions down to make the footer banner look crisp and subtle */
                  padding: 55px 125px; 
                  margin-top: 14px;
                  background: url(${bannerBase64}) center/cover no-repeat;
                  border-radius: 8px;
                `
              );
            }
          });
        });
    }

    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return (
    <ThemeProvider>
      <Head>
        <meta property="og:title" content="Abyan — student developer" />
        <meta
          property="og:description"
          content="Building things from Indonesia."
        />
        <meta property="og:image" content="https://abyn.xyz/api/og" />
        <meta property="og:url" content="https://abyn.xyz" />
        <meta property="og:type" content="website" />
      </Head>

      <NextSeo
        title="abyn — student developer"
        description="Abyan (/uh-bee-an/) — student developer from Indonesia building small, thoughtful things for the web."
        canonical="https://abyn.xyz"
        openGraph={{
          type: "website",
          locale: "en_US",
          url: "https://abyn.xyz",
          siteName: "abyn.xyz",
          title: "abyn — student developer",
          description: "Building small, thoughtful things for the web.",
          images: [
            {
              url: "https://abyn.xyz/api/og",
              width: 1200,
              height: 630,
              alt: "abyn.xyz",
              type: "image/png",
            },
          ],
        }}
        twitter={{
          cardType: "summary_large_image",
          handle: "@abyn_1",
        }}
        additionalMetaTags={[
          { name: "author", content: "Abyan" },
          { name: "theme-color", content: "#0a0a0f" },
        ]}
      />

      {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
        process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && (
          <Script
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}

      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
      />

      <Script id="ga" strategy="lazyOnload">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
          page_path: window.location.pathname
        });
      `}</Script>

      <Analytics />

      <div className="min-h-screen font-sans">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Squares direction="diagonal" speed={0.05} squareSize={32} />
        </div>

        <div className="relative z-10">
          <Navbar />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={router.pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>

          <KeyboardShortcuts />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default MyApp;
