/**
 * POST/PUT/DELETE /api/friends — 友链 CRUD
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, url, avatar, description, sortOrder } = await request.json();
    if (!name || !url) {
      return new Response(JSON.stringify({ error: '名称和链接不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const friend = await prisma.friend.create({
      data: { name, url, avatar: avatar || null, description: description || null, sortOrder: sortOrder || 0 },
    });
    return new Response(JSON.stringify(friend), {
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
    const { name, url: friendUrl, avatar, description, sortOrder } = await request.json();
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (friendUrl !== undefined) data.url = friendUrl;
    if (avatar !== undefined) data.avatar = avatar || null;
    if (description !== undefined) data.description = description || null;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    const friend = await prisma.friend.update({ where: { id }, data });
    return new Response(JSON.stringify(friend), {
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
  await prisma.friend.delete({ where: { id } });
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
