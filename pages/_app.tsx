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

      // FIXED: Converts raw files into lightweight Object Blobs to keep the console buffer tiny and un-glitched
      const convertToBlobUrl = async (url: string): Promise<string | null> => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          const blob = await res.blob();
          return URL.createObjectURL(blob);
        } catch {
          return null;
        }
      };

      const pfpUrl = "https://cloud.abyn.xyz/file/test/1782454424220_bc47713a5d54a6a9f506adbebe661273.jpg";
      const bannerUrl = "https://cloud.abyn.xyz/file/img/1783016431295_light1of4your3life_pindown.io_1783016178.gif";

      // Preload both assets into memory BEFORE printing so everything renders instantly together
      Promise.all([convertToBlobUrl(pfpUrl), convertToBlobUrl(bannerUrl)]).then(([pfpBlob, bannerBlob]) => {
        
        // FIXED: Chaining implementation matches your exact template structure
        console.load = (url?: string, size = 88) => {
          return new Promise<void>((resolve) => {
            // Use preloaded binary blob pointer instantly if available
            const activeBlob = url === pfpUrl || !url ? pfpBlob : null;

            if (activeBlob) {
              console.log(
                "%c ",
                `
                  font-size: 1px;
                  padding: ${size / 2}px;
                  background: url(${activeBlob}) center/cover no-repeat;
                  border-radius: 0px;
                  display: inline-block;
                `
              );
              resolve();
            } else {
              // Safe fallback runtime handler
              convertToBlobUrl(url || pfpUrl).then((fetchedBlob) => {
                if (fetchedBlob) {
                  console.log(
                    "%c ",
                    `
                      font-size: 1px;
                      padding: ${size / 2}px;
                      background: url(${fetchedBlob}) center/cover no-repeat;
                      border-radius: 0px;
                      display: inline-block;
                    `
                  );
                }
                resolve();
              });
            }
          });
        };

        // EXECUTION: Triggers your sequential chaining style perfectly without duplicates
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

            if (bannerBlob) {
              console.log(
                "%c ",
                `
                  font-size: 1px;
                  /* FIXED: Adjusted sizes to make the footer banner look crisp and compact */
                  padding: 55px 125px; 
                  margin-top: 14px;
                  background: url(${bannerBlob}) center/cover no-repeat;
                  border-radius: 8px;
                  display: inline-block;
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
