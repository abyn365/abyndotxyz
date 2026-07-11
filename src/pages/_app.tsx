import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Analytics } from "@vercel/analytics/react";
import { NextSeo } from "next-seo";
import Head from "next/head";
import Script from "next/script";
import { AnimatePresence, motion } from "framer-motion";
import { Jost, Sen } from "next/font/google";

import { ThemeProvider } from "../components/ThemeProvider";
import Navbar from "../components/Navbar";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import BackgroundWrapper from "../components/BackgroundWrapper";
import BackgroundSelector from "../components/BackgroundSelector";
import { MusicPlayerProvider } from "../components/music/MusicPlayerContext";
import MusicPlayerBar from "../components/music/MusicPlayerBar";
import MusicLyricsPanel from "../components/music/MusicLyricsPanel";
import MusicQueuePanel from "../components/music/MusicQueuePanel";
import FirstLoadOverlay from "../components/FirstLoadOverlay";
import ClickSound from "../components/ClickSound";
import CommandPalette from "../components/CommandPalette";

import "../styles/globals.css";
import "../components/ClickSpark/ClickSpark";

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const sen = Sen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

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
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setRouteLoading(true);
    const handleComplete = () => setRouteLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  useEffect(() => {
    const el = document.createElement("click-spark");
    document.body.appendChild(el);

    if (!window.__consoleMessageShown) {
      window.__consoleMessageShown = true;
      setTimeout(() => {
        console.log(
          "%c> hello, explorer.\n%cYou weren't supposed to find anything interesting here :p\n%cIf you discovered a bug, have feedback, or want to collaborate,\n%cmy inbox is always open → abyn@abyn.xyz",
          "color: #60a5fa; font-size: 18px; font-weight: bold; font-family: monospace;",
          "color: #9ca3af; font-size: 13px; font-family: monospace;",
          "color: #e5e7eb; font-size: 13px; font-family: monospace;",
          "color: #22c55e; font-size: 13px; font-weight: 600; font-family: monospace;"
        );
      }, 200);
    }

    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return (
    <ThemeProvider>
      <MusicPlayerProvider>
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

      <Script
        id="has-entered"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            if (sessionStorage.getItem('has_entered') === 'true') {
              document.documentElement.classList.add('has-entered');
            }
          `,
        }}
      />

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

      <div className={`${jost.variable} ${sen.variable} min-h-screen font-sans`}>
        {routeLoading && (
          <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-neutral-400 dark:bg-neutral-500 origin-left" style={{ width: "100%" }} />
        )}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <BackgroundWrapper />
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
        </div>
      </div>

      <FirstLoadOverlay />

      {/* Global music player — persists across all pages */}
      <MusicPlayerBar />
      <MusicLyricsPanel />
      <MusicQueuePanel />
      <CommandPalette />
      <KeyboardShortcuts />
      <BackgroundSelector />
      <ClickSound />
    </MusicPlayerProvider>
    </ThemeProvider>
  );
}

export default MyApp;
