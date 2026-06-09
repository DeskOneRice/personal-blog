/**
 * POST/PUT/DELETE /api/tags — 标签 CRUD
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';
import { slugify } from '../../lib/utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: '标签名不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const slug = slugify(name);
    const tag = await prisma.tag.create({ data: { name, slug } });
    return new Response(JSON.stringify(tag), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '创建失败，标签名可能已存在' }), {
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
    const { name } = await request.json();
    const tag = await prisma.tag.update({
      where: { id },
      data: { name, slug: slugify(name) },
    });
    return new Response(JSON.stringify(tag), {
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
  try {
    await prisma.tag.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '删除失败，标签可能被文章引用' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
