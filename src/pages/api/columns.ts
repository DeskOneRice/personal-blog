/**
 * GET    /api/columns — 所有专栏
 * POST   /api/columns — 创建专栏
 * PUT    /api/columns?id=X — 更新
 * DELETE /api/columns?id=X — 删除
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';
import { slugify } from '../../lib/utils';

export const GET: APIRoute = async () => {
  const columns = await prisma.column.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return new Response(JSON.stringify(columns), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, description, coverImage } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: '专栏名不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const column = await prisma.column.create({
      data: { name, slug: slugify(name), description, coverImage },
    });
    return new Response(JSON.stringify(column), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '创建失败' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, url }) => {
  try {
    const id = parseInt(url.searchParams.get('id') || '');
    if (isNaN(id)) {
      return new Response(JSON.stringify({ error: '无效的 ID' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const { name, description, coverImage, postIds } = await request.json();
    const data: Record<string, unknown> = {};
    if (name) { data.name = name; data.slug = slugify(name); }
    if (description !== undefined) data.description = description || null;
    if (coverImage !== undefined) data.coverImage = coverImage || null;

    // 更新文章列表和排序
    if (postIds && Array.isArray(postIds)) {
      await prisma.columnPost.deleteMany({ where: { columnId: id } });
      if (postIds.length > 0) {
        await prisma.columnPost.createMany({
          data: postIds.map((pid: number, i: number) => ({
            columnId: id, postId: pid, sortOrder: i,
          })),
        });
      }
    }

    const column = await prisma.column.update({ where: { id }, data });
    return new Response(JSON.stringify(column), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '更新失败' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const id = parseInt(url.searchParams.get('id') || '');
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: '无效的 ID' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  await prisma.column.delete({ where: { id } });
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
