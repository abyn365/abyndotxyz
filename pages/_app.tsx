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
import Grainient from "../components/Grainient";

import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/sen/400.css";
import "@fontsource/sen/700.css";
import "../styles/globals.css";
import "../components/ClickSpark/ClickSpark";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    const el = document.createElement("click-spark");
    document.body.appendChild(el);
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
        twitter={{ cardType: "summary_large_image", handle: "@abyn_1" }}
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
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('js',new Date());
        gtag('config','${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}',{page_path:window.location.pathname});
      `}</Script>
      <Analytics />

      <div className="relative min-h-screen overflow-hidden font-sans">
        <div className="pointer-events-none fixed inset-0 z-0">
          <Grainient className="site-grainient" />
        </div>
        <div className="pointer-events-none fixed inset-0 z-0 bg-[var(--background-scrim)]" />
        <div className="relative z-10">
          <Navbar />

          {/* Page transitions */}
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

          {/* Global keyboard shortcut handler */}
          <KeyboardShortcuts />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default MyApp;
