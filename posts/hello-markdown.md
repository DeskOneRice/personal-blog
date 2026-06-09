---
title: 通过 MD 文件发布文章
category: 技术
tags: [JavaScript, TypeScript]
published: true
excerpt: 演示如何通过 Markdown 文件快速发布博客文章。
---

## 更方便的写作方式

直接用熟悉的 Markdown 编辑器（如 Typora、VS Code）写 `.md` 文件，
放到 `posts/` 目录下，运行 `npm run import:md` 即可导入到博客。

### 文件头部

用 `---` 包裹的 YAML 元信息定义文章属性：

- `title` — 文章标题
- `category` — 分类名（需在后台先创建）
- `tags` — 标签名列表（需先创建）
- `published` — true/false
- `coverImage` — 封面图 URL
- `excerpt` — 摘要
- `slug` — URL 标识（可选，默认取文件名）

### 正文

用标准 Markdown 语法写，支持代码块、表格、列表等。

### 导入

```bash
npm run import:md
```
