/**
 * GET    /api/announcements — 获取所有公告
 * POST   /api/announcements — 创建公告
 * PUT    /api/announcements?id=X — 更新公告
 * DELETE /api/announcements?id=X — 删除公告
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

export const GET: APIRoute = async () => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return new Response(JSON.stringify(announcements), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { content, published } = await request.json();
    if (!content) {
      return new Response(JSON.stringify({ error: '内容不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const announcement = await prisma.announcement.create({
      data: { content, published: published ?? false },
    });
    return new Response(JSON.stringify(announcement), {
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
    const { content, published } = await request.json();
    const data: Record<string, unknown> = {};
    if (content !== undefined) data.content = content;
    if (published !== undefined) data.published = published;
    const announcement = await prisma.announcement.update({ where: { id }, data });
    return new Response(JSON.stringify(announcement), {
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
  await prisma.announcement.delete({ where: { id } });
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
