/**
 * 种子数据脚本
 * 运行: npm run db:seed
 * 作用: 插入示例数据，开发时不需要手动在数据库里填内容
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. 创建默认管理员
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@blog.local',
      password: adminPassword,
      role: 'admin',
      bio: '博客站长',
    },
  });
  console.log(`  ✓ Admin user: admin / admin123`);

  // 2. 创建分类
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'tech' },
      update: {},
      create: { name: '技术', slug: 'tech', description: '技术文章与教程', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'learning' },
      update: {},
      create: { name: '学习', slug: 'learning', description: '学习笔记与心得', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'daily' },
      update: {},
      create: { name: '日常', slug: 'daily', description: '生活记录与随想', sortOrder: 3 },
    }),
  ]);
  console.log(`  ✓ Categories: ${categories.map(c => c.name).join(', ')}`);

  // 3. 创建标签
  const tagNames = [
    'JavaScript', 'TypeScript', 'Python', 'React',
    '深度学习', 'PyTorch', '个人成长', '工具推荐',
  ];
  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
      })
    )
  );
  console.log(`  ✓ Tags: ${tags.map(t => t.name).join(', ')}`);

  // 4. 创建示例文章
  const posts = [
    {
      title: '从 PyTorch 到 Web 开发：我的跨界学习之路',
      content: `## 为什么从 CV 转向 Web？

作为一名计算机视觉方向的开发者，我最近决定学习 Web 开发。这个决定看起来有些跳跃，但其实有很多相通之处。

### 相通的概念

\`\`\`python
# CV: 模型架构定义
class MyModel(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Conv2d(3, 64, 3)

    def forward(self, x):
        return self.conv(x)
\`\`\`

\`\`\`typescript
// Web: 数据模型定义
model Post {
  id    Int    @id
  title String
}
\`\`\`

### 为什么选择 Astro

- 内容优先的设计理念
- 可以嵌入多种框架组件
- 天然的 SEO 优势

> 学习新技术最好的方法就是做一个实际项目。这个博客就是我的实践作品。
`,
      coverImage: 'https://picsum.photos/seed/pytorch/800/450',
      excerpt: '从深度学习转向 Web 开发的心路历程，以及为什么选择 Astro 框架。',
      published: true,
      authorId: admin.id,
      categorySlug: 'learning',
      tagSlugs: ['python', 'pytorch', 'deep-learning'],
    },
    {
      title: '搭建个人博客的技术选型指南',
      content: `## 选择技术栈的考量

搭建个人博客时，技术栈的选择至关重要。分享一下我的决策过程。

### 静态 vs 动态

| 类型 | 代表 | 适合场景 |
|------|------|----------|
| 静态生成 | Hugo, Jekyll | 纯内容展示 |
| SSR | Next.js, Astro | 需要动态功能 |
| SPA | React, Vue | 交互密集应用 |

### 我选择 Astro + SQLite 的原因

1. **Astro** - 内容型网站的最佳框架
2. **SQLite** - 零配置，数据就是文件
3. **Tailwind CSS** - 原子化 CSS，开发效率高
4. **Prisma** - 类型安全的数据库操作

> 最好的技术栈是你能驾驭的那个。
`,
      coverImage: 'https://picsum.photos/seed/tech/800/450',
      excerpt: '详细介绍个人博客的技术选型思路：Astro + SQLite + Prisma + Tailwind CSS。',
      published: true,
      authorId: admin.id,
      categorySlug: 'tech',
      tagSlugs: ['javascript', 'typescript'],
    },
    {
      title: '我的日常开发工作流',
      content: `## 工具与习惯

记录一下我目前的开发环境和一些提高效率的工具。

### 编辑器配置

- **VS Code** 作为主力编辑器
- 主题：暗色模式护眼
- 必备插件：GitLens, Thunder Client

### 效率工具

1. \`Git\` + GitHub 管理所有代码
2. \`Notion\` 做知识管理
3. \`Claude\` 辅助编程和写作

### 每日节奏

- 上午：深度学习相关研究和工作
- 下午：Web 项目开发
- 晚上：整理笔记，写博客

保持学习，保持输出。`,
      excerpt: '分享我的日常开发环境和效率工具，以及如何平衡 CV 与 Web 的学习时间。',
      published: true,
      authorId: admin.id,
      categorySlug: 'daily',
      tagSlugs: ['personal-growth', 'tool-recommendation'],
    },
  ];

  // 创建文章并关联分类和标签
  for (const postData of posts) {
    // 查找分类
    const category = await prisma.category.findUnique({
      where: { slug: postData.categorySlug },
    });

    // 查找标签
    const tagRecords = await Promise.all(
      postData.tagSlugs.map((slug) => prisma.tag.findUnique({ where: { slug } }))
    );

    // 检查文章是否已存在
    const existing = await prisma.post.findFirst({ where: { title: postData.title } });
    if (!existing) {
      await prisma.post.create({
        data: {
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          coverImage: postData.coverImage,
          published: postData.published,
          authorId: postData.authorId,
          categoryId: category?.id ?? null,
          tags: {
            create: tagRecords
              .filter((t): t is NonNullable<typeof t> => t !== null)
              .map((tag) => ({ tagId: tag.id })),
          },
        },
      });
      console.log(`  ✓ Post: ${postData.title}`);
    }
  }

  // 5. 创建友链示例
  const friends = [
    { name: 'GitHub', url: 'https://github.com', description: '代码托管平台' },
    { name: 'MDN', url: 'https://developer.mozilla.org', description: 'Web 开发文档' },
  ];
  for (const friend of friends) {
    await prisma.friend.upsert({
      where: { id: friends.indexOf(friend) + 1 },
      update: {},
      create: { name: friend.name, url: friend.url, description: friend.description, sortOrder: friends.indexOf(friend) },
    });
  }
  console.log(`  ✓ Friends: ${friends.map(f => f.name).join(', ')}`);

  // 6. 创建示例公告
  const announcementCount = await prisma.announcement.count();
  if (announcementCount === 0) {
    await prisma.announcement.create({
      data: {
        content: '🎉 博客正式上线！欢迎来到我的个人空间，这里记录我的技术学习与生活思考。',
        published: true,
      },
    });
    console.log('  ✓ Announcement: 初始公告已创建');
  }

  // 7. 站点配置
  const configs = [
    { key: 'siteName', value: 'My Tech Blog' },
    { key: 'siteDescription', value: '记录学习、技术与生活的个人博客' },
    { key: 'postsPerPage', value: '10' },
    { key: 'aboutContent', value: '## 关于我\n\n一名热爱技术的开发者，目前专注于深度学习和 Web 开发。这个博客记录我的学习历程和思考。' },
    { key: 'enableRegistration', value: 'false' },
    { key: 'dailyQuotes', value: '千里之行，始于足下。\n学而不思则罔，思而不学则殆。\nStay hungry, stay foolish.\n代码是写给人看的，顺便能在机器上运行。\n简单是可靠的先决条件。\n最好的代码是没有代码。\nDone is better than perfect.\n技术改变世界，代码书写人生。\n每天进步一点点。\n学习是一辈子的事。' },
    { key: 'announcement', value: '🎉 博客正式上线！欢迎来到我的个人空间，这里记录我的技术学习与生活思考。' },
    { key: 'aboutAvatar', value: '' },
    { key: 'aboutName', value: 'DeskOneRice' },
    { key: 'aboutRole', value: '全栈开发者 / 深度学习爱好者' },
    { key: 'aboutLocation', value: '地球' },
    { key: 'aboutGithub', value: 'https://github.com/DeskOneRice' },
    { key: 'aboutEmail', value: '' },
    { key: 'aboutEducation', value: 'XX大学 · 计算机科学' },
  ];
  for (const cfg of configs) {
    // 只新增不存在的配置，已有配置保留用户修改
    const exists = await prisma.siteConfig.findUnique({ where: { key: cfg.key } });
    if (!exists) {
      await prisma.siteConfig.create({ data: cfg });
    }
  }
  console.log(`  ✓ Site configs: ${configs.map(c => c.key).join(', ')}`);

  console.log('\n✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
