import type { AppProps } from "next/app";
import { useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';

import "../styles/globals.css";

import { NextSeo } from "next-seo";
import Head from "next/head";
import Script from "next/script";

import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/sen/400.css";
import "@fontsource/sen/700.css";

function MyApp({ Component, pageProps }: AppProps) {
  // Umami Analytics
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://cloud.umami.is/script.js";
    script.dataset.websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID; // Mengambil nilai dari variabel lingkungan
    document.head.appendChild(script);
  }, []);

  return (
    <>
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
        title="abyn | biolink"
        titleTemplate="abyn | biolink"
        defaultTitle="abyn  | biolink"
        description="Hey! I'm abyn, I love playing video games, watching anime, and listening to music, thanks for visiting!"
        openGraph={{
          url: "https://abyn.xyz",
          title: "abyn | biolink",
          description:
            "Hey! I'm abyn, I love playing video games, watching anime, and listening to music, thanks for visiting!",
          images: [
            {
              url: "https://abyn.xyz/public/banner.gif",
              alt: "abyn | biolink",
            },
          ],
        }}
      />

      <Head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
