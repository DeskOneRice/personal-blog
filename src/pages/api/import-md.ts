/**
 * POST /api/import-md — 上传 MD 文件导入文章
 *
 * 接收 multipart/form-data，最多同时上传 10 个 .md 文件。
 * 解析 YAML frontmatter + Markdown 正文，写入数据库。
 */
import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

// 简易 frontmatter 解析（同 import-md.ts）
function parseFrontmatter(md: string): { meta: Record<string, string | string[] | boolean>; content: string } {
  const meta: Record<string, string | string[] | boolean> = {};
  let content = md;

  if (md.startsWith('---')) {
    const end = md.indexOf('---', 3);
    if (end !== -1) {
      const head = md.substring(3, end);
      for (const line of head.split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const key = line.substring(0, idx).trim();
        let value = line.substring(idx + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (key === 'tags') {
          meta.tags = value.replace(/^\[|\]$/g, '').split(',').map(t => t.trim().replace(/["']/g, '')).filter(Boolean);
        } else if (key === 'published') {
          meta.published = value === 'true';
        } else {
          meta[key] = value;
        }
      }
      content = md.substring(end + 3).trim();
    }
  }

  return { meta, content };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return new Response(JSON.stringify({ error: '未选择文件' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const results: { file: string; status: string; message: string }[] = [];

    for (const file of files) {
      if (!file.name.endsWith('.md')) {
        results.push({ file: file.name, status: 'skip', message: '非 .md 文件' });
        continue;
      }

      const raw = await file.text();
      const { meta, content } = parseFrontmatter(raw);
      const title = (meta.title as string) || file.name.replace(/\.md$/, '');

      if (!content.trim()) {
        results.push({ file: file.name, status: 'skip', message: '正文为空' });
        continue;
      }

      // 标题去重
      const existing = await prisma.post.findFirst({ where: { title } });
      if (existing) {
        results.push({ file: file.name, status: 'skip', message: `标题 "${title}" 已存在` });
        continue;
      }

      // 查找分类
      let categoryId: number | null = null;
      if (meta.category) {
        const cat = await prisma.category.findFirst({ where: { name: meta.category as string } });
        if (!cat) {
          results.push({ file: file.name, status: 'skip', message: `分类 "${meta.category}" 不存在` });
          continue;
        }
        categoryId = cat.id;
      }

      // 查找标签
      const tagRecords = [];
      const tags = meta.tags as string[] | undefined;
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tag = await prisma.tag.findFirst({ where: { name: tagName } });
          if (tag) tagRecords.push(tag);
        }
      }

      // 创建文章
      await prisma.post.create({
        data: {
          title,
          content,
          excerpt: (meta.excerpt as string) || null,
          coverImage: (meta.coverImage as string) || null,
          published: (meta.published as boolean) ?? false,
          categoryId,
          tags: tagRecords.length > 0
            ? { create: tagRecords.map(t => ({ tagId: t.id })) }
            : undefined,
        },
      });

      results.push({ file: file.name, status: 'ok', message: `→ "${title}"` });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: '导入失败' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
