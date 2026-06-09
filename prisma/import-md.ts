/**
 * MD 文件导入脚本
 *
 * 扫描 posts/ 目录下的 .md 文件，解析 frontmatter 元信息 + Markdown 正文，
 * 自动写入数据库。slug 默认取文件名。
 *
 * 用法: npm run import:md
 *
 * .md 文件格式:
 *   ---
 *   title: 文章标题
 *   category: 技术
 *   tags: [JavaScript, React]
 *   published: true
 *   coverImage: https://...
 *   excerpt: 摘要
 *   ---
 *   正文内容...
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const prisma = new PrismaClient();

interface Frontmatter {
  title?: string;
  category?: string;
  tags?: string[];
  published?: boolean;
  coverImage?: string;
  excerpt?: string;
  slug?: string;
}

// 简易 YAML frontmatter 解析（不用装额外依赖）
function parseFrontmatter(md: string): { meta: Frontmatter; content: string } {
  const meta: Frontmatter = {};
  let content = md;

  if (md.startsWith('---')) {
    const end = md.indexOf('---', 3);
    if (end !== -1) {
      const head = md.substring(3, end);

      // 按行解析 key: value
      for (const line of head.split('\n')) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;

        const key = line.substring(0, colonIdx).trim();
        let value = line.substring(colonIdx + 1).trim();

        // 去掉引号
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        if (key === 'tags') {
          // 支持 [a, b, c] 格式
          meta.tags = value
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map(t => t.trim().replace(/["']/g, ''))
            .filter(Boolean);
        } else if (key === 'published') {
          meta.published = value === 'true';
        } else if (key === 'title') {
          meta.title = value;
        } else if (key === 'category') {
          meta.category = value;
        } else if (key === 'coverImage') {
          meta.coverImage = value;
        } else if (key === 'excerpt') {
          meta.excerpt = value;
        } else if (key === 'slug') {
          meta.slug = value;
        }
      }

      content = md.substring(end + 3).trim();
    }
  }

  return { meta, content };
}

async function main() {
  const postsDir = join(process.cwd(), 'posts');
  console.log(`📂 扫描目录: ${postsDir}`);

  const files = readdirSync(postsDir).filter(f => extname(f) === '.md');
  let imported = 0, skipped = 0;

  for (const file of files) {
    const filePath = join(postsDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    const { meta, content } = parseFrontmatter(raw);

    const title = meta.title || file.replace(/\.md$/, '');

    if (!content.trim()) {
      console.log(`  ⚠ ${file}: 正文为空，跳过`);
      skipped++;
      continue;
    }

    // 检查标题是否已存在
    const existing = await prisma.post.findFirst({ where: { title } });
    if (existing) {
      console.log(`  ⏭ ${file}: 标题 "${title}" 已存在，跳过`);
      skipped++;
      continue;
    }

    // 查找分类
    let categoryId: number | null = null;
    if (meta.category) {
      const cat = await prisma.category.findFirst({ where: { name: meta.category } });
      if (!cat) {
        console.log(`  ⚠ ${file}: 分类 "${meta.category}" 不存在，跳过`);
        skipped++;
        continue;
      }
      categoryId = cat.id;
    }

    // 查找标签
    const tagRecords = [];
    if (meta.tags && meta.tags.length > 0) {
      for (const tagName of meta.tags) {
        const tag = await prisma.tag.findFirst({ where: { name: tagName } });
        if (tag) tagRecords.push(tag);
        else console.log(`  ⚠ ${file}: 标签 "${tagName}" 不存在，已忽略`);
      }
    }

    // 创建文章
    await prisma.post.create({
      data: {
        title,
        content,
        excerpt: meta.excerpt || null,
        coverImage: meta.coverImage || null,
        published: meta.published ?? false,
        categoryId,
        tags: tagRecords.length > 0
          ? { create: tagRecords.map(t => ({ tagId: t.id })) }
          : undefined,
      },
    });

    console.log(`  ✓ ${file} → "${title}"`);
    imported++;
  }

  console.log(`\n📊 导入完成: ${imported} 篇, 跳过 ${skipped} 篇`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
