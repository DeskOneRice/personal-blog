/**
 * PUT /api/site-config — 批量更新站点配置
 *
 * Body: [{ key: 'aboutName', value: '张三' }, ...]
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const updates: { key: string; value: string }[] = await request.json();

    for (const { key, value } of updates) {
      await prisma.siteConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: '更新失败' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
