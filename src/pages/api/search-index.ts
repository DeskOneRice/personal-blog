/**
 * GET /api/search-index
 *
 * 返回所有已发布文章的 JSON 数组，供前端 Fuse.js 搜索使用。
 * 不返回文章正文，只返回搜索需要的字段，减少网络传输。
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';
import { formatDate, extractExcerpt } from '../../lib/utils';

export const GET: APIRoute = async () => {
  const posts = await prisma.post.findMany({
    where: { published: true },
    include: {
      category: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const results = posts.map((post) => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt || extractExcerpt(post.content, 200),
    category: post.category?.name || '',
    date: formatDate(post.createdAt),
  }));

  return new Response(JSON.stringify(results), {
    headers: {
      'Content-Type': 'application/json',
      // 浏览器缓存 5 分钟
      'Cache-Control': 'public, max-age=300',
    },
  });
};
