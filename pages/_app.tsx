import type { AppProps } from "next/app";
import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { NextSeo } from "next-seo";
import Head from "next/head";
import Script from "next/script";
import { ThemeProvider } from "../components/ThemeProvider";
import ThemeToggle from "../components/ThemeToggle";
import Navbar from "../components/Navbar";

import "../styles/globals.css";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "../components/ClickSpark/ClickSpark";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const clickSpark = document.createElement("click-spark");
    document.body.appendChild(clickSpark);

    return () => {
      document.body.removeChild(clickSpark);
    };
  }, []);

  return (
    <ThemeProvider>
      <>
        {/* Umami Analytics */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
          process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && (
            <Script
              src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
              data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
              strategy="afterInteractive"
            />
          )}

        {/* Google Analytics */}
        <Script
          strategy="lazyOnload"
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}`}
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>

        <Analytics />

        <NextSeo
          title="Abyan - Software Developer & Builder"
          description="Abyan (/uh-bee-an/) - student and software developer building web projects, tools, and experiments. Portfolio, projects, and contact links."
          canonical="https://abyn.xyz"
          openGraph={{
            type: "website",
            locale: "en_US",
            url: "https://abyn.xyz",
            siteName: "abyn.xyz - Portfolio & Projects",
            title: "Abyan - Software Developer & Builder",
            description: "Abyan (/uh-bee-an/) - student and software developer building web projects, tools, and experiments.",
            images: [
              {
                url: "https://abyn.xyz/banner.png",
                width: 1200,
                height: 630,
                alt: "Abyan - software developer",
                type: "image/png",
              },
            ],
          }}
          twitter={{
            cardType: "summary_large_image",
            handle: "@abyn_1",
            site: "@abyn_1",
          }}
          additionalMetaTags={[
            {
              name: "keywords",
              content:
                "Abyan, software developer, portfolio, projects, web developer, builder",
            },
            {
              name: "author",
              content: "Abyan",
            },
            {
              name: "theme-color",
              content: "#000000",
            },
          ]}
        />

        <Head>
          <meta property="og:title" content="Abyan - Software Developer & Builder" />
          <meta property="og:description" content="Abyan (/uh-bee-an/) - student and software developer building web projects, tools, and experiments." />
          <meta property="og:image" content="https://abyn.xyz/banner.png" />
          <meta property="og:url" content="https://abyn.xyz" />
          <meta property="og:type" content="website" />
        </Head>

        <Navbar />
        <Component {...pageProps} />
        <ThemeToggle />
      </>
    </ThemeProvider>
  );
}

export default MyApp;
