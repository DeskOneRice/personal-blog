/**
 * POST /api/categories — 创建分类
 * PUT  /api/categories?id=X — 更新分类
 * DELETE /api/categories?id=X — 删除分类
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';
import { slugify } from '../../lib/utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, description } = await request.json();
    if (!name) {
      return new Response(JSON.stringify({ error: '分类名不能为空' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    const slug = slugify(name);
    const category = await prisma.category.create({
      data: { name, slug, description: description || null },
    });
    return new Response(JSON.stringify(category), {
      status: 201, headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '创建失败，分类名可能已存在' }), {
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
    const { name, description } = await request.json();
    const data: Record<string, unknown> = {};
    if (name) { data.name = name; data.slug = slugify(name); }
    if (description !== undefined) data.description = description || null;
    const category = await prisma.category.update({ where: { id }, data });
    return new Response(JSON.stringify(category), {
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
    await prisma.category.delete({ where: { id } });
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '删除失败，分类可能被文章引用' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
