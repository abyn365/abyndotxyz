import { GetServerSideProps } from "next";
import { getPosts } from "../lib/blog";
import { parseMarkdown } from "../lib/markdown";

export default function FeedXml() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await getPosts();
  const publishedPosts = posts.filter((p) => p.published);

  // Generate XML items with content:encoded containing parsed html body
  const feedItems = publishedPosts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://abyn.xyz/blog/${post.slug}</link>
      <guid>https://abyn.xyz/blog/${post.slug}</guid>
      <description><![CDATA[${post.description || ""}]]></description>
      <content:encoded><![CDATA[${parseMarkdown(post.content || "")}]]></content:encoded>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      ${
        post.tags && post.tags.length > 0
          ? post.tags.map((t) => `<category><![CDATA[${t}]]></category>`).join("")
          : ""
      }
    </item>`
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<?xml-stylesheet href="/rss.xsl" type="text/xsl"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>abyn · Blog</title>
    <link>https://abyn.xyz</link>
    <description>Thoughts, articles, and guides on programming, web development, and design.</description>
    <atom:link href="https://abyn.xyz/feed.xml" rel="self" type="application/rss+xml" />
    ${feedItems}
  </channel>
</rss>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();

  return {
    props: {},
  };
};
