import { GetServerSideProps } from "next";

export default function RssXslPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const xsl = `<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="//channel/title"/> &#183; Feed</title>
        <link rel="stylesheet" href="/rss.css"/>
      </head>
      <body>
        <div class="container">
          <header>
            <h1><xsl:value-of select="//channel/title"/></h1>
            <p class="feed-desc"><xsl:value-of select="//channel/description"/></p>
            <div class="info-box">
              <span>This is an RSS feed. Subscribing to this URL allows your news reader application to automatically monitor and aggregate articles from this blog.</span>
              <span>
                <a>
                  <xsl:attribute name="href">
                    <xsl:value-of select="//channel/link"/>
                  </xsl:attribute>
                  &#8592; Back to portfolio website
                </a>
              </span>
            </div>
          </header>

          <main>
            <xsl:for-each select="//item">
              <article class="item-card">
                <h2 class="item-title">
                  <a>
                    <xsl:attribute name="href">
                      <xsl:value-of select="link"/>
                    </xsl:attribute>
                    <xsl:value-of select="title"/>
                  </a>
                </h2>
                <div class="item-meta">
                  <time><xsl:value-of select="pubDate"/></time>
                  <xsl:for-each select="category">
                    <span class="tag"><xsl:value-of select="."/></span>
                  </xsl:for-each>
                </div>
                <div class="item-content">
                  <xsl:value-of select="description"/>
                </div>
              </article>
            </xsl:for-each>
          </main>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

  res.setHeader("Content-Type", "text/xsl; charset=utf-8");
  res.write(xsl);
  res.end();

  return {
    props: {},
  };
};
