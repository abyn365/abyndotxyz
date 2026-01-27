import type { AppProps } from "next/app";
import { useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { NextSeo } from "next-seo";
import Head from "next/head";
import Script from "next/script";

import "../styles/globals.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/sen/400.css";
import "@fontsource/sen/700.css";
import "../components/ClickSpark/ClickSpark";

function MyApp({ Component, pageProps }: AppProps) {
  // Umami Analytics
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cloud.umami.is/script.js";
    script.dataset.websiteId =
      process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || "";
    document.head.appendChild(script);
  }, []);

  // Click Spark
  useEffect(() => {
    const clickSpark = document.createElement("click-spark");
    document.body.appendChild(clickSpark);

    return () => {
      document.body.removeChild(clickSpark);
    };
  }, []);

  return (
    <>
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

      {/* ================= SEO & OPEN GRAPH ================= */}
      <NextSeo
        title="abyn | biolink"
        description="Aspiring Software & Cloud Developer. Tech & Science Enthusiast."
        canonical="https://abyn.xyz"
        openGraph={{
          type: "website",
          locale: "en_US",
          url: "https://abyn.xyz",
          siteName: "abyn | biolink",
          title: "abyn | biolink",
          description:
            "Aspiring Software & Cloud Developer. Tech & Science Enthusiast.",
          images: [
            {
              url: "https://abyn.xyz/banner.gif",
              width: 1200,
              height: 630,
              alt: "abyn | biolink",
              type: "image/gif",
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
              "abyn, biolink, software developer, cloud developer, portfolio, web developer, programming, coding",
          },
          {
            name: "author",
            content: "abyn",
          },
          {
            name: "theme-color",
            content: "#000000",
          },
        ]}
      />

      {/* ======= HARD FALLBACK (IMPORTANT FOR WHATSAPP) ======= */}
      <Head>
        <link rel="icon" type="image/png" href="/favicon.png" />

        <meta property="og:title" content="abyn | biolink" />
        <meta
          property="og:description"
          content="Aspiring Software & Cloud Developer. Tech & Science Enthusiast."
        />
        <meta property="og:image" content="https://abyn.xyz/banner.gif" />
        <meta property="og:url" content="https://abyn.xyz" />
        <meta property="og:type" content="website" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
