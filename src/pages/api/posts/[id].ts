/**
 * GET    /api/posts/[id] — 获取单篇文章
 * PUT    /api/posts/[id] — 更新文章
 * DELETE /api/posts/[id] — 删除文章
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../../lib/prisma';

export const GET: APIRoute = async ({ params }) => {
  const id = parseInt(params.id!);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: '无效的 ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  });

  if (!post) {
    return new Response(JSON.stringify({ error: '文章不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(post), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的 ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { title, content, excerpt, coverImage, published, categoryId, tagIds } = body;

    // 检查文章存在
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) {
      return new Response(JSON.stringify({ error: '文章不存在' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 先清除旧的标签关联，再创建新的
    if (tagIds !== undefined) {
      await prisma.postTag.deleteMany({ where: { postId: id } });
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        content: content ?? existing.content,
        excerpt: excerpt !== undefined ? (excerpt || null) : existing.excerpt,
        coverImage: coverImage !== undefined ? (coverImage || null) : existing.coverImage,
        published: published ?? existing.published,
        categoryId: categoryId !== undefined ? (categoryId || null) : existing.categoryId,
        tags: tagIds && tagIds.length > 0
          ? { create: tagIds.map((tagId: number) => ({ tagId })) }
          : undefined,
      },
      include: {
        category: { select: { name: true, slug: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    });

    return new Response(JSON.stringify(post), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: '更新失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const id = parseInt(params.id!);
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: '无效的 ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    return new Response(JSON.stringify({ error: '文章不存在' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await prisma.post.delete({ where: { id } });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
