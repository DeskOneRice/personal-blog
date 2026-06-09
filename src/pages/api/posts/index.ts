/**
 * GET  /api/posts — 获取文章列表（管理后台用，含草稿）
 * POST /api/posts — 创建新文章
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const page = Math.max(1, parseInt(params.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(params.get('limit') || '20')));

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { name: true, slug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count(),
  ]);

  return new Response(JSON.stringify({ posts, total, page, totalPages: Math.ceil(total / limit) }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, content, excerpt, coverImage, published, categoryId, tagIds } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: '标题和内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }


    const post = await prisma.post.create({
      data: {
        title,
        content,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        published: published ?? false,
        categoryId: categoryId || null,
        tags: tagIds && tagIds.length > 0
          ? { create: tagIds.map((tagId: number) => ({ tagId })) }
          : undefined,
      },
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { name: true, slug: true } } } },
      },
    });

    return new Response(JSON.stringify(post), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '创建失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
