/**
 * GET /rss.xml
 *
 * RSS 订阅源。读者可以通过 RSS 阅读器订阅博客更新。
 * 返回 XML 格式。
 */
import type { APIRoute } from 'astro';
import { prisma } from '../lib/prisma';
import { renderMarkdown } from '../lib/markdown';

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.SITE_URL || 'http://localhost:4321';
  const siteName = (await prisma.siteConfig.findUnique({ where: { key: 'siteName' } }))?.value || 'My Blog';
  const siteDesc = (await prisma.siteConfig.findUnique({ where: { key: 'siteDescription' } }))?.value || '';

  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  const items = posts
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/posts/${post.id}/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/posts/${post.id}/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <content:encoded><![CDATA[${renderMarkdown(post.content)}]]></content:encoded>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>${siteDesc}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
